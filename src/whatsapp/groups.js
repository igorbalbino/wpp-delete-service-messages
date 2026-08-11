/**
 * Lista grupos em que a conta participa.
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 */
export async function listGroups(sock) {
  if (!sock) return [];
  const groups = await sock.groupFetchAllParticipating();
  return Object.values(groups)
    .map((g) => ({
      jid: g.id,
      name: g.subject || g.id,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export async function resolveGroupName(sock, groupJid) {
  if (!sock || !groupJid) return null;
  try {
    const groups = await sock.groupFetchAllParticipating();
    return groups[groupJid]?.subject || null;
  } catch {
    return null;
  }
}
