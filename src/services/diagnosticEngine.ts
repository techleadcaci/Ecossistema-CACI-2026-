/**
 * Diagnostic Engine for CACI Ecosystem
 * Analyzes institutional data and generates structured insights.
 */

export type MaturityLevel = 'Iniciante' | 'Estruturação' | 'Avançado';

export interface DiagnosticResult {
  overall_score: number;
  maturity_level: MaturityLevel;
  strengths: string[];
  improvement_points: string[];
  recommendations: {
    dimension: string;
    score: number;
    text: string;
  }[];
  summary: string;
}

const DIMENSION_LABELS: Record<string, string> = {
  governance_score: "Governança",
  strategy_score: "Estratégia",
  impact_score: "Impacto",
  management_score: "Gestão",
  financial_score: "Financeiro",
  communication_score: "Comunicação",
  technology_score: "Tecnologia",
  innovation_score: "Inovação",
};

const RECOMMENDATIONS: Record<string, { low: string; mid: string; high: string }> = {
  governance_score: {
    low: "Formalize o estatuto e estabeleça um conselho consultivo ativo para garantir transparência.",
    mid: "Aprimore os processos de prestação de contas e profissionalize a relação com o conselho.",
    high: "Sua governança é sólida. Considere implementar auditorias externas para máxima transparência."
  },
  strategy_score: {
    low: "Defina a missão, visão e valores da organização e estabeleça metas de curto prazo.",
    mid: "Crie um planejamento estratégico para os próximos 2 anos com indicadores claros.",
    high: "Estratégia avançada. Foque em diversificação de fontes de receita e expansão de rede."
  },
  impact_score: {
    low: "Comece a coletar dados básicos dos beneficiários e registre as atividades realizadas.",
    mid: "Implemente indicadores de resultado (outcomes) para medir a mudança real gerada.",
    high: "Impacto mensurável. Utilize os dados para gerar relatórios de impacto social anuais."
  },
  management_score: {
    low: "Defina papéis e responsabilidades claros para cada membro da equipe.",
    mid: "Implemente ferramentas de gestão de projetos e rotinas de feedback.",
    high: "Gestão profissional. Invista em capacitação contínua e retenção de talentos."
  },
  financial_score: {
    low: "Organize o fluxo de caixa e separe as finanças pessoais das da organização.",
    mid: "Implemente um orçamento anual e controles rigorosos de custos operacionais.",
    high: "Saúde financeira robusta. Explore fundos patrimoniais ou investimentos de reserva."
  },
  communication_score: {
    low: "Crie uma identidade visual básica e estabeleça presença em pelo menos uma rede social.",
    mid: "Desenvolva um plano de comunicação e um site institucional atualizado.",
    high: "Comunicação estratégica. Utilize storytelling e campanhas de mobilização de recursos."
  },
  technology_score: {
    low: "Adote ferramentas básicas de produtividade (e-mail institucional, nuvem).",
    mid: "Implemente um CRM para gestão de doadores e ferramentas de automação.",
    high: "Tecnologia de ponta. Utilize análise de dados para tomada de decisão estratégica."
  },
  innovation_score: {
    low: "Esteja aberto a novas formas de resolver os problemas sociais da sua comunidade.",
    mid: "Crie espaços para experimentação de novos projetos e metodologias.",
    high: "Liderança em inovação. Compartilhe suas metodologias com outras organizações."
  }
};

export function runDiagnosticEngine(scores: Record<string, number>): DiagnosticResult {
  const dimensionKeys = Object.keys(scores).filter(k => k.endsWith('_score'));
  const totalScore = dimensionKeys.reduce((acc, key) => acc + scores[key], 0) / dimensionKeys.length;

  let maturity_level: MaturityLevel = 'Iniciante';
  if (totalScore >= 8) maturity_level = 'Avançado';
  else if (totalScore >= 5) maturity_level = 'Estruturação';

  const strengths: string[] = [];
  const improvement_points: string[] = [];
  const recommendations: DiagnosticResult['recommendations'] = [];

  dimensionKeys.forEach(key => {
    const score = scores[key];
    const label = DIMENSION_LABELS[key] || key;
    const recs = RECOMMENDATIONS[key];

    if (score >= 8) {
      strengths.push(label);
      recommendations.push({ dimension: label, score, text: recs.high });
    } else if (score <= 4) {
      improvement_points.push(label);
      recommendations.push({ dimension: label, score, text: recs.low });
    } else {
      recommendations.push({ dimension: label, score, text: recs.mid });
    }
  });

  // Se não houver pontos fortes ou fracos claros, pega os extremos
  if (strengths.length === 0) {
    const maxScore = Math.max(...dimensionKeys.map(k => scores[k]));
    dimensionKeys.filter(k => scores[k] === maxScore).forEach(k => strengths.push(DIMENSION_LABELS[k]));
  }
  if (improvement_points.length === 0) {
    const minScore = Math.min(...dimensionKeys.map(k => scores[k]));
    dimensionKeys.filter(k => scores[k] === minScore).forEach(k => improvement_points.push(DIMENSION_LABELS[k]));
  }

  const summary = generateSummary(maturity_level, strengths, improvement_points);

  return {
    overall_score: totalScore,
    maturity_level,
    strengths,
    improvement_points,
    recommendations,
    summary
  };
}

function generateSummary(level: MaturityLevel, strengths: string[], improvements: string[]): string {
  const levelText = {
    'Iniciante': "Sua organização está dando os primeiros passos. O foco agora deve ser na formalização e organização básica dos processos.",
    'Estruturação': "A organização já possui processos estabelecidos, mas precisa de maior profissionalização e planejamento para escalar seu impacto.",
    'Avançado': "Parabéns! Sua organização demonstra alto nível de maturidade. O desafio agora é a inovação contínua e a sustentabilidade de longo prazo."
  };

  return `${levelText[level]} Seus principais pontos fortes estão em ${strengths.slice(0, 2).join(' e ')}. Para avançar, recomendamos focar na melhoria de ${improvements.slice(0, 2).join(' e ')}.`;
}
