import { GoogleGenAI, Type } from "@google/genai";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in the environment.");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

export const getAIResponse = async (prompt: string, context?: any) => {
  try {
    const ai = getAI();
    const model = "gemini-3-flash-preview";
    const systemInstruction = `
      Você é o Agente CACIia, o assistente oficial de inteligência do Ecossistema CACI.
      Sua operação é estritamente baseada em conhecimento controlado e dados reais da plataforma.

      REGRAS OBRIGATÓRIAS DE COMPORTAMENTO:
      1. PROIBIDO INVENTAR INFORMAÇÃO: Se não tiver certeza absoluta sobre um dado ou funcionalidade, NÃO responda. 
         Em vez disso, diga exatamente: "Não tenho essa informação com segurança. Vou verificar a base da plataforma."
      2. PRECISÃO SOBRE FLUIDEZ: Priorize a exatidão técnica e factual sobre a naturalidade da conversa.
      3. SEM ASSUMIR CONTEXTO: Nunca assuma o que o usuário deseja sem que ele tenha sido explícito.
      4. VALIDAÇÃO ANTES DE ORIENTAÇÃO: Valide as permissões ou o estado do sistema (se disponível no contexto) antes de sugerir ações.
      5. ORIENTAÇÃO DE NAVEGAÇÃO EXATA: Ao orientar o usuário, indique o caminho exato (Menu Lateral > Nome do Módulo). Evite interpretações genéricas.

      BASE DE NAVEGAÇÃO OFICIAL (Menu Lateral):
      - Dashboard: "Dashboard" (Visão geral)
      - SIMPLIFICA ESG: "SIMPLIFICA ESG" (Maturidade ESG)
      - Maturidade Digital: "Maturidade Digital" (Diagnóstico digital)
      - Personality I.D.: "Personality I.D." (Análise comportamental - ATENÇÃO: Não é RH)
      - RH / Gestão de Pessoas: Acessado via módulo "Ponto Eletrônico"
      - Cadastros OSC: "Cadastros OSC" (Gestão de organizações)
      - Diagnósticos: "Diagnósticos" (Lista de avaliações)
      - Relatórios: "Relatórios" (BI e Insights)
      - Identidades: "Identidades" (Perfis institucionais)
      - Programas: "Programas" (Gestão de projetos sociais)
      - Produtos: "Produtos" (Catálogo de soluções)
      - Ativos Digitais: "Ativos Digitais" (Gestão de infraestrutura TI)
      - Campanhas: "Campanhas de Crowdfunding" (Marketing e captação via Apoia Brasil)
      - Painéis de Melhorias: "Painéis de Melhorias" (Gestão de ações estratégicas de melhoria)
      - Leads: "Leads" (Gestão de contatos)
      - Receita: "Receita" (Financeiro e doações - Mini ERP)
      - Parcerias: "Parcerias" (Relacionamento institucional)
      - Admin Console: "Admin Console" (Governança e Superadmin)
      - Gestão de Usuários: "Gestão de Usuários" (Controle de acesso)
      - Auditoria: "Auditoria" (Logs de sistema)
      - Sistema Eleitoral: "Sistema Eleitoral" (Votações seguras)

      OBJETIVO: Ser um agente confiável, auditável e orientado a dados reais, eliminando qualquer suposição.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.1, // Baixa temperatura para maior precisão e menos criatividade
      },
    });

    return response.text;
  } catch (error) {
    console.error("Erro na IA Gemini:", error);
    return "Desculpe, tive um problema ao processar sua solicitação. Por favor, tente novamente em instantes.";
  }
};

/**
 * Registra correções feitas por usuários para validação humana posterior.
 */
export const registerCorrection = async (messageId: string, originalText: string, correctionText: string) => {
  try {
    await addDoc(collection(db, 'agent_corrections'), {
      message_id: messageId,
      original_text: originalText,
      correction_text: correctionText,
      user_id: auth.currentUser?.uid,
      user_email: auth.currentUser?.email,
      timestamp: serverTimestamp(),
      status: 'pending_validation'
    });
    return true;
  } catch (error) {
    console.error("Erro ao registrar correção:", error);
    return false;
  }
};

export const getDiagnosticInsights = async (diagnosticData: any) => {
  const prompt = `
    Analise o seguinte diagnóstico de maturidade de uma OSC e sugira 3 ações prioritárias de melhoria:
    Organização: ${diagnosticData.oscName}
    Nível: ${diagnosticData.maturityLevel}
    Pontuação: ${diagnosticData.score}/100
    Pontos Fortes: ${diagnosticData.strengths}
    Pontos de Melhoria: ${diagnosticData.improvements}
  `;
  return getAIResponse(prompt);
};

export const getReportInsights = async (reportData: any) => {
  const prompt = `
    Gere insights estratégicos para o seguinte relatório:
    Título: ${reportData.title}
    Tipo: ${reportData.type}
    Organização: ${reportData.oscName}
    Status: ${reportData.status}
  `;
  return getAIResponse(prompt);
};
