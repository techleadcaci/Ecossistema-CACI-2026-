import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc 
} from "firebase/firestore";
import axios from "axios";

// 🔹 1. Criar usuário automaticamente (Simulando Cloud Function)
export const createUserOnFormSubmit = async (data: any) => {
  try {
    const userRef = await addDoc(collection(db, "users"), {
      name: data.name,
      email: data.email,
      phone: data.phone,
      type: data.type || "lead",
      source: "form",
      created_at: serverTimestamp()
    });
    return userRef.id;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// 🔹 2. Classificar maturidade automaticamente (Simulando Cloud Function)
export const calculateMaturity = async (diagnosticId: string, scores: number[]) => {
  try {
    const total = scores.reduce((a, b) => a + b, 0) / scores.length;
    let level: "iniciante" | "intermediario" | "avancado" = "iniciante";

    if (total >= 7) level = "avancado";
    else if (total >= 4) level = "intermediario";

    const diagRef = doc(db, "diagnostics", diagnosticId);
    await updateDoc(diagRef, {
      overall_score: total,
      maturity_level: level
    });

    return { total, level };
  } catch (error) {
    console.error("Error calculating maturity:", error);
    throw error;
  }
};

// 🔹 3. Criar oportunidade automaticamente (Simulando Cloud Function)
export const createOpportunity = async (userId: string, organizationId: string, overallScore: number) => {
  try {
    let product = "curso";
    let value = 297;

    if (overallScore < 4) {
      product = "consultoria";
      value = 5000;
    } else if (overallScore >= 4 && overallScore < 7) {
      product = "comunidade";
      value = 1599;
    }

    await addDoc(collection(db, "opportunities"), {
      user_id: userId,
      organization_id: organizationId,
      product,
      value,
      status: "open",
      created_at: serverTimestamp()
    });
  } catch (error) {
    console.error("Error creating opportunity:", error);
    throw error;
  }
};

// 🔹 4. Registrar interação automática (Simulando Cloud Function)
export const createInteraction = async (userId: string) => {
  try {
    await addDoc(collection(db, "interactions"), {
      user_id: userId,
      type: "whatsapp",
      stage: "lead",
      notes: "Diagnóstico realizado - iniciar contato",
      created_at: serverTimestamp()
    });
  } catch (error) {
    console.error("Error creating interaction:", error);
    throw error;
  }
};

// 🔹 5. Enviar WhatsApp (Simulando Cloud Function)
export const sendWhatsApp = async (data: any) => {
  try {
    const message = `
Olá ${data.name},

Seu diagnóstico institucional foi iniciado.
Ponto de controle: ${data.maturity_level || 'Pendente'}
    `;

    // AGORA VIA BACKEND (SSOT)
    await axios.post('/api/automation/whatsapp/send', {
      phone: data.phone,
      message,
      idCfrh: 'SYSTEM_AUTO'
    });
  } catch (error) {
    console.error("Error sending WhatsApp via Backend:", error);
  }
};


// 🔹 6. Orquestrador Principal (Simulando Cloud Function)
export const processarEntradaEcossistema = async (formData: any, scores: any, total: number, level: string) => {
  try {
    // 1. Criar Usuário
    const userId = await createUserOnFormSubmit({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      type: formData.type || "lead"
    });

    // 2. Criar Organização
    const orgRef = await addDoc(collection(db, "organizations"), {
      name: formData.organization_name,
      city: formData.city,
      state: formData.state,
      year_founded: parseInt(formData.year_founded) || 0,
      legal_status: formData.legal_status,
      size: formData.size,
      main_area: formData.main_area,
      challenges: formData.challenges || [],
      owner_user_id: userId,
      created_at: serverTimestamp()
    });

    // 3. Criar Diagnóstico
    const diagRef = await addDoc(collection(db, "diagnostics"), {
      organization_id: orgRef.id,
      user_id: userId,
      ...scores,
      overall_score: total,
      maturity_level: level,
      created_at: serverTimestamp()
    });

    // 4. Criar Oportunidade
    await createOpportunity(userId, orgRef.id, total);

    // 5. Criar Interação
    await createInteraction(userId);

    // 6. Enviar WhatsApp (Async)
    sendWhatsApp({
      name: formData.name,
      phone: formData.phone,
      maturity_level: level,
      overall_score: total
    });

    return diagRef.id;
  } catch (error) {
    console.error("Error in processarEntradaEcossistema:", error);
    throw error;
  }
};
