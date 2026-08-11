import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { loadAuthState } from './auth.js';
import { listGroups, resolveGroupName } from './groups.js';
import { clearAuthDir, authDirHasCreds, getAppConfig } from '../storage/storage.js';
import { startMonitor, stopMonitor } from '../services/monitor.js';

const logger = pino({ level: 'silent' });

/** @typedef {'disconnected' | 'connecting' | 'qr' | 'connected' | 'reconnecting'} ConnectionStatus */

class WhatsAppClient {
  constructor() {
    this.sock = null;
    /** @type {ConnectionStatus} */
    this.status = 'disconnected';
    this.qr = null;
    this.account = null;
    this.listeners = new Set();
    this.shouldReconnect = true;
    this.connecting = false;
    this.intentionalDisconnect = false;
  }

  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit() {
    const snapshot = this.getStatus();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        // ignore listener errors
      }
    }
  }

  getStatus() {
    return {
      status: this.status,
      qr: this.qr,
      account: this.account,
      connected: this.status === 'connected',
    };
  }

  async getPublicStatus() {
    const appConfig = await getAppConfig();
    const connected = this.status === 'connected';
    const hasGroup = Boolean(appConfig.groupJid);
    const monitoring = connected && hasGroup;

    return {
      ...this.getStatus(),
      group: appConfig.groupJid
        ? { jid: appConfig.groupJid, name: appConfig.groupName }
        : null,
      dryRun: appConfig.dryRun,
      monitoring,
      hasSavedSession: await authDirHasCreds(),
    };
  }

  async connect({ forceQr = false } = {}) {
    if (this.connecting) return this.getStatus();
    if (this.status === 'connected' && this.sock && !forceQr) {
      return this.getStatus();
    }

    this.intentionalDisconnect = false;
    this.shouldReconnect = true;
    this.connecting = true;

    if (forceQr) {
      await this._teardownSocket();
      await clearAuthDir();
    }

    try {
      await this._startSocket();
    } finally {
      this.connecting = false;
    }

    return this.getStatus();
  }

  async tryRestoreSession() {
    const hasCreds = await authDirHasCreds();
    if (!hasCreds) return;
    this.shouldReconnect = true;
    this.intentionalDisconnect = false;
    try {
      await this._startSocket();
    } catch {
      this.status = 'disconnected';
      this.emit();
    }
  }

  async _startSocket() {
    const { state, saveCreds } = await loadAuthState();
    const { version } = await fetchLatestBaileysVersion();

    this.status = this.status === 'connected' ? 'reconnecting' : 'connecting';
    this.qr = null;
    this.emit();

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
    });

    this.sock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.status = 'qr';
        this.qr = qr;
        this.account = null;
        this.emit();
      }

      if (connection === 'open') {
        this.status = 'connected';
        this.qr = null;
        this.account = this._readAccount(sock);
        this.emit();
        startMonitor(sock, () => this.emitActivity?.());
      }

      if (connection === 'close') {
        stopMonitor();
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        if (this.intentionalDisconnect || loggedOut) {
          this.status = 'disconnected';
          this.qr = null;
          this.account = null;
          this.sock = null;
          if (loggedOut && !this.intentionalDisconnect) {
            await clearAuthDir();
          }
          this.emit();
          return;
        }

        if (this.shouldReconnect) {
          this.status = 'reconnecting';
          this.qr = null;
          this.emit();
          setTimeout(() => {
            if (this.shouldReconnect && !this.intentionalDisconnect) {
              this._startSocket().catch(() => {
                this.status = 'disconnected';
                this.emit();
              });
            }
          }, 2000);
        } else {
          this.status = 'disconnected';
          this.sock = null;
          this.emit();
        }
      }
    });

    }

  _readAccount(sock) {
    const user = sock.user;
    if (!user) return null;
    const jid = user.id || '';
    const number = jid.replace(/:.*/, '').replace(/@.*$/, '');
    const formatted = number
      ? `+${number.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '$1 $2 $3-$4')}`
      : null;

    return {
      name: user.name || user.notify || sock.authState?.creds?.me?.name || 'Conta conectada',
      number: formatted || number || null,
      jid,
    };
  }

  async disconnect() {
    this.intentionalDisconnect = true;
    this.shouldReconnect = false;
    stopMonitor();

    try {
      if (this.sock) {
        await this.sock.logout().catch(() => {});
      }
    } catch {
      // ignore
    }

    await this._teardownSocket();
    await clearAuthDir();

    this.status = 'disconnected';
    this.qr = null;
    this.account = null;
    this.emit();
    return this.getStatus();
  }

  async _teardownSocket() {
    stopMonitor();
    if (this.sock) {
      try {
        this.sock.ev.removeAllListeners('connection.update');
        this.sock.ev.removeAllListeners('creds.update');
        this.sock.end?.(undefined);
      } catch {
        // ignore
      }
    }
    this.sock = null;
  }

  async getGroups() {
    if (this.status !== 'connected' || !this.sock) {
      throw new Error('WhatsApp não está conectado');
    }
    return listGroups(this.sock);
  }

  async resolveGroupName(groupJid) {
    if (!this.sock) return null;
    return resolveGroupName(this.sock, groupJid);
  }

  getSocket() {
    return this.sock;
  }
}

export const whatsappClient = new WhatsAppClient();
export default whatsappClient;
