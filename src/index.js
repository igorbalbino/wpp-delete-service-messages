import { config } from './config/config.js';
import { createServer, printBanner } from './server.js';
import { whatsappClient } from './whatsapp/client.js';

async function main() {
  const { server } = createServer();

  server.listen(config.port, async () => {
    printBanner(config.port);
    // Restaura sessão salva sem exigir QR
    await whatsappClient.tryRestoreSession();
  });
}

main().catch((error) => {
  console.error('Falha ao iniciar o aplicativo:', error);
  process.exit(1);
});
