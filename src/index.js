import { config } from './config/config.js';
import { createServer, printBanner } from './server.js';
import { whatsappClient } from './whatsapp/client.js';

async function main() {
  const { server } = await createServer();

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, resolve);
  });

  printBanner(config.port, { dev: config.isDev });

  // Restaura sessão salva sem exigir QR
  await whatsappClient.tryRestoreSession();
}

main().catch((error) => {
  console.error('Falha ao iniciar o aplicativo:', error);
  process.exit(1);
});
