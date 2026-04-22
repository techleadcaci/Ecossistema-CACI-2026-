import { Router } from 'express';

export const esgRouter = Router();

// Maturidade ESG (BLOQUEADO)
esgRouter.get('/status', (req, res) => {
  res.json({ 
    status: 'BLOQUEADO',
    message: 'Metodologia ESG pendente de definição normativa oficial.',
    lang: 'pt-BR'
  });
});

esgRouter.post('/evaluate', (req, res) => {
  res.status(403).json({
    error: 'Avaliação ESG desabilitada: Metodologia pendente.',
    lang: 'pt-BR'
  });
});
