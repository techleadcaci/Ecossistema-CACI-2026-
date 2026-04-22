import { Router } from 'express';
import admin from 'firebase-admin';

export const cmsRouter = Router();
const db = admin.firestore();

const AUTHORIZED_EDITOR = 'comunica@caci.ong.br';

const checkCmsEditor = (req: any, res: any, next: any) => {
  const { userEmail } = req.body; // Em produção usaríamos o token de auth decodificado
  if (userEmail !== AUTHORIZED_EDITOR) {
    return res.status(403).json({ 
      error: 'Escrita exclusiva: comunica@caci.ong.br', 
      lang: 'pt-BR' 
    });
  }
  next();
};

cmsRouter.post('/publish', checkCmsEditor, async (req, res) => {
  const { content, idCfrh, idCcgu } = req.body;
  
  try {
    const versionRef = db.collection('cms_content').doc();
    const versionId = versionRef.id;

    await versionRef.set({
      content,
      published_by: AUTHORIZED_EDITOR,
      idCfrh,
      idCcgu,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      version: versionId
    });

    // Registrar Auditoria
    await db.collection('audit_logs').add({
      action: 'CMS_PUBLISH',
      idCcgu,
      idCfrh,
      impact: 'MEDIUM',
      metadata: { versionId },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, versionId, lang: 'pt-BR' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao publicar conteúdo.', lang: 'pt-BR' });
  }
});

cmsRouter.get('/content', async (req, res) => {
  try {
    const latest = await db.collection('cms_content')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (latest.empty) return res.json({ lang: 'pt-BR', content: null });
    res.json({ ...latest.docs[0].data(), lang: 'pt-BR' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar conteúdo CMS.', lang: 'pt-BR' });
  }
});
