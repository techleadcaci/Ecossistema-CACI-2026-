import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Building2, 
  ClipboardCheck, 
  TrendingUp, 
  MessageSquare,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Globe,
  Settings,
  FileText,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Printer,
  CheckCircle2,
  Star,
  Compass,
  BarChart3,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { gerarProjetoInstitucional, adaptarProjetoParaFinanciador } from '../../services/projectEngine';
import { Button } from '../../App';
import { GlobalStats } from '../../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    oscs: 0,
    diagnostics: 0,
    validOscs: 0,
    initiatives: 0,
    avgMaturity: 0,
    avgReliability: 0,
    activeFollowups: 0,
    eligibleForFunding: 0,
    seals: {
      Bronze: 0,
      Prata: 0,
      Ouro: 0,
      Diamante: 0
    },
    segments: {
      Formação: 0,
      Estruturação: 0,
      Escala: 0
    }
  });
  const [recentInteractions, setRecentInteractions] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [adapting, setAdapting] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<any | null>(null);
  const [funderName, setFunderName] = useState('');
  const [funderType, setFunderType] = useState<'fundação' | 'corporativo' | 'internacional'>('fundação');
  const [showAdaptModal, setShowAdaptModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchData = async () => {
    try {
      const [statsSnap, intsSnap, pipelineSnap, classificationSnap, opportunitiesSnap, projectsSnap] = await Promise.all([
        getDoc(doc(db, 'global_stats', 'current')),
        getDocs(query(collection(db, 'interactions'), orderBy('created_at', 'desc'), limit(5))),
        getDocs(query(collection(db, 'adesao_ecossistema'), orderBy('created_at', 'desc'), limit(5))),
        getDocs(collection(db, 'osc_classification')),
        getDocs(collection(db, 'opportunities')),
        getDocs(query(collection(db, 'institutional_projects'), orderBy('created_at', 'desc'))),
      ]);

      if (statsSnap.exists()) {
        const globalData = statsSnap.data() as GlobalStats;
        
        // Classification Stats
        const classifications = classificationSnap.docs.map(doc => doc.data());
        const validOscs = classifications.filter(c => c.status === 'OSC válida').length;
        const initiatives = classifications.filter(c => c.status === 'Iniciativa em estruturação').length;

        setStats({
          oscs: globalData.total_oscs,
          diagnostics: globalData.oscs_ativas, // Using active as proxy for diagnostics completed for now
          validOscs,
          initiatives,
          avgMaturity: globalData.avg_maturity,
          avgReliability: globalData.avg_reliability,
          activeFollowups: opportunitiesSnap.size,
          eligibleForFunding: globalData.oscs_alto_score || 0,
          segments: {
            Formação: globalData.oscs_por_maturidade['Inicial'] || 0,
            Estruturação: (globalData.oscs_por_maturidade['Estruturando'] || 0) + (globalData.oscs_por_maturidade['Organizado'] || 0),
            Escala: (globalData.oscs_por_maturidade['Estratégico'] || 0) + (globalData.oscs_por_maturidade['Sistêmico'] || 0)
          },
          seals: {
            Bronze: globalData.oscs_com_selo.Bronze || 0,
            Prata: globalData.oscs_com_selo.Prata || 0,
            Ouro: globalData.oscs_com_selo.Ouro || 0,
            Diamante: globalData.oscs_com_selo.Diamante || 0
          }
        });
      }

      setRecentInteractions(intsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setPipeline(pipelineSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setProjects(projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateProject = async () => {
    setGenerating(true);
    try {
      await gerarProjetoInstitucional();
      await fetchData();
    } catch (error) {
      alert("Erro ao gerar projeto: " + (error as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleAdaptProject = async () => {
    if (!selectedProject || !funderName) return;
    setAdapting(true);
    try {
      await adaptarProjetoParaFinanciador(selectedProject.id, funderName, funderType);
      setShowAdaptModal(false);
      setFunderName('');
      await fetchData();
    } catch (error) {
      alert("Erro ao adaptar projeto: " + (error as Error).message);
    } finally {
      setAdapting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96 font-black text-slate-400 animate-pulse text-2xl">Carregando Ecossistema CACI...</div>;

  return (
    <div className="bg-sequential-0 min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6A1B9A]/5 text-[#6A1B9A] text-[10px] font-black uppercase tracking-widest mb-6 border border-[#6A1B9A]/10">
            <TrendingUp size={14} />
            Painel de Comando Operacional
          </div>
          <h1 className="text-5xl font-display font-black tracking-tighter text-slate-900 leading-none">
            Visão Geral do <span className="text-[#6A1B9A]">Ecossistema CACI</span>
          </h1>
        </div>
        
        <div className="flex gap-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Elegíveis Financiamento</div>
              <div className="text-sm font-black text-slate-900">{stats.eligibleForFunding} Organizações</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-8 mb-16">
        {[
          { label: 'OSCs Válidas', value: stats.validOscs, icon: Building2, color: 'text-[#6A1B9A]', bg: 'bg-[#6A1B9A]/10' },
          { label: 'Iniciativas em Estruturação', value: stats.initiatives, icon: ClipboardCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Maturidade Média', value: stats.avgMaturity.toFixed(1), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Confiabilidade Média', value: stats.avgReliability.toFixed(1), icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Acompanhamentos Ativos', value: stats.activeFollowups, icon: MessageSquare, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
          { label: 'Benchmarking Setorial', value: 'Ver', icon: BarChart3, color: 'text-cyan-600', bg: 'bg-cyan-100', onClick: () => navigate('/ecossistema/benchmarking') },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => stat.onClick?.()}
              className={`bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all ${stat.onClick ? 'cursor-pointer' : ''}`}
            >
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6`}>
                <Icon size={28} />
              </div>
              <div className="text-4xl font-display font-black text-slate-900 mb-2">{stat.value}</div>
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Advanced Intelligence Layer */}
      <div className="grid lg:grid-cols-3 gap-8 mb-16">
        {/* Maturity Seals Distribution */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-8">Selos de Maturidade</h3>
          <div className="space-y-6">
            {Object.entries(stats.seals).map(([seal, count]) => {
              const countNum = count as number;
              const colors: Record<string, string> = {
                Bronze: 'bg-amber-700',
                Prata: 'bg-slate-400',
                Ouro: 'bg-amber-400',
                Diamante: 'bg-cyan-400'
              };
              return (
                <div key={seal}>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                    <span className="text-slate-400">{seal}</span>
                    <span className="text-slate-900">{countNum}</span>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(countNum / (stats.oscs || 1)) * 100}%` }}
                      className={`h-full ${colors[seal] || 'bg-slate-200'}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Segment Distribution */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-8">Distribuição por Segmento</h3>
          <div className="space-y-6">
            {Object.entries(stats.segments).map(([segment, count]) => {
              const countNum = count as number;
              return (
                <div key={segment}>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                    <span className="text-slate-400">{segment}</span>
                    <span className="text-[#6A1B9A]">{countNum}</span>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(countNum / (stats.oscs || 1)) * 100}%` }}
                      className="h-full bg-[#6A1B9A]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Maturity Map */}
        <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/20 blur-[60px] rounded-full -mr-16 -mt-16" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black">Jornada de Evolução</h3>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/50 flex items-center gap-2">
                <Compass size={12} /> Roteiro Personalizado
              </div>
            </div>
            
            <div className="space-y-6 mb-8">
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Acompanhe o progresso da sua organização e desbloqueie novos marcos institucionais através da nossa jornada guiada.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Award size={24} className="text-brand-gold" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/50">Próximo Objetivo</div>
                  <div className="text-sm font-black">Selo de Maturidade Superior</div>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/ecossistema/jornada')}
              className="w-full bg-brand-blue text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-brand-blue transition-all"
            >
              Acessar Minha Jornada <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 mb-16">
        {/* Institutional Projects Engine */}
        <div className="lg:col-span-12 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Motor de Propostas Institucionais</h2>
              <p className="text-sm text-slate-500 font-medium">Geração automática de projetos baseada em dados reais do ecossistema.</p>
            </div>
            <Button 
              onClick={handleGenerateProject} 
              disabled={generating}
              className="bg-brand-gold text-brand-gold-dark border-brand-gold/20 hover:bg-brand-gold/20"
            >
              <Sparkles size={18} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Analisando Dados...' : 'Gerar Nova Proposta'}
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <motion.div 
                key={project.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    project.status_projeto === 'rascunho' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {project.status_projeto}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    project.prontidao_financiamento === 'alta' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    Prontidão: {project.prontidao_financiamento}
                  </div>
                </div>
                
                <h3 className="font-black text-slate-900 mb-4 leading-tight group-hover:text-[#6A1B9A] transition-colors line-clamp-2">
                  {project.titulo}
                </h3>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>OSCs Afetadas</span>
                    <span className="text-slate-900">{project.numero_oscs_afetadas}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>Maturidade Média</span>
                    <span className="text-slate-900">{project.nivel_maturidade_medio.toFixed(1)}/10</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>Abrangência</span>
                    <span className="text-slate-900">{project.abrangencia}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {project.principais_gargalos?.slice(0, 2).map((g: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-slate-50 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-lg">
                      {g}
                    </span>
                  ))}
                </div>

                <button 
                  onClick={() => {
                    setSelectedProject(project);
                    setShowDetailsModal(true);
                  }}
                  className="w-full py-4 rounded-2xl bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  Ver Detalhes
                  <ChevronRight size={14} />
                </button>
              </motion.div>
            ))}
            {projects.length === 0 && (
              <div className="col-span-full p-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-sm">
                  <FileText size={32} />
                </div>
                <h4 className="text-xl font-black text-slate-400 mb-2">Nenhuma proposta gerada</h4>
                <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">
                  Clique no botão acima para analisar os dados do ecossistema e gerar sua primeira proposta institucional.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px] p-12 shadow-2xl relative"
          >
            <button 
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <Settings size={24} className="rotate-45" />
            </button>

            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-brand-gold/10 rounded-2xl text-brand-gold">
                  <FileText size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900">{selectedProject.titulo}</h3>
                  <p className="text-slate-500 font-medium">Proposta Institucional Gerada em {new Date(selectedProject.created_at?.toDate()).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Status</p>
                  <p className="text-lg font-black text-slate-900 capitalize">{selectedProject.status_projeto}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Prontidão</p>
                  <p className="text-lg font-black text-slate-900 capitalize">{selectedProject.prontidao_financiamento}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">OSCs Impactadas</p>
                  <p className="text-lg font-black text-slate-900">{selectedProject.numero_oscs_afetadas}</p>
                </div>
              </div>

              <div className="space-y-6">
                <section>
                  <h4 className="text-lg font-black text-slate-900 mb-2">Problema Identificado</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedProject.problema_identificado}</p>
                </section>
                <section>
                  <h4 className="text-lg font-black text-slate-900 mb-2">Justificativa</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedProject.justificativa}</p>
                </section>
                <section>
                  <h4 className="text-lg font-black text-slate-900 mb-2">Metodologia CACI</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedProject.metodologia_caci}</p>
                </section>
                <section>
                  <h4 className="text-lg font-black text-slate-900 mb-2">Impacto Esperado</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedProject.impacto_esperado}</p>
                </section>
                {selectedProject.versao_financiador && (
                  <section className="p-8 bg-brand-gold/5 border border-brand-gold/20 rounded-3xl">
                    <h4 className="text-lg font-black text-brand-gold-dark mb-2 flex items-center gap-2">
                      <Sparkles size={20} />
                      Versão para Financiador
                    </h4>
                    <p className="text-brand-gold-dark/80 leading-relaxed italic">{selectedProject.versao_financiador}</p>
                  </section>
                )}
              </div>

              <div className="flex gap-4 pt-8 border-t border-slate-100 no-print">
                <Button 
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowAdaptModal(true);
                  }}
                  className="bg-slate-900 text-white hover:bg-slate-800"
                >
                  <Sparkles size={18} />
                  Adaptar para Financiador
                </Button>
                <Button 
                  onClick={() => window.print()}
                  variant="outline"
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <Printer size={18} />
                  Imprimir
                </Button>
                <Button 
                  onClick={() => setShowDetailsModal(false)}
                  variant="outline"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Adapt Modal */}
      {showAdaptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl"
          >
            <h3 className="text-2xl font-black text-slate-900 mb-2">Adaptar Proposta</h3>
            <p className="text-sm text-slate-500 mb-8">Personalize o conteúdo para um financiador específico.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nome do Financiador</label>
                <input 
                  type="text"
                  value={funderName}
                  onChange={(e) => setFunderName(e.target.value)}
                  placeholder="Ex: Fundação Bradesco, Google.org"
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-brand-gold transition-all font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tipo de Financiador</label>
                <div className="grid grid-cols-1 gap-2">
                  {(['fundação', 'corporativo', 'internacional'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFunderType(type)}
                      className={`px-6 py-4 rounded-2xl font-bold text-left transition-all ${
                        funderType === type 
                          ? 'bg-brand-gold text-brand-gold-dark shadow-lg shadow-brand-gold/20' 
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={handleAdaptProject}
                  disabled={adapting || !funderName}
                  className="flex-1 bg-slate-900 text-white"
                >
                  {adapting ? 'Adaptando...' : 'Confirmar Adaptação'}
                </Button>
                <Button 
                  onClick={() => setShowAdaptModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Protocol Details Modal */}
      <AnimatePresence>
        {selectedProtocol && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProtocol(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm no-print"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-12 overflow-y-auto">
                {/* Institutional Header (Visible only in print or modal) */}
                <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                      CACI
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">Casa de Apoio ao Cidadão</h1>
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">Fundada em 18/04/2003 • CNPJ: 05.639.031/0001-00</p>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Protocolo de Adesão</h2>
                  <p className="text-slate-500 font-medium">Comprovante de registro no Ecossistema CACI</p>
                </div>

                <div className="space-y-6 bg-slate-50 p-8 rounded-3xl border border-slate-100">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Organização</p>
                      <p className="font-bold text-slate-900">{selectedProtocol.nome_organizacao}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CNPJ</p>
                      <p className="font-bold text-slate-900">{selectedProtocol.cnpj || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data de Adesão</p>
                      <p className="font-bold text-slate-900">
                        {selectedProtocol.created_at?.toDate ? selectedProtocol.created_at.toDate().toLocaleDateString('pt-BR') : 'Recentemente'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <p className="font-bold text-emerald-600 uppercase">{selectedProtocol.status}</p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID do Protocolo</p>
                    <p className="font-mono text-xs text-slate-600 break-all">{selectedProtocol.id}</p>
                  </div>
                </div>

                <div className="mt-10 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    OBSERVATÓRIO NACIONAL DE MATURIDADE DAS OSCS — 2026+
                  </p>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 no-print">
                <Button 
                  onClick={() => window.print()}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Printer size={16} />
                  Imprimir Protocolo
                </Button>
                <Button 
                  onClick={() => setSelectedProtocol(null)}
                  variant="outline"
                  className="bg-white"
                >
                  Fechar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Pipeline */}
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900">Protocolos de Adesão Recentes</h2>
            <button className="text-xs font-black text-[#6A1B9A] uppercase tracking-widest hover:underline">Ver Todos</button>
          </div>
          
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organização / Data</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Prioridade</div>
            </div>
            <div className="divide-y divide-slate-50">
              {pipeline.length > 0 ? pipeline.map((item) => (
                <div key={item.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900">{item.nome_organizacao}</div>
                      <div className="text-[10px] text-slate-400 font-bold">
                        {item.created_at?.toDate ? item.created_at.toDate().toLocaleDateString() : 'Recentemente'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      item.status === 'concluido' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {item.status}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      item.prioridade === 'alta' ? 'bg-red-500' : item.prioridade === 'media' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <button 
                      onClick={() => setSelectedProtocol(item)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#6A1B9A] transition-all no-print"
                      title="Ver Protocolo"
                    >
                      <Printer size={16} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-slate-400 font-bold">Nenhuma adesão registrada.</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Interactions */}
        <div className="lg:col-span-5 space-y-8">
          <h2 className="text-2xl font-black text-slate-900">Interações Institucionais</h2>
          <div className="space-y-4">
            {recentInteractions.map((interaction) => (
              <div key={interaction.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex gap-6 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black text-[#6A1B9A] uppercase tracking-widest">{interaction.type}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{interaction.stage}</span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
                    {interaction.notes}
                  </p>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {interaction.created_at?.toDate ? interaction.created_at.toDate().toLocaleString() : 'Recentemente'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default Dashboard;
