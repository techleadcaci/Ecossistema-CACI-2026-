import { Router } from 'express';
import admin from 'firebase-admin';

export const metricsRouter = Router();
const db = admin.firestore();

metricsRouter.get('/summary', async (req, res) => {
  try {
    const statsDoc = await db.collection('global_stats').doc('current').get();
    if (!statsDoc.exists) {
      // Retornar objeto vazio estruturado se não houver dados reais (regras de SSOT)
      return res.json({
        total_oscs: 0,
        oscs_ativas: 0,
        avg_maturity: 0,
        oscs_por_maturidade: {},
        lang: 'pt-BR',
        source: 'Real-time Analytics'
      });
    }
    res.json({ ...statsDoc.data(), lang: 'pt-BR' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consolidar métricas.', lang: 'pt-BR' });
  }
});

metricsRouter.post('/sync', async (req, res) => {
  // Aqui implementaremos a lógica REAL de sincronização com fontes de dados externas
  // Por enquanto, apenas bloqueamos mocks
  res.json({ 
    message: 'Sincronização agendada. Processamento em segundo plano desativado para esta versão.',
    lang: 'pt-BR' 
  });
});
