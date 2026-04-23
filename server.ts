import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import admin from 'firebase-admin';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const configPath = path.join(__dirname, 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseConfig.projectId,
  });
}

const db = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(cors());
  app.use(express.json());

  // Root Health Check (critical for Cloud Run)
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Language Middleware
  app.use((req, res, next) => {
    res.setHeader('Content-Language', 'pt-BR');
    next();
  });

  // modular API routes
  const { authRouter } = await import('./src/api/auth');
  const { governanceRouter } = await import('./src/api/governance');
  const { metricsRouter } = await import('./src/api/metrics');
  const { esgRouter } = await import('./src/api/esg');
  const { automationRouter } = await import('./src/api/automation');
  const { cmsRouter } = await import('./src/api/cms');

  app.use('/api/auth', authRouter);
  app.use('/api/governance', governanceRouter);
  app.use('/api/metrics', metricsRouter);
  app.use('/api/esg', esgRouter);
  app.use('/api/automation', automationRouter);
  app.use('/api/cms', cmsRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // Check if it's an API route first (should have been caught by earlier middleware)
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CACI SSOT] Servidor iniciado na porta: ${PORT}`);
    console.log(`[GOVERNANÇA] Ambiente: ${process.env.NODE_ENV || 'production'}`);
    console.log(`[STARTUP] SSOT Ativado - Pronto para receber conexões.`);
  });
}

startServer();
