import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { config } from '../config/config.js';

/**
 * Anexa Vite em middlewareMode ao Express — um único processo/porta,
 * sem proxy WS (elimina ECONNABORTED do vite proxy).
 */
export async function attachViteDev(app, httpServer) {
  const vitePkg = path.join(
    config.webDir,
    'node_modules',
    'vite',
    'dist',
    'node',
    'index.js',
  );

  let createViteServer;
  try {
    ({ createServer: createViteServer } = await import(
      pathToFileURL(vitePkg).href
    ));
  } catch (error) {
    throw new Error(
      `Vite não encontrado em web/node_modules. Rode: npm install\n${error.message}`,
    );
  }

  const vite = await createViteServer({
    root: config.webDir,
    configFile: path.join(config.webDir, 'vite.config.js'),
    server: {
      middlewareMode: true,
      hmr: { server: httpServer },
    },
    appType: 'custom',
  });

  app.use(vite.middlewares);

  app.use(async (req, res, next) => {
    if (
      req.method !== 'GET' &&
      req.method !== 'HEAD'
    ) {
      return next();
    }
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/ws') ||
      req.path.startsWith('/@') ||
      req.path.startsWith('/src') ||
      req.path.startsWith('/node_modules')
    ) {
      return next();
    }

    try {
      const indexPath = path.join(config.webDir, 'index.html');
      let template = await fs.readFile(indexPath, 'utf8');
      template = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).setHeader('Content-Type', 'text/html').end(template);
    } catch (error) {
      vite.ssrFixStacktrace?.(error);
      next(error);
    }
  });

  return vite;
}
