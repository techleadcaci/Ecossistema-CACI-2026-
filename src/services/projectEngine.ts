import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp, 
  query, 
  orderBy,
  limit,
  doc,
  updateDoc
} from 'firebase/firestore';

export interface InstitutionalProject {
  id?: string;
  titulo: string;
  problema_identificado: string;
  justificativa: string;
  publico_alvo: string;
  dados_base_utilizados: {
    total_oscs: number;
    media_maturidade: number;
    distribuicao_niveis: Record<string, number>;
    gargalos_comuns: string[];
  };
  metodologia_caci: string;
  impacto_esperado: string;
  abrangencia: string;
  nivel_maturidade_medio: number;
  numero_oscs_afetadas: number;
  principais_gargalos: string[];
  proposta_valor: string;
  status_projeto: 'rascunho' | 'pronto' | 'enviado';
  prontidao_financiamento: 'baixa' | 'média' | 'alta';
  versao_financiador?: string;
  created_at: any;
}

/**
 * gerarProjetoInstitucional
 * Central function to transform ecosystem data into a structured proposal.
 */
export async function gerarProjetoInstitucional() {
  try {
    // 1. Data Collection
    const orgsSnap = await getDocs(collection(db, 'organizations'));
    const diagsSnap = await getDocs(collection(db, 'diagnostics'));
    const classificationSnap = await getDocs(collection(db, 'osc_classification'));

    const organizations = orgsSnap.docs.map(d => d.data());
    const diagnostics = diagsSnap.docs.map(d => d.data());
    const classifications = classificationSnap.docs.map(d => d.data());

    if (organizations.length === 0) {
      throw new Error("Dados insuficientes para gerar projeto institucional.");
    }

    // 2. Pattern Analysis
    const totalOscs = organizations.length;
    
    // Maturity analysis
    const maturityScores = diagnostics.map(d => d.overall_score || 0);
    const avgMaturity = maturityScores.length > 0 
      ? maturityScores.reduce((a, b) => a + b, 0) / maturityScores.length 
      : 0;

    const levelsCount = {
      iniciante: diagnostics.filter(d => d.maturity_level === 'iniciante').length,
      intermediario: diagnostics.filter(d => d.maturity_level === 'intermediario' || d.maturity_level === 'estruturação').length,
      avancado: diagnostics.filter(d => d.maturity_level === 'avancado' || d.maturity_level === 'avançado').length
    };

    // Bottlenecks analysis
    const allChallenges = organizations.flatMap(o => {
      if (typeof o.challenges === 'string') return o.challenges.split(',').map(s => s.trim());
      if (Array.isArray(o.challenges)) return o.challenges;
      return [];
    });

    const challengeCounts: Record<string, number> = {};
    allChallenges.forEach(c => {
      challengeCounts[c] = (challengeCounts[c] || 0) + 1;
    });

    const mainGargalos = Object.entries(challengeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // Geographic distribution
    const states = [...new Set(organizations.map(o => o.state).filter(Boolean))];
    const cities = [...new Set(organizations.map(o => o.city).filter(Boolean))];
    
    let abrangencia = "Municipal";
    if (states.length > 3) abrangencia = "Nacional";
    else if (states.length > 1 || cities.length > 5) abrangencia = "Estadual";

    // 3. Project Focus Definition
    let foco = "formação";
    if (levelsCount.avancado > levelsCount.iniciante && levelsCount.avancado > levelsCount.intermediario) {
      foco = "escala e impacto";
    } else if (levelsCount.intermediario > levelsCount.iniciante) {
      foco = "estruturação";
    }

    // 4. Automatic Content Generation
    const titulo = "Programa de Fortalecimento Institucional de Organizações da Sociedade Civil no Brasil";
    
    const problema = `Atualmente, o ecossistema CACI identificou que ${totalOscs} organizações da sociedade civil enfrentam desafios críticos de gestão. Os principais gargalos identificados incluem: ${mainGargalos.join(', ')}. A média de maturidade institucional do grupo é de ${avgMaturity.toFixed(1)}/10, evidenciando uma lacuna significativa entre a intenção de impacto e a capacidade operacional instalada.`;

    const justificativa = `Com base nos dados reais coletados pelo Ecossistema CACI, observamos que o terceiro setor brasileiro é vital para a democracia e o desenvolvimento social, porém sofre com a falta de estruturação profissional. Este projeto justifica-se pela necessidade urgente de profissionalizar a gestão dessas ${totalOscs} OSCs para garantir a sustentabilidade de suas ações e a transparência no uso de recursos públicos e privados.`;

    const publicoAlvo = `O projeto beneficiará diretamente ${totalOscs} Organizações da Sociedade Civil (OSCs), com perfil predominantemente de ${avgMaturity < 5 ? 'pequeno e médio porte em fase inicial' : 'médio porte em fase de estruturação'}. A distribuição atual conta com ${levelsCount.iniciante} OSCs em nível iniciante, ${levelsCount.intermediario} em nível intermediário e ${levelsCount.avancado} em nível avançado.`;

    const metodologia = `A metodologia CACI baseia-se em quatro pilares fundamentais: 1) Diagnóstico Institucional contínuo para identificação de gaps; 2) Formação Estratégica focada nos gargalos identificados; 3) Acompanhamento Técnico para implementação de melhorias; 4) Comunidade de Prática para troca de experiências e fortalecimento mútuo. O foco principal deste ciclo será a ${foco}.`;

    const impacto = `Espera-se uma melhoria média de 30% nos índices de gestão das OSCs participantes, aumento da capacidade de captação de recursos através de conformidade institucional e o fortalecimento sistêmico do território de atuação (${abrangencia}).`;

    const propostaValor = `O Ecossistema CACI oferece uma infraestrutura de dados e inteligência que permite intervenções precisas e escaláveis, transformando o investimento social em resultados práticos e mensuráveis para as comunidades atendidas.`;

    // 5. Indicators Generation
    const numeroOscsAfetadas = totalOscs;
    const nivelMaturidadeMedio = avgMaturity;

    // 6. Strategic Field: Readiness
    let prontidao: 'baixa' | 'média' | 'alta' = 'baixa';
    if (totalOscs > 30 && avgMaturity > 0) {
      prontidao = 'alta';
    } else if (totalOscs > 10) {
      prontidao = 'média';
    }

    // 7. Create Document
    const projectData: Omit<InstitutionalProject, 'id'> = {
      titulo,
      problema_identificado: problema,
      justificativa,
      publico_alvo: publicoAlvo,
      dados_base_utilizados: {
        total_oscs: totalOscs,
        media_maturidade: avgMaturity,
        distribuicao_niveis: levelsCount,
        gargalos_comuns: mainGargalos
      },
      metodologia_caci: metodologia,
      impacto_esperado: impacto,
      abrangencia,
      nivel_maturidade_medio: nivelMaturidadeMedio,
      numero_oscs_afetadas: numeroOscsAfetadas,
      principais_gargalos: mainGargalos,
      proposta_valor: propostaValor,
      status_projeto: 'rascunho',
      prontidao_financiamento: prontidao,
      created_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'institutional_projects'), projectData);
    return { id: docRef.id, ...projectData };

  } catch (error) {
    console.error("Erro ao gerar projeto institucional:", error);
    throw error;
  }
}

/**
 * adaptarProjetoParaFinanciador
 * Tailors an existing project for a specific funder type.
 */
export async function adaptarProjetoParaFinanciador(
  projectId: string, 
  financiadorNome: string, 
  tipo: 'fundação' | 'corporativo' | 'internacional'
) {
  try {
    const projectRef = doc(db, 'institutional_projects', projectId);
    
    let enfase = "";
    if (tipo === 'internacional') {
      enfase = "Este projeto prioriza o impacto sistêmico e a escalabilidade das soluções baseadas em evidências de dados, alinhando-se aos padrões globais de transparência e eficácia no desenvolvimento social.";
    } else if (tipo === 'fundação') {
      enfase = "O foco central é o fortalecimento institucional das organizações e o desenvolvimento social do território, garantindo que as OSCs locais tornem-se protagonistas da mudança em suas comunidades.";
    } else if (tipo === 'corporativo') {
      enfase = "A proposta enfatiza o impacto direto e os resultados práticos para os beneficiários finais, oferecendo indicadores claros de retorno social sobre o investimento e visibilidade para ações de responsabilidade corporativa.";
    }

    const versaoFinanciador = `Versão adaptada para ${financiadorNome} (${tipo}). ${enfase}`;

    await updateDoc(projectRef, {
      versao_financiador: versaoFinanciador,
      status_projeto: 'pronto',
      updated_at: serverTimestamp()
    });

    return { success: true, versaoFinanciador };
  } catch (error) {
    console.error("Erro ao adaptar projeto:", error);
    throw error;
  }
}
