import { Router } from 'express';
import admin from 'firebase-admin';

export const authRouter = Router();
const db = admin.firestore();

// Validação de Identidade (ID-CCGU / ID-CFRH)
authRouter.post('/validate-identity', async (req, res) => {
  const { idCcgu, idCfrh } = req.body;
  
  if (!idCcgu || !idCfrh) {
    return res.status(400).json({ 
      error: 'ID-CCGU e ID-CFRH são obrigatórios para validação institucional.',
      lang: 'pt-BR' 
    });
  }

  try {
    // Busca na fonte da verdade (SSOT)
    const userSnap = await db.collection('users')
      .where('id_ccgu', '==', idCcgu)
      .where('id_cfrh', '==', idCfrh)
      .limit(1)
      .get();

    if (userSnap.empty) {
      return res.status(404).json({ 
        error: 'Identidade não encontrada ou inativa no sistema de governança.',
        lang: 'pt-BR'
      });
    }

    const userData = userSnap.docs[0].data();
    res.json({ 
      success: true, 
      profile: userData,
      lang: 'pt-BR'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno ao validar identidade.', lang: 'pt-BR' });
  }
});

authRouter.get('/profile/:uid', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Perfil não encontrado.', lang: 'pt-BR' });
    }
    res.json({ ...userDoc.data(), lang: 'pt-BR' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perfil.', lang: 'pt-BR' });
  }
});
