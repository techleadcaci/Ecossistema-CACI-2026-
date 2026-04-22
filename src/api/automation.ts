import { Router } from 'express';
import admin from 'firebase-admin';
import axios from 'axios';

export const automationRouter = Router();
const db = admin.firestore();

automationRouter.post('/whatsapp/send', async (req, res) => {
  const { phone, message, idCfrh } = req.body;

  // Validação Z-API (Placeholders de Governança)
  const instance = process.env.ZAPI_INSTANCE;
  const token = process.env.ZAPI_TOKEN;

  if (!instance || !token) {
    return res.status(503).json({ 
      error: 'Serviço de mensageria não configurado no ambiente de produção.',
      lang: 'pt-BR'
    });
  }

  try {
    const response = await axios.post(`https://api.z-api.io/instances/${instance}/token/${token}/send-text`, {
      phone,
      message
    });

    // Auditoria
    await db.collection('audit_logs').add({
      action: 'AUTOMATION_WHATSAPP_SEND',
      idCfrh,
      impact: 'LOW',
      metadata: { status: response.status },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, lang: 'pt-BR' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao disparar automação.', lang: 'pt-BR' });
  }
});
