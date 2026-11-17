import makeWASocket, {
  Browsers,
  DisconnectReason,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { loadAuthState } from './auth.js';
import { listGroups, resolveGroupName } from './groups.js';
import {
  clearAuthDir,
  clearSignalSessions,
  authDirHasCreds,
  getAppConfig,
} from '../storage/storage.js';
import { startMonitor, stopMonitor } from '../services/monitor.js';
import {
  rememberMessage,
  getMessage,
  clearMessageStore,
} from './messageStore.js';

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
    this.intentionalDisconnect = false;
    /** @type {ReturnType<typeof setTimeout> | null} */
    this.reconnectTimer = null;
    this.socketGeneration = 0;
    /** @type {Promise<void> | null} */
    this.startLock = null;
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
      deleteImages: appConfig.deleteImages === true,
      monitoring,
      hasSavedSession: await authDirHasCreds(),
    };
  }

  async connect({ forceQr = false } = {}) {
    if (this.status === 'connected' && this.sock && !forceQr) {
      return this.getStatus();
    }

    this.intentionalDisconnect = false;
    this.shouldReconnect = true;

    if (forceQr) {
      this._clearReconnectTimer();
      await this._teardownSocket();
      await clearAuthDir();
      clearMessageStore();
    }

    await this._startSocket();
    return this.getStatus();
  }

  async tryRestoreSession() {
    const hasCreds = await authDirHasCreds();
    if (!hasCreds) return;
    this.shouldReconnect = true;
    this.intentionalDisconnect = false;
    try {
      await this._startSocket();
    } catch (error) {
      console.error('[whatsapp] falha ao restaurar sessão:', error.message);
      this.status = 'disconnected';
      this.emit();
    }
  }

  /** Renegocia sessões Signal (Bad MAC) sem pedir QR de novo. */
  async resetSignalSessions() {
    this._clearReconnectTimer();
    await this._teardownSocket();
    await clearSignalSessions();
    clearMessageStore();
    this.shouldReconnect = true;
    this.intentionalDisconnect = false;
    await this._startSocket();
    return this.getStatus();
  }

  _clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  async _startSocket() {
    // Serializa starts — evita 2 sockets com a mesma auth (Bad MAC)
    while (this.startLock) {
      await this.startLock;
    }

    let release;
    this.startLock = new Promise((resolve) => {
      release = resolve;
    });

    try {
      this._clearReconnectTimer();
      await this._teardownSocket();

      const generation = ++this.socketGeneration;
      const { state, saveCreds } = await loadAuthState();

      this.status =
        this.status === 'connected' || this.status === 'reconnecting'
          ? 'reconnecting'
          : 'connecting';
      this.qr = null;
      this.emit();

      const sock = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        logger,
        browser: Browsers.ubuntu('Chrome'),
        printQRInTerminal: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: false,
        getMessage,
      });

      this.sock = sock;

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('messages.upsert', ({ messages }) => {
        for (const message of messages || []) {
          rememberMessage(message);
        }
      });

      sock.ev.on('connection.update', (update) => {
        if (generation !== this.socketGeneration || this.sock !== sock) return;
        this._onConnectionUpdate(sock, generation, update).catch((error) => {
          console.error('[whatsapp] connection.update:', error.message);
        });
      });
    } finally {
      release();
      this.startLock = null;
    }
  }

  async _onConnectionUpdate(sock, generation, update) {
    if (generation !== this.socketGeneration || this.sock !== sock) return;

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
      return;
    }

    if (connection !== 'close') return;

    stopMonitor();
    const statusCode = lastDisconnect?.error?.output?.statusCode;
    const loggedOut = statusCode === DisconnectReason.loggedOut;
    const restartRequired = statusCode === DisconnectReason.restartRequired;

    if (this.intentionalDisconnect || loggedOut) {
      this.status = 'disconnected';
      this.qr = null;
      this.account = null;
      this.sock = null;
      if (loggedOut && !this.intentionalDisconnect) {
        await clearAuthDir();
        clearMessageStore();
      }
      this.emit();
      return;
    }

    if (!this.shouldReconnect) {
      this.status = 'disconnected';
      this.sock = null;
      this.emit();
      return;
    }

    this.status = 'reconnecting';
    this.qr = null;
    this.emit();

    const delayMs = restartRequired ? 500 : 2000;
    this._clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect && !this.intentionalDisconnect) {
        this._startSocket().catch((error) => {
          console.error('[whatsapp] reconnect falhou:', error.message);
          this.status = 'disconnected';
          this.emit();
        });
      }
    }, delayMs);
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
    this._clearReconnectTimer();
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
    clearMessageStore();

    this.status = 'disconnected';
    this.qr = null;
    this.account = null;
    this.emit();
    return this.getStatus();
  }

  async _teardownSocket() {
    stopMonitor();
    const sock = this.sock;
    this.sock = null;
    if (!sock) return;

    try {
      sock.ev.removeAllListeners('connection.update');
      sock.ev.removeAllListeners('creds.update');
      sock.ev.removeAllListeners('messages.upsert');
      sock.end?.(undefined);
    } catch {
      // ignore
    }
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
