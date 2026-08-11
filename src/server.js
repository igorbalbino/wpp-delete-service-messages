import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { WebSocketServer } from 'ws';
import { config } from './config/config.js';
import {
  getAppConfig,
  saveAppConfig,
  getActivity,
} from './storage/storage.js';
import { whatsappClient } from './whatsapp/client.js';

export function createServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  app.use(express.json());

  const broadcast = (payload) => {
    const data = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === 1) {
        client.send(data);
      }
    }
  };

  const pushStatus = async () => {
    const status = await whatsappClient.getPublicStatus();
    broadcast({ type: 'status', data: status });
  };

  const pushActivity = async () => {
    const activity = await getActivity();
    broadcast({ type: 'activity', data: activity });
  };

  whatsappClient.onChange(() => {
    pushStatus().catch(() => {});
  });

  // Allow monitor to notify activity updates
  whatsappClient.emitActivity = () => {
    pushActivity().catch(() => {});
    pushStatus().catch(() => {});
  };

  wss.on('connection', async (socket) => {
    try {
      const status = await whatsappClient.getPublicStatus();
      const activity = await getActivity();
      socket.send(JSON.stringify({ type: 'status', data: status }));
      socket.send(JSON.stringify({ type: 'activity', data: activity }));
    } catch {
      // ignore
    }
  });

  app.get('/api/status', async (_req, res) => {
    try {
      const status = await whatsappClient.getPublicStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/config', async (_req, res) => {
    try {
      const cfg = await getAppConfig();
      res.json(cfg);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/config', async (req, res) => {
    try {
      const updates = {};
      if (typeof req.body?.dryRun === 'boolean') {
        updates.dryRun = req.body.dryRun;
      }
      const cfg = await saveAppConfig(updates);
      await pushStatus();
      res.json(cfg);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/groups', async (_req, res) => {
    try {
      const groups = await whatsappClient.getGroups();
      res.json(groups);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/activity', async (_req, res) => {
    try {
      const activity = await getActivity();
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/connect', async (req, res) => {
    try {
      const forceQr = Boolean(req.body?.forceQr);
      const status = await whatsappClient.connect({ forceQr });
      await pushStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/disconnect', async (_req, res) => {
    try {
      const status = await whatsappClient.disconnect();
      await pushStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/group', async (req, res) => {
    try {
      const groupJid = req.body?.groupJid;
      if (!groupJid || typeof groupJid !== 'string') {
        return res.status(400).json({ error: 'groupJid é obrigatório' });
      }

      let groupName = req.body?.groupName || null;
      if (!groupName) {
        groupName = (await whatsappClient.resolveGroupName(groupJid)) || groupJid;
      }

      const cfg = await saveAppConfig({ groupJid, groupName });
      await pushStatus();
      res.json(cfg);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Static frontend (production / npm start)
  const distDir = config.webDistDir;
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
        return next();
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) => {
      res
        .status(200)
        .type('html')
        .send(
          `<!doctype html><html><body style="font-family:system-ui;padding:2rem">
          <h1>WhatsApp Service Filter</h1>
          <p>Frontend ainda não foi buildado.</p>
          <p>Em desenvolvimento, use <code>npm run dev</code> e abra o Vite.</p>
          <p>Em produção: <code>npm run build && npm start</code></p>
          </body></html>`,
        );
    });
  }

  return { app, server, pushStatus, pushActivity };
}

export function printBanner(port) {
  const line = '──────────────────────────────';
  console.log('');
  console.log('WhatsApp Service Filter');
  console.log(line);
  console.log('');
  console.log('✓ Servidor iniciado');
  console.log('');
  console.log('Painel:');
  console.log(`http://localhost:${port}`);
  console.log('');
}
