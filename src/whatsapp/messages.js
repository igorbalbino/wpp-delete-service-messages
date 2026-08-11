/**
 * Extrai texto útil de uma mensagem Baileys.
 */
export function extractMessageText(message) {
  if (!message?.message) return null;

  const m = message.message;

  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage?.caption) return m.imageMessage.caption;
  if (m.videoMessage?.caption) return m.videoMessage.caption;
  if (m.documentMessage?.caption) return m.documentMessage.caption;
  if (m.buttonsMessage?.contentText) return m.buttonsMessage.contentText;
  if (m.listMessage?.description) return m.listMessage.description;

  // ephemeral / viewOnce wrappers
  const ephemeral = m.ephemeralMessage?.message;
  if (ephemeral) {
    return extractMessageText({ message: ephemeral });
  }
  const viewOnce = m.viewOnceMessage?.message || m.viewOnceMessageV2?.message;
  if (viewOnce) {
    return extractMessageText({ message: viewOnce });
  }

  return null;
}

export function isGroupJid(jid) {
  return typeof jid === 'string' && jid.endsWith('@g.us');
}

/**
 * Apaga mensagem para todos (requer admin no grupo).
 */
export async function deleteMessageForEveryone(sock, message) {
  if (!sock || !message?.key?.remoteJid) {
    throw new Error('Mensagem inválida para exclusão');
  }
  await sock.sendMessage(message.key.remoteJid, { delete: message.key });
}
