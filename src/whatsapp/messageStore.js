/**
 * Cache em memória das mensagens recentes — necessário para o getMessage
 * do Baileys reenviar/recuperar após falha de decrypt (Bad MAC / retry).
 */

const MAX_MESSAGES = 200;

/** @type {Map<string, import('@whiskeysockets/baileys').WAMessage>} */
const store = new Map();

function cacheKey(key) {
  if (!key?.id) return null;
  const fromMe = key.fromMe ? '1' : '0';
  const remote = key.remoteJid || '';
  return `${remote}|${fromMe}|${key.id}`;
}

export function rememberMessage(message) {
  const id = cacheKey(message?.key);
  if (!id || !message?.message) return;

  store.set(id, message);
  // também indexa só pelo id (fallback usado por retries)
  store.set(message.key.id, message);

  while (store.size > MAX_MESSAGES * 2) {
    const oldest = store.keys().next().value;
    store.delete(oldest);
  }
}

/**
 * @param {import('@whiskeysockets/baileys').proto.IMessageKey} key
 * @returns {Promise<import('@whiskeysockets/baileys').proto.IMessage | undefined>}
 */
export async function getMessage(key) {
  if (!key?.id) return undefined;

  const exact = store.get(cacheKey(key));
  if (exact?.message) return exact.message;

  const byId = store.get(key.id);
  if (
    byId?.message &&
    (!key.remoteJid || byId.key?.remoteJid === key.remoteJid) &&
    (typeof key.fromMe !== 'boolean' || byId.key?.fromMe === key.fromMe)
  ) {
    return byId.message;
  }

  return undefined;
}

export function clearMessageStore() {
  store.clear();
}
