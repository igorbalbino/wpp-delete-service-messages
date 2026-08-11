import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import { ensureAuthDir, getAuthDir } from '../storage/storage.js';

export async function loadAuthState() {
  await ensureAuthDir();
  return useMultiFileAuthState(getAuthDir());
}
