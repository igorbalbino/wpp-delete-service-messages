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
  isImageMessage,
} from '../whatsapp/messages.js';

let activeSock = null;
let handler = null;
let onActivity = null;

const PREVIEW_MAX = 120;

function previewText(text) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (cleaned.length <= PREVIEW_MAX) return cleaned;
  return `${cleaned.slice(0, PREVIEW_MAX - 1)}…`;
}

async function recordActivity(entry) {
  const activity = await addActivity(entry);
  onActivity?.(activity);
  return activity;
}

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
  console.log('[monitor] ativo — aguardando mensagens do grupo');
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

  const remoteJid = message.key.remoteJid;
  if (!isGroupJid(remoteJid)) return;
  if (remoteJid !== appConfig.groupJid) return;

  // Ignorar eventos que não são mensagens de conteúdo
  if (message.messageStubType) return;

  const fromMe = Boolean(message.key.fromMe);

  // Foto: apaga na hora, sem classificar legenda nem conteúdo.
  if (appConfig.deleteImages && isImageMessage(message)) {
    const caption = previewText(extractMessageText(message));
    const preview = caption || '[imagem]';

    if (fromMe) {
      await recordActivity({
        category: 'image',
        action: 'kept',
        reason: 'Mensagem própria — apenas registrada no painel',
        preview,
        fromMe: true,
      });
      return;
    }

    if (appConfig.dryRun) {
      await recordActivity({
        category: 'image',
        action: 'ignored_dry_run',
        reason: 'Imagem identificada — exclusão automática (DRY RUN)',
        preview,
        fromMe: false,
      });
      return;
    }

    try {
      await deleteMessageForEveryone(activeSock, message);
      await recordActivity({
        category: 'image',
        action: 'removed',
        reason: 'Imagem identificada e removida sem analisar o conteúdo',
        preview,
        fromMe: false,
      });
    } catch (error) {
      await recordActivity({
        category: 'image',
        action: 'ignored',
        reason: `Falha ao remover: ${error.message}`,
        preview,
        fromMe: false,
      });
    }
    return;
  }

  const text = extractMessageText(message);
  if (!text) return;

  const preview = previewText(text);
  const result = detectService(text);

  // Mensagens próprias: mostra no painel, nunca apaga
  if (fromMe) {
    await recordActivity({
      category: result.category,
      action: 'kept',
      reason: 'Mensagem própria — apenas registrada no painel',
      preview,
      fromMe: true,
    });
    return;
  }

  const shouldDelete =
    result.isService &&
    result.confidence >= config.confidenceThreshold;

  if (!shouldDelete) {
    await recordActivity({
      category: result.category,
      action: 'kept',
      reason: result.reason,
      preview,
      fromMe: false,
    });
    return;
  }

  if (appConfig.dryRun) {
    await recordActivity({
      category: result.category,
      action: 'ignored_dry_run',
      reason: result.reason,
      preview,
      fromMe: false,
    });
    return;
  }

  try {
    await deleteMessageForEveryone(activeSock, message);
    await recordActivity({
      category: result.category,
      action: 'removed',
      reason: result.reason,
      preview,
      fromMe: false,
    });
  } catch (error) {
    await recordActivity({
      category: result.category,
      action: 'ignored',
      reason: `Falha ao remover: ${error.message}`,
      preview,
      fromMe: false,
    });
  }
}

export default { startMonitor, stopMonitor };
