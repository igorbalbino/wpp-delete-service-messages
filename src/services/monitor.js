import { config } from '../config/config.js';
import { detectService } from './serviceDetector.js';
import {
  addActivity,
  getAppConfig,
} from '../storage/storage.js';
import {
  deleteMessageForEveryone,
  extractMessageText,
  isGroupJid,
} from '../whatsapp/messages.js';

let activeSock = null;
let handler = null;
let onActivity = null;

export function startMonitor(sock, activityCallback) {
  stopMonitor();
  activeSock = sock;
  onActivity = activityCallback || null;

  handler = async (upsert) => {
    try {
      await handleUpsert(upsert);
    } catch (error) {
      console.error('[monitor] erro ao processar mensagem:', error.message);
    }
  };

  sock.ev.on('messages.upsert', handler);
}

export function stopMonitor() {
  if (activeSock && handler) {
    try {
      activeSock.ev.off('messages.upsert', handler);
    } catch {
      // ignore
    }
  }
  activeSock = null;
  handler = null;
  onActivity = null;
}

async function handleUpsert({ type, messages }) {
  if (!activeSock) return;
  if (type !== 'notify' && type !== 'append') return;

  const appConfig = await getAppConfig();
  if (!appConfig.groupJid) return;

  for (const message of messages || []) {
    await processMessage(message, appConfig);
  }
}

async function processMessage(message, appConfig) {
  if (!message?.key) return;
  if (message.key.fromMe) return;

  const remoteJid = message.key.remoteJid;
  if (!isGroupJid(remoteJid)) return;
  if (remoteJid !== appConfig.groupJid) return;

  // Ignorar eventos que não são mensagens de conteúdo
  if (message.messageStubType) return;

  const text = extractMessageText(message);
  if (!text) return;

  const result = detectService(text);
  const shouldDelete =
    result.isService &&
    result.confidence >= config.confidenceThreshold;

  if (!shouldDelete) {
    // Evita poluir o histórico com mensagens irrelevantes
    if (['job', 'rental', 'sale', 'purchase', 'service'].includes(result.category)) {
      const activity = await addActivity({
        category: result.category,
        action: 'ignored',
        reason: result.reason,
      });
      onActivity?.(activity);
    }
    return;
  }

  if (appConfig.dryRun) {
    const activity = await addActivity({
      category: 'service',
      action: 'ignored_dry_run',
      reason: result.reason,
    });
    onActivity?.(activity);
    return;
  }

  try {
    await deleteMessageForEveryone(activeSock, message);
    const activity = await addActivity({
      category: 'service',
      action: 'removed',
      reason: result.reason,
    });
    onActivity?.(activity);
  } catch (error) {
    const activity = await addActivity({
      category: 'service',
      action: 'ignored',
      reason: `Falha ao remover: ${error.message}`,
    });
    onActivity?.(activity);
  }
}

export default { startMonitor, stopMonitor };
