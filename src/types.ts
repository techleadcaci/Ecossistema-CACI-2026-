export type QuestionType = 'boolean' | 'multiple' | 'scale';

export type MaturityDimension = 
  | 'Governança e Liderança'
  | 'Gestão Estratégica'
  | 'Gestão Financeira'
  | 'Captação de Recursos'
  | 'Gestão de Projetos e Impacto'
  | 'Comunicação e Posicionamento'
  | 'Tecnologia e Dados'
  | 'Pessoas e Cultura';

export type MaturityLevel = 
  | 'Inicial'
  | 'Estruturando'
  | 'Organizado'
  | 'Estratégico'
  | 'Sistêmico';

export type MaturitySeal = 'Bronze' | 'Prata' | 'Ouro' | 'Diamante';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  weight: number;
  dimension: MaturityDimension;
  subDimension: string;
  options?: { label: string; value: number; isCritical?: boolean }[];
}

export interface Answer {
  questionId: string;
  value: number;
  notes?: string;
}

export interface Risk {
  level: 'baixo' | 'médio' | 'alto' | 'crítico';
  message: string;
  dimension: string;
}

export interface Recommendation {
  text: string;
  dimension: string;
  priority: 'baixa' | 'média' | 'alta';
}

export interface SubDimensionScore {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface DimensionScore {
  dimension: string;
  weight: number;
  score: number;
  maxScore: number;
  percentage: number;
  level: MaturityLevel;
  subDimensions: SubDimensionScore[];
}

export interface InstitutionalDiagnostic {
  id: string;
  userId: string;
  organizationId: string;
  organizationName?: string;
  timestamp: any;
  answers: Answer[];
  dimensionScores: DimensionScore[];
  overallPercentage: number;
  overallScore: number;
  classification: MaturityLevel;
  maturityLevel: MaturityLevel;
  maturitySeal: MaturitySeal;
  reliabilityScore: number;
  reliabilityRisk: 'baixo' | 'médio' | 'alto';
  predictiveAnalysis: {
    discontinuityRisk: number;
    scalePotential: number;
    factors: string[];
    recommendations: string[];
    probabilities: {
      discontinuity: number;
      scale: number;
    };
  };
  risks: Risk[];
  recommendations: Recommendation[];
  summary: string;
  strengths: string[];
  weaknesses: string[];
  alerts: string[];
}

export interface BenchmarkingData {
  dimension: MaturityDimension;
  organizationScore: number;
  clusterAverage: number;
  percentile: number;
  bestPractices: string[];
  gaps: string[];
}

export type AgentType = 'interno' | 'institucional' | 'osc';

export interface Organization {
  id: string;
  name: string;
  city?: string;
  state?: string;
  year_founded?: number;
  legal_status?: string;
  size?: string;
  main_area?: string;
  challenges?: string[];
  owner_user_id: string;
  tipo_organizacao: 'fundadora' | 'padrao';
  status: 'ativa' | 'inativa';
  maturity_level?: MaturityLevel;
  overall_score?: number;
  maturity_seal?: MaturitySeal;
  reliability_score?: number;
}

export interface GlobalStats {
  total_oscs: number;
  oscs_ativas: number;
  oscs_por_maturidade: Record<MaturityLevel, number>;
  oscs_por_territorio: Record<string, number>;
  oscs_por_area: Record<string, number>;
  oscs_com_selo: Record<MaturitySeal, number>;
  oscs_alto_score: number;
  avg_maturity: number;
  avg_reliability: number;
  last_updated: any;
}

export interface ChatMessage {
  id: string;
  userId: string;
  organizationId: string;
  agentType: AgentType;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: any;
  metadata?: {
    diagnosticId?: string;
    dimension?: string;
    source?: 'platform' | 'whatsapp';
  };
}

export interface AgentContext {
  user: any;
  organization?: any;
  lastDiagnostic?: InstitutionalDiagnostic;
  telemetry?: {
    activeUsersCount: number;
    activeCampaignsCount: number;
    totalRaised: number;
    pendingLeadsCount: number;
    revenueOpportunitiesCount: number;
    improvementActionsCount: number;
    criticalImprovementsCount: number;
    telemetryStatus?: string;
  };
  platformStructure: string;
}

export interface ERPCampaign {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  status: 'planejamento' | 'ativa' | 'concluída' | 'pausada';
  department?: string;
  goal: number;
  budget?: number;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  period: 'semanas' | 'meses';
  maturity_level?: number;
  alcance_real?: number;
  leads_reais?: number;
  conversao_real?: number;
  automation_config?: any;
  created_at: any;
  created_by: string;
}

export interface ERPAsset {
  id: string;
  name: string;
  type: 'website' | 'landing_page' | 'email_flow' | 'api_integration';
  department?: string;
  url?: string;
  status: 'ativo' | 'inativo' | 'manutenção' | 'recomendado';
  maturity_level?: number;
  usage_count?: number;
  roi?: number;
  performance_impact?: string;
  popularity?: number;
  metrics?: any;
  last_sync?: any;
}

export interface ERPMetrics {
  id: string;
  organization_id?: string;
  alcance_digital: number;
  leads_qualificados: number;
  conversao: number;
  alcance_change?: string;
  leads_change?: string;
  conversao_change?: string;
  source?: 'google_analytics' | 'meta_ads' | 'internal';
  last_updated: any;
}

export interface OSCAssetUsage {
  id: string;
  organization_id: string;
  asset_id: string;
  status: 'active' | 'in_use' | 'recommended';
  activated_at?: any;
  last_interaction?: any;
}

export type CMSContentType = 'text' | 'image' | 'pdf' | 'component' | 'section';
export type CMSContentStatus = 'draft' | 'review' | 'approved' | 'published';
export type CMSWorkflowStatus = 'pending' | 'approved' | 'rejected';

export interface CMSContent {
  id: string;
  key: string;
  value: string;
  type: CMSContentType;
  status: CMSContentStatus;
  department?: string;
  last_edited_by?: string;
  last_edited_at?: any;
  version: number;
  metadata?: any;
}

export interface CMSVersion {
  id: string;
  content_id: string;
  value: string;
  version_number: number;
  created_at: any;
  created_by: string;
}

export interface CMSWorkflow {
  id: string;
  content_id: string;
  level: 1 | 2 | 3 | 4;
  status: CMSWorkflowStatus;
  reviewer_id?: string;
  comments?: string;
  timestamp: any;
}

export interface CMSComment {
  id: string;
  content_id: string;
  user_id: string;
  department?: string;
  text: string;
  timestamp: any;
}

export interface CMSAuditLog {
  id: string;
  action: string;
  content_id: string;
  user_id: string;
  timestamp: any;
  details?: any;
}
