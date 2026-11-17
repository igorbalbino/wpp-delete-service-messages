import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.VITE_API_PROXY || 'http://127.0.0.1:3000';

function quietProxyErrors(proxy) {
  const suppress = (err) => {
    const msg = err?.message || String(err || '');
    return (
      msg.includes('ECONNABORTED') ||
      msg.includes('ECONNRESET') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('EPIPE') ||
      msg.includes('socket hang up')
    );
  };

  proxy.on('error', (err, _req, res) => {
    if (!suppress(err)) {
      console.warn('[vite] proxy error:', err.message);
    }
    if (res && 'writeHead' in res && !res.headersSent) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API indisponível' }));
    } else if (res && typeof res.end === 'function') {
      try {
        res.end();
      } catch {
        // ignore
      }
    }
  });

  proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
    socket.on('error', (err) => {
      if (!suppress(err)) {
        console.warn('[vite] ws proxy socket:', err.message);
      }
    });
  });
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Usado só em `npm run dev:web` (modo separado).
      // `npm run dev` serve tudo na porta 3000 sem proxy.
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        configure: quietProxyErrors,
      },
      '/ws': {
        target: apiTarget,
        ws: true,
        changeOrigin: true,
        configure: quietProxyErrors,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
