import { 
  Question, 
  Answer, 
  InstitutionalDiagnostic, 
  DimensionScore, 
  SubDimensionScore, 
  Risk, 
  Recommendation,
  MaturityDimension,
  MaturityLevel,
  MaturitySeal
} from '../types';

export const QUESTIONS: Question[] = [
  // 1. Governança e Liderança
  {
    id: 'gov_1',
    text: 'A organização possui estatuto social atualizado e registrado?',
    type: 'boolean',
    weight: 15,
    dimension: 'Governança e Liderança',
    subDimension: 'Estrutura decisória',
    options: [
      { label: 'Sim', value: 10 },
      { label: 'Não', value: 0, isCritical: true }
    ]
  },
  {
    id: 'gov_2',
    text: 'Os relatórios de atividades e financeiros são públicos e acessíveis?',
    type: 'boolean',
    weight: 12,
    dimension: 'Governança e Liderança',
    subDimension: 'Transparência',
    options: [
      { label: 'Sim', value: 10 },
      { label: 'Não', value: 0 }
    ]
  },
  {
    id: 'gov_3',
    text: 'Existe conselho fiscal ativo com atas de reuniões registradas?',
    type: 'boolean',
    weight: 10,
    dimension: 'Governança e Liderança',
    subDimension: 'Prestação de contas',
    options: [
      { label: 'Sim', value: 10 },
      { label: 'Não', value: 0 }
    ]
  },

  // 2. Gestão Estratégica
  {
    id: 'est_1',
    text: 'Existe um Plano Estratégico formalizado para os próximos 2-5 anos?',
    type: 'scale',
    weight: 15,
    dimension: 'Gestão Estratégica',
    subDimension: 'Planejamento de Longo Prazo',
    options: [
      { label: 'Não existe', value: 0 },
      { label: 'Parcial/Informal', value: 5 },
      { label: 'Formalizado e Monitorado', value: 10 }
    ]
  },
  {
    id: 'est_2',
    text: 'A missão, visão e valores são revisados e comunicados periodicamente?',
    type: 'boolean',
    weight: 10,
    dimension: 'Gestão Estratégica',
    subDimension: 'Identidade Institucional',
    options: [
      { label: 'Sim', value: 10 },
      { label: 'Não', value: 0 }
    ]
  },

  // 3. Gestão Financeira
  {
    id: 'fin_1',
    text: 'A organização realiza auditoria externa ou independente anualmente?',
    type: 'boolean',
    weight: 15,
    dimension: 'Gestão Financeira',
    subDimension: 'Compliance Financeiro',
    options: [
      { label: 'Sim', value: 10 },
      { label: 'Não', value: 0 }
    ]
  },
  {
    id: 'fin_2',
    text: 'Existe reserva financeira para contingências (fundo de reserva)?',
    type: 'scale',
    weight: 10,
    dimension: 'Gestão Financeira',
    subDimension: 'Segurança Financeira',
    options: [
      { label: 'Não possui', value: 0 },
      { label: 'Reserva para 1-3 meses', value: 5 },
      { label: 'Reserva > 6 meses', value: 10 }
    ]
  },

  // 4. Captação de Recursos
  {
    id: 'cap_1',
    text: 'A organização possui diversificação de fontes de receita?',
    type: 'scale',
    weight: 15,
    dimension: 'Captação de Recursos',
    subDimension: 'Diversificação',
    options: [
      { label: 'Fonte única (>90%)', value: 0 },
      { label: '2-3 fontes', value: 5 },
      { label: 'Alta diversificação', value: 10 }
    ]
  },
  {
    id: 'cap_2',
    text: 'Existe uma equipe ou profissional dedicado exclusivamente à captação?',
    type: 'boolean',
    weight: 10,
    dimension: 'Captação de Recursos',
    subDimension: 'Estrutura de Captação',
    options: [
      { label: 'Sim', value: 10 },
      { label: 'Não', value: 0 }
    ]
  },

  // 5. Gestão de Projetos e Impacto
  {
    id: 'proj_1',
    text: 'Os projetos possuem cronogramas e orçamentos detalhados?',
    type: 'scale',
    weight: 12,
    dimension: 'Gestão de Projetos e Impacto',
    subDimension: 'Planejamento',
    options: [
      { label: 'Não', value: 0 },
      { label: 'Alguns projetos', value: 5 },
      { label: 'Todos os projetos', value: 10 }
    ]
  },
  {
    id: 'proj_2',
    text: 'A organização utiliza indicadores para medir o impacto social gerado?',
    type: 'scale',
    weight: 15,
    dimension: 'Gestão de Projetos e Impacto',
    subDimension: 'Mensuração de impacto',
    options: [
      { label: 'Não mede', value: 0 },
      { label: 'Indicadores básicos', value: 5 },
      { label: 'Metodologia robusta', value: 10 }
    ]
  },

  // 6. Comunicação e Posicionamento
  {
    id: 'com_1',
    text: 'A organização possui site atualizado e presença ativa em redes sociais?',
    type: 'scale',
    weight: 10,
    dimension: 'Comunicação e Posicionamento',
    subDimension: 'Presença Digital',
    options: [
      { label: 'Inexistente', value: 0 },
      { label: 'Básica', value: 5 },
      { label: 'Profissional/Ativa', value: 10 }
    ]
  },
  {
    id: 'com_2',
    text: 'Existe uma estratégia de comunicação institucional formalizada?',
    type: 'boolean',
    weight: 8,
    dimension: 'Comunicação e Posicionamento',
    subDimension: 'Estratégia de Marca',
    options: [
      { label: 'Sim', value: 10 },
      { label: 'Não', value: 0 }
    ]
  },

  // 7. Tecnologia e Dados
  {
    id: 'dig_1',
    text: 'A organização utiliza software de gestão (ERP/CRM) integrado?',
    type: 'scale',
    weight: 15,
    dimension: 'Tecnologia e Dados',
    subDimension: 'Sistemas de Gestão',
    options: [
      { label: 'Não utiliza', value: 0 },
      { label: 'Planilhas isoladas', value: 5 },
      { label: 'Sistema integrado', value: 10 }
    ]
  },
  {
    id: 'dig_2',
    text: 'Os dados da organização estão armazenados de forma segura em nuvem?',
    type: 'boolean',
    weight: 10,
    dimension: 'Tecnologia e Dados',
    subDimension: 'Segurança da Informação',
    options: [
      { label: 'Sim', value: 10 },
      { label: 'Não', value: 0 }
    ]
  },

  // 8. Pessoas e Cultura
  {
    id: 'rh_1',
    text: 'Existe organograma definido com funções e responsabilidades claras?',
    type: 'boolean',
    weight: 10,
    dimension: 'Pessoas e Cultura',
    subDimension: 'Estrutura organizacional',
    options: [
      { label: 'Sim', value: 10 },
      { label: 'Não', value: 0 }
    ]
  },
  {
    id: 'rh_2',
    text: 'São realizados treinamentos ou capacitações para a equipe anualmente?',
    type: 'scale',
    weight: 7,
    dimension: 'Pessoas e Cultura',
    subDimension: 'Desenvolvimento Humano',
    options: [
      { label: 'Nunca', value: 0 },
      { label: 'Ocasionalmente', value: 5 },
      { label: 'Plano de capacitação ativo', value: 10 }
    ]
  }
];

const DIMENSION_WEIGHTS: Record<MaturityDimension, number> = {
  'Governança e Liderança': 0.15,
  'Gestão Estratégica': 0.15,
  'Gestão Financeira': 0.15,
  'Captação de Recursos': 0.15,
  'Gestão de Projetos e Impacto': 0.15,
  'Comunicação e Posicionamento': 0.10,
  'Tecnologia e Dados': 0.10,
  'Pessoas e Cultura': 0.05
};

const getLevel = (percentage: number): MaturityLevel => {
  if (percentage <= 20) return 'Inicial';
  if (percentage <= 40) return 'Estruturando';
  if (percentage <= 60) return 'Organizado';
  if (percentage <= 80) return 'Estratégico';
  return 'Sistêmico';
};

const getSeal = (overallPercentage: number, dimensionScores: DimensionScore[]): MaturitySeal => {
  if (overallPercentage >= 90 && dimensionScores.every(d => d.percentage >= 60)) return 'Diamante';
  if (overallPercentage >= 80) return 'Ouro';
  if (overallPercentage >= 60) return 'Prata';
  return 'Bronze';
};

export const calculateDiagnostic = (answers: Answer[], userId: string, organizationId: string, organizationName?: string): InstitutionalDiagnostic => {
  const dimensionScores: DimensionScore[] = [];
  const risks: Risk[] = [];
  const recommendations: Recommendation[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const alerts: string[] = [];
  
  const dimensions = Object.keys(DIMENSION_WEIGHTS) as MaturityDimension[];
  
  let overallWeightedScore = 0;

  dimensions.forEach(dimName => {
    const dimQuestions = QUESTIONS.filter(q => q.dimension === dimName);
    if (dimQuestions.length === 0) return;

    const subDimensionsMap = new Map<string, { score: number, maxScore: number }>();
    
    let dimScore = 0;
    let dimMaxScore = 0;

    dimQuestions.forEach(q => {
      const answer = answers.find(a => a.questionId === q.id);
      const value = answer ? answer.value : 0;
      
      const qScore = value * q.weight;
      const qMax = 10 * q.weight;

      dimScore += qScore;
      dimMaxScore += qMax;

      const sub = subDimensionsMap.get(q.subDimension) || { score: 0, maxScore: 0 };
      sub.score += qScore;
      sub.maxScore += qMax;
      subDimensionsMap.set(q.subDimension, sub);

      const option = q.options?.find(o => o.value === value);
      if (option?.isCritical || value === 0) {
        const level = value === 0 ? 'crítico' : 'alto';
        risks.push({
          level,
          message: `${level.toUpperCase()}: ${q.text} - Ausência de processo crítico em ${q.subDimension}.`,
          dimension: q.dimension
        });
        if (value === 0) alerts.push(`Gap Crítico: ${q.text}`);
      }

      if (value < 10) {
        recommendations.push({
          text: `Aprimorar ${q.text.toLowerCase()} (${q.subDimension}).`,
          dimension: q.dimension,
          priority: value === 0 ? 'alta' : 'média'
        });
      }
    });

    const percentage = (dimScore / dimMaxScore) * 100;
    const weight = DIMENSION_WEIGHTS[dimName];
    overallWeightedScore += percentage * weight;

    const subDimensions: SubDimensionScore[] = Array.from(subDimensionsMap.entries()).map(([name, data]) => ({
      name,
      score: data.score,
      maxScore: data.maxScore,
      percentage: (data.score / data.maxScore) * 100
    }));

    dimensionScores.push({
      dimension: dimName,
      weight,
      score: dimScore,
      maxScore: dimMaxScore,
      percentage,
      level: getLevel(percentage),
      subDimensions
    });

    if (percentage > 75) strengths.push(dimName);
    if (percentage < 40) {
      weaknesses.push(dimName);
      alerts.push(`Dimensão ${dimName} com baixa maturidade (${Math.round(percentage)}%)`);
    }
  });

  const overallPercentage = overallWeightedScore;
  const classification = getLevel(overallPercentage);
  const maturitySeal = getSeal(overallPercentage, dimensionScores);

  // Reliability Score Logic
  const govScore = dimensionScores.find(d => d.dimension === 'Governança e Liderança')?.percentage || 0;
  const finScore = dimensionScores.find(d => d.dimension === 'Gestão Financeira')?.percentage || 0;
  const projScore = dimensionScores.find(d => d.dimension === 'Gestão de Projetos e Impacto')?.percentage || 0;
  const capScore = dimensionScores.find(d => d.dimension === 'Captação de Recursos')?.percentage || 0;

  const reliabilityScore = (govScore * 0.4) + (finScore * 0.3) + (projScore * 0.2) + (capScore * 0.1);
  let reliabilityRisk: 'baixo' | 'médio' | 'alto' = 'baixo';
  if (reliabilityScore < 40) reliabilityRisk = 'alto';
  else if (reliabilityScore < 70) reliabilityRisk = 'médio';

  // Predictive Analysis Logic
  const discontinuityRisk = Math.max(0, 100 - (finScore * 0.6 + govScore * 0.4));
  const scalePotential = (projScore * 0.4 + capScore * 0.3 + govScore * 0.3);

  const predictiveAnalysis = {
    discontinuityRisk,
    scalePotential,
    factors: [
      finScore < 40 ? 'Baixa diversificação de receita' : 'Saúde financeira estável',
      govScore < 50 ? 'Fragilidade na governança' : 'Governança consolidada',
      capScore < 40 ? 'Dependência de poucos financiadores' : 'Capacidade de captação ativa'
    ],
    recommendations: [
      discontinuityRisk > 50 ? 'Priorizar fundo de reserva e diversificação' : 'Manter monitoramento financeiro',
      scalePotential > 70 ? 'Investir em expansão operacional' : 'Fortalecer base institucional antes de escalar'
    ],
    probabilities: {
      discontinuity: discontinuityRisk,
      scale: scalePotential
    }
  };

  const summary = `Diagnóstico Ecossistema ONG CACI concluído. Selo: ${maturitySeal}. Nível: ${classification}. 
    A organização apresenta maior maturidade em: ${strengths.join(', ') || 'Nenhuma área de destaque'}. 
    Gaps estratégicos identificados em: ${weaknesses.join(', ') || 'Nenhum gap crítico'}.`;

  return {
    id: `imi_${Date.now()}`,
    userId,
    organizationId,
    organizationName,
    timestamp: new Date(),
    answers,
    dimensionScores,
    overallPercentage,
    overallScore: overallPercentage,
    classification,
    maturityLevel: classification,
    maturitySeal,
    reliabilityScore,
    reliabilityRisk,
    predictiveAnalysis,
    risks,
    recommendations,
    summary,
    strengths,
    weaknesses,
    alerts
  };
};
