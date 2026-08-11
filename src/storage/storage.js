import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config/config.js';

async function ensureDataDir() {
  await fs.mkdir(config.dataDir, { recursive: true });
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') return structuredClone(fallback);
    throw error;
  }
}

async function writeJson(filePath, data) {
  await ensureDataDir();
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

const defaultAppConfig = {
  groupJid: null,
  groupName: null,
  dryRun: config.dryRunDefault,
};

let appConfigCache = null;
let activityCache = null;

export async function getAppConfig() {
  if (!appConfigCache) {
    const stored = await readJson(config.configPath, defaultAppConfig);
    appConfigCache = {
      ...defaultAppConfig,
      ...stored,
      dryRun:
        typeof stored.dryRun === 'boolean' ? stored.dryRun : config.dryRunDefault,
    };
  }
  return { ...appConfigCache };
}

export async function saveAppConfig(partial) {
  const current = await getAppConfig();
  appConfigCache = {
    ...current,
    ...partial,
  };
  await writeJson(config.configPath, appConfigCache);
  return { ...appConfigCache };
}

export async function getActivity() {
  if (!activityCache) {
    activityCache = await readJson(config.activityPath, []);
    if (!Array.isArray(activityCache)) activityCache = [];
  }
  return [...activityCache];
}

export async function addActivity(entry) {
  const list = await getActivity();
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time: new Date().toISOString(),
    category: entry.category,
    action: entry.action,
    reason: entry.reason || null,
  };
  activityCache = [item, ...list].slice(0, config.maxActivityItems);
  await writeJson(config.activityPath, activityCache);
  return item;
}

export async function clearAuthDir() {
  try {
    await fs.rm(config.authDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

export function getAuthDir() {
  return config.authDir;
}

export async function ensureAuthDir() {
  await fs.mkdir(config.authDir, { recursive: true });
}

export async function authDirHasCreds() {
  try {
    const credsPath = path.join(config.authDir, 'creds.json');
    await fs.access(credsPath);
    return true;
  } catch {
    return false;
  }
}
