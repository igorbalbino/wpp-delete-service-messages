function unwrapMessageContent(content, depth = 0) {
  if (!content || typeof content !== 'object' || depth > 6) return null;
  if (content.imageMessage) return content;

  const nested =
    content.ephemeralMessage?.message ||
    content.viewOnceMessage?.message ||
    content.viewOnceMessageV2?.message ||
    content.viewOnceMessageV2Extension?.message ||
    content.documentWithCaptionMessage?.message ||
    content.editedMessage?.message ||
    content.associatedChildMessage?.message ||
    null;

  if (nested) return unwrapMessageContent(nested, depth + 1);

  const edited = content.protocolMessage?.editedMessage;
  if (edited) return unwrapMessageContent(edited, depth + 1);

  return content;
}

/**
 * Foto nativa do WhatsApp (incluindo visualização única, temporária e edição).
 * Não inclui figurinha nem arquivo enviado como documento.
 */
export function isImageMessage(message) {
  const content = unwrapMessageContent(message?.message);
  return Boolean(content?.imageMessage);
}

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
