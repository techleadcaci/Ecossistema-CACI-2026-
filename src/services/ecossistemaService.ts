import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  setDoc,
  getDoc,
  increment,
  orderBy,
  limit
} from 'firebase/firestore';
import { runDiagnosticEngine, DiagnosticResult } from './diagnosticEngine';
import { calculateDiagnostic, QUESTIONS } from './diagnosticMotor';
import { Answer, GlobalStats, MaturityLevel, MaturitySeal } from '../types';

// Operation types for error handling
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  let errorMessage = error instanceof Error ? error.message : String(error);
  
  // Translate common Firebase errors
  if (errorMessage.includes('missing or insufficient permissions')) {
    errorMessage = 'Permissões ausentes ou insuficientes para realizar esta operação.';
  } else if (errorMessage.includes('quota exceeded')) {
    errorMessage = 'Cota do banco de dados excedida. Por favor, tente novamente amanhã.';
  } else if (errorMessage.includes('offline')) {
    errorMessage = 'Você parece estar offline. Verifique sua conexão.';
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface AdesaoInput {
  user: {
    nome: string;
    email: string;
    telefone: string;
  };
  organization: {
    nome: string;
    cnpj: string;
    municipio: string;
    estado: string;
    ano_fundacao: number;
    area_atuacao: string;
    beneficiarios: number;
    colaboradores: number;
    captacao_ativa: boolean;
    desafios: string;
  };
  classification: {
    privada: boolean;
    sem_fins_lucrativos: boolean;
    institucionalizada: boolean;
    autoadministrada: boolean;
    voluntaria: boolean;
  };
  compliance: {
    aceitou_lgpd: boolean;
  };
  diagnosis?: {
    respostas: Record<string, number>;
  };
}

/**
 * processarAdesaoEcossistema
 * Central institutional function for the CACI Ecosystem.
 */
export async function processarAdesaoEcossistema(input: AdesaoInput) {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("Usuário deve estar autenticado para aderir ao ecossistema.");

  try {
    // 1. Classification Logic (IPEA)
    const isOSCValida = 
      input.classification.privada && 
      input.classification.sem_fins_lucrativos && 
      input.classification.institucionalizada && 
      input.classification.autoadministrada && 
      input.classification.voluntaria;

    const statusClassificacao = isOSCValida ? "OSC válida" : "Iniciativa em estruturação";

    // 2. Duplicate Check (Email or CNPJ)
    const emailQuery = query(collection(db, 'users'), where('email', '==', input.user.email));
    const emailSnap = await getDocs(emailQuery);
    if (!emailSnap.empty && emailSnap.docs[0].id !== userId) {
      throw new Error("Este e-mail já está cadastrado em outra conta.");
    }

    const cnpjQuery = query(collection(db, 'organizations'), where('cnpj', '==', input.organization.cnpj));
    const cnpjSnap = await getDocs(cnpjQuery);
    if (!cnpjSnap.empty) {
      throw new Error("Este CNPJ já está cadastrado no ecossistema.");
    }

    // 3. Create/Update User
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      name: input.user.nome,
      email: input.user.email,
      phone: input.user.telefone,
      type: 'organizacao',
      source: 'protocolo_adesao',
      status: 'cadastro_finalizado',
      created_at: serverTimestamp(),
    }, { merge: true });

    // 4. Create Organization
    const orgRef = await addDoc(collection(db, 'organizations'), {
      name: input.organization.nome,
      cnpj: input.organization.cnpj,
      city: input.organization.municipio,
      state: input.organization.estado,
      year_founded: input.organization.ano_fundacao,
      main_area: input.organization.area_atuacao,
      beneficiarios: input.organization.beneficiarios,
      colaboradores: input.organization.colaboradores,
      captacao_ativa: input.organization.captacao_ativa,
      challenges: input.organization.desafios,
      owner_user_id: userId,
      status_ipea: statusClassificacao,
      status: 'cadastro_finalizado',
      tipo_organizacao: 'padrao',
      created_at: serverTimestamp(),
    });
    const orgId = orgRef.id;

    // Update Global Stats
    await updateGlobalStats();

    // 5. Create Adesao Record
    await addDoc(collection(db, 'adesao_ecossistema'), {
      userId,
      organizationId: orgId,
      status: 'cadastro_finalizado',
      created_at: serverTimestamp(),
    });

    // 5. Create OSC Classification Record
    await addDoc(collection(db, 'osc_classification'), {
      organizationId: orgId,
      ...input.classification,
      status: statusClassificacao,
      created_at: serverTimestamp(),
    });

    // 6. Create Institutional Compliance (LGPD)
    await addDoc(collection(db, 'institutional_compliance'), {
      userId,
      organizationId: orgId,
      aceitou_lgpd: input.compliance.aceitou_lgpd,
      texto_consentimento: "Declaro que as informações prestadas são verdadeiras e autorizo o tratamento dos dados pelo Ecossistema CACI para fins de diagnóstico institucional, geração de indicadores e acompanhamento, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018).",
      created_at: serverTimestamp(),
    });

    // 7. Create Network Profile
    await addDoc(collection(db, 'network_profiles'), {
      userId,
      organizationId: orgId,
      name: input.organization.nome,
      type: 'osc',
      status: isOSCValida ? 'ativo' : 'em_estruturacao',
      created_at: serverTimestamp(),
    });

    // 8. Create Interaction (CRM)
    await addDoc(collection(db, 'interactions'), {
      user_id: userId,
      organization_id: orgId,
      type: 'ativacao',
      stage: 'lead',
      notes: `Protocolo de adesão concluído. Classificação: ${statusClassificacao}`,
      created_at: serverTimestamp(),
    });

    // 9. Create Institutional Follow-up (Opportunity)
    await addDoc(collection(db, 'opportunities'), {
      user_id: userId,
      organization_id: orgId,
      product: 'acompanhamento_institucional',
      status: 'open',
      priority: isOSCValida ? 'media' : 'alta',
      created_at: serverTimestamp(),
    });

    // 10. Handle Diagnosis (if provided)
    let scoreTotal = 0;
    let nivel: 'Iniciante' | 'Estruturação' | 'Avançado' = 'Iniciante';

    if (input.diagnosis) {
      const values = Object.values(input.diagnosis.respostas);
      const sum = values.reduce((a, b) => a + b, 0);
      scoreTotal = sum / values.length;

      if (scoreTotal >= 8) nivel = 'Avançado';
      else if (scoreTotal >= 5) nivel = 'Estruturação';
      else nivel = 'Iniciante';

      await addDoc(collection(db, 'diagnostics'), {
        organization_id: orgId,
        user_id: userId,
        ...input.diagnosis.respostas,
        overall_score: scoreTotal,
        maturity_level: nivel.toLowerCase(),
        created_at: serverTimestamp(),
      });

      // Update Org with maturity
      await updateDoc(doc(db, 'organizations', orgId), {
        maturity_level: nivel,
        priority: nivel === 'Iniciante' ? 'alta' : nivel === 'Estruturação' ? 'media' : 'baixa'
      });
    }

    // 11. Apply Strategic Intelligence (Automatic Processing)
    await aplicarInteligenciaEstrategica(orgId);

    return { success: true, orgId, scoreTotal, nivel, statusClassificacao };

  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'adesao_process');
    throw error;
  }
}

/**
 * processarDiagnostico
 * Processes a diagnostic submission, linking it to an organization.
 */
export async function processarDiagnostico(
  orgId: string,
  answers: Answer[],
  orgName: string,
  phone: string,
  name: string,
  existingDiagId?: string
) {
  try {
    // BLOQUEADO: Agora centralizado no Backend (SSOT)
    const response = await fetch('/api/governance/diagnostico/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, answers })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Metodologia de diagnóstico pendente de aprovação.');
    }

    return await response.json();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'diagnostics');
    throw error;
  }
}

export async function aplicarInteligenciaEstrategica(orgId: string) {
  // Transferido para o Backend (Background Job)
  console.log('[GOVERNANÇA] Inteligência Estratégica agendada no Backend para org:', orgId);
}


/**
 * gerarInsightsInstitucionais
 * Generates automated insights based on organization data.
 */
export async function gerarInsightsInstitucionais(orgId: string) {
  try {
    const orgSnap = await getDocs(query(collection(db, 'organizations'), where('__name__', '==', orgId)));
    if (orgSnap.empty) return null;
    const data = orgSnap.docs[0].data();

    const maturity = data.overall_score || 0;
    const gargalos = [];
    
    if (maturity < 4) gargalos.push("Baixa maturidade institucional generalizada");
    if (!data.cnpj) gargalos.push("Falta de formalização jurídica (CNPJ)");
    if (!data.captacao_ativa) gargalos.push("Ausência de estratégia ativa de captação");
    if ((data.colaboradores || 0) < 2) gargalos.push("Equipe reduzida para sustentabilidade");

    let trilha = "curso";
    if (maturity >= 8) trilha = "consultoria";
    else if (maturity >= 5) trilha = "comunidade";

    return {
      gargalos,
      trilha_recomendada: trilha,
      insights_gerados_at: new Date().toISOString()
    };
  } catch (error) {
    console.error("Erro ao gerar insights:", error);
    return null;
  }
}

/**
 * generateWhatsAppLink
 * Generates a dynamic link based on the institutional profile.
 */
export function generateWhatsAppLink(orgName: string, nivel: string, desafio: string) {
  const message = `Aqui é do CACI. Recebemos o diagnóstico da organização ${orgName}, classificada como ${nivel}. Identificamos desafios em ${desafio}. Podemos apoiar com direcionamento estruturado.`;
  const encodedMessage = encodeURIComponent(message);
  return `https://api.whatsapp.com/send/?phone=5511940603881&text=${encodedMessage}`;
}

/**
 * updateGlobalStats
 * Recalculates and updates the global ecosystem statistics.
 */
export async function updateGlobalStats() {
  try {
    const orgsSnap = await getDocs(collection(db, 'organizations'));
    const orgs = orgsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

    const maturityScores = orgs.filter(o => o.overall_score !== undefined).map(o => o.overall_score);
    const avgMaturity = maturityScores.length > 0 
      ? maturityScores.reduce((a, b) => a + b, 0) / maturityScores.length 
      : 0;

    const reliabilityScores = orgs.filter(o => o.reliability_score !== undefined).map(o => o.reliability_score);
    const avgReliability = reliabilityScores.length > 0
      ? reliabilityScores.reduce((a, b) => a + b, 0) / reliabilityScores.length
      : 0;

    const stats: GlobalStats = {
      total_oscs: orgs.length,
      oscs_ativas: orgs.filter(o => o.status === 'ativa' || o.status === 'cadastro_finalizado').length,
      oscs_por_maturidade: {
        'Inicial': orgs.filter(o => o.maturity_level === 'Inicial').length,
        'Estruturando': orgs.filter(o => o.maturity_level === 'Estruturando').length,
        'Organizado': orgs.filter(o => o.maturity_level === 'Organizado').length,
        'Estratégico': orgs.filter(o => o.maturity_level === 'Estratégico').length,
        'Sistêmico': orgs.filter(o => o.maturity_level === 'Sistêmico').length,
      },
      oscs_por_territorio: {},
      oscs_por_area: {},
      oscs_com_selo: {
        'Bronze': orgs.filter(o => o.maturity_seal === 'Bronze').length,
        'Prata': orgs.filter(o => o.maturity_seal === 'Prata').length,
        'Ouro': orgs.filter(o => o.maturity_seal === 'Ouro').length,
        'Diamante': orgs.filter(o => o.maturity_seal === 'Diamante').length,
      },
      oscs_alto_score: orgs.filter(o => (o.reliability_score || 0) >= 80).length,
      avg_maturity: avgMaturity,
      avg_reliability: avgReliability,
      last_updated: serverTimestamp(),
    };

    // Territorial and Area segmentation
    orgs.forEach(o => {
      if (o.state) {
        stats.oscs_por_territorio[o.state] = (stats.oscs_por_territorio[o.state] || 0) + 1;
      }
      if (o.main_area) {
        stats.oscs_por_area[o.main_area] = (stats.oscs_por_area[o.main_area] || 0) + 1;
      }
    });

    await setDoc(doc(db, 'global_stats', 'current'), stats);
  } catch (error) {
    console.error("Erro ao atualizar estatísticas globais:", error);
  }
}

/**
 * initializeFounder
 * Ensures the founding organization (ONG CACI) exists in the ecosystem.
 */
export async function initializeFounder() {
  try {
    const founderId = 'OSC_0001';
    const founderRef = doc(db, 'organizations', founderId);
    const founderSnap = await getDoc(founderRef);

    if (!founderSnap.exists()) {
      await setDoc(founderRef, {
        name: "ONG CACI",
        city: "São Paulo",
        state: "SP",
        year_founded: 2020,
        legal_status: "Associação Privada",
        size: "Média",
        main_area: "Desenvolvimento Institucional",
        owner_user_id: "SYSTEM_FOUNDER",
        tipo_organizacao: "fundadora",
        status: "ativa",
        maturity_level: "Sistêmico",
        overall_score: 9.5,
        maturity_seal: "Diamante",
        reliability_score: 98,
        created_at: serverTimestamp(),
      });
      console.log("Organização Fundadora (ONG CACI) inicializada com sucesso.");
      await updateGlobalStats();
    }
  } catch (error) {
    console.error("Erro ao inicializar organização fundadora:", error);
  }
}

export async function getOrganizationByUserId(userId: string) {
  const q = query(collection(db, 'organizations'), where('owner_user_id', '==', userId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
}

export async function getLatestDiagnostic(organizationId: string) {
  const q = query(
    collection(db, 'diagnostics'),
    where('organization_id', '==', organizationId),
    orderBy('created_at', 'desc'),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
}
