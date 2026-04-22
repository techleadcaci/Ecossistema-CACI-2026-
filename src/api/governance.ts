import { Router } from 'express';
import admin from 'firebase-admin';

export const governanceRouter = Router();
const db = admin.firestore();

// Auditoria Institucional
const logAudit = async (action: string, idCcgu: string, idCfrh: string, impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', metadata: any) => {
  await db.collection('audit_logs').add({
    action,
    idCcgu,
    idCfrh,
    impact,
    metadata,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    environment: 'Cloud Run',
    instance: 'ecossistema-caci-desenvolvimento-de-oscs'
  });
};

governanceRouter.post('/audit', async (req, res) => {
  const { action, idCcgu, idCfrh, impact, metadata } = req.body;
  try {
    await logAudit(action, idCcgu, idCfrh, impact, metadata);
    res.json({ success: true, lang: 'pt-BR' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar auditoria.', lang: 'pt-BR' });
  }
});

// IMI - Diagnóstico Institucional (BLOQUEADO)
governanceRouter.get('/diagnostico/metodologia', (req, res) => {
  res.json({ 
    status: 'BLOQUEADO',
    message: 'Metodologia pendente de definição oficial pela Diretoria e Conselhos.',
    lang: 'pt-BR'
  });
});

governanceRouter.post('/diagnostico/calculate', (req, res) => {
  res.status(403).json({
    error: 'Cálculo de diagnóstico desabilitado: Metodologia pendente.',
    lang: 'pt-BR'
  });
});
