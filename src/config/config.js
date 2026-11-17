import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

const isDev =
  process.argv.includes('--dev') ||
  parseBool(process.env.DEV, false) ||
  process.env.NODE_ENV === 'development';

export const config = {
  rootDir,
  isDev,
  port: Number(process.env.PORT) || 3000,
  dryRunDefault: parseBool(process.env.DRY_RUN, true),
  /** Só apaga serviço ou anúncio com confidence >= este valor (0–1). */
  confidenceThreshold: 0.8,
  maxActivityItems: 50,
  authDir: path.join(rootDir, 'auth'),
  dataDir: path.join(rootDir, 'data'),
  configPath: path.join(rootDir, 'data', 'config.json'),
  activityPath: path.join(rootDir, 'data', 'activity.json'),
  webDir: path.join(rootDir, 'web'),
  webDistDir: path.join(rootDir, 'web', 'dist'),
};

export default config;
