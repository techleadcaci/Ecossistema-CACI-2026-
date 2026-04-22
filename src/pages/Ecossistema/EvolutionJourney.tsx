import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Target, 
  CheckCircle2, 
  Circle, 
  Lock, 
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Award,
  TrendingUp,
  ShieldCheck,
  Building2,
  Users,
  Briefcase,
  Zap
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '../../App';

const EvolutionJourney: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { orgId: string; orgName: string } | null;
  
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!state?.orgId) {
        setLoading(false);
        return;
      }

      try {
        const orgDoc = await getDoc(doc(db, 'organizations', state.orgId));
        if (orgDoc.exists()) {
          setOrgData(orgDoc.data());
        }
      } catch (error) {
        console.error("Error fetching journey data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [state?.orgId]);

  if (loading) return <div className="flex items-center justify-center h-screen font-black text-slate-400 animate-pulse text-2xl">Traçando sua Jornada...</div>;

  if (!orgData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center mx-auto">
            <Compass size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Jornada Bloqueada</h2>
          <p className="text-slate-500 font-medium">Você precisa realizar o diagnóstico institucional para que possamos traçar sua jornada personalizada de evolução.</p>
          <Button onClick={() => navigate('/ecossistema/diagnostico')} className="bg-brand-blue text-white w-full">Iniciar Diagnóstico</Button>
        </div>
      </div>
    );
  }

  const journeySteps = [
    {
      title: 'Mapeamento e Diagnóstico',
      description: 'Identificação do perfil institucional e diagnóstico de maturidade em 8 dimensões.',
      status: 'completed',
      icon: Building2,
      tasks: [
        { label: 'Cadastro Institucional', done: true },
        { label: 'Diagnóstico de Maturidade', done: true },
        { label: 'Protocolo de Adesão', done: true }
      ]
    },
    {
      title: 'Estruturação de Governança',
      description: 'Implementação de processos de transparência e fortalecimento do conselho.',
      status: orgData.overall_score >= 40 ? 'current' : 'locked',
      icon: ShieldCheck,
      tasks: [
        { label: 'Revisão de Estatuto', done: orgData.overall_score >= 50 },
        { label: 'Manual de Transparência', done: orgData.overall_score >= 60 },
        { label: 'Atas de Reunião Digitalizadas', done: orgData.overall_score >= 70 }
      ]
    },
    {
      title: 'Capacidade de Execução',
      description: 'Otimização de processos internos e gestão de projetos com foco em resultados.',
      status: orgData.overall_score >= 60 ? 'current' : 'locked',
      icon: Zap,
      tasks: [
        { label: 'Gestão de Beneficiários', done: orgData.overall_score >= 75 },
        { label: 'Indicadores de Impacto', done: orgData.overall_score >= 80 },
        { label: 'Relatórios de Atividades', done: orgData.overall_score >= 85 }
      ]
    },
    {
      title: 'Escalabilidade e Captação',
      description: 'Diversificação de fontes de recursos e preparação para editais internacionais.',
      status: orgData.overall_score >= 80 ? 'current' : 'locked',
      icon: TrendingUp,
      tasks: [
        { label: 'Plano de Captação 2026', done: orgData.overall_score >= 90 },
        { label: 'Selo Diamante CACI', done: orgData.overall_score >= 95 },
        { label: 'Elegibilidade Internacional', done: orgData.overall_score >= 98 }
      ]
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <div className="max-w-5xl mx-auto py-12 px-6">
        <header className="mb-16">
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest mb-6 transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar ao Painel
          </button>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue/5 text-brand-blue text-[10px] font-black uppercase tracking-widest mb-6 border border-brand-blue/10">
                <Sparkles size={14} />
                Jornada de Evolução Institucional
              </div>
              <h1 className="text-5xl font-display font-black tracking-tighter text-slate-900 leading-none">
                Caminho para a <span className="text-brand-blue">Excelência</span>
              </h1>
              <p className="text-lg text-slate-500 font-medium mt-4">Seu roteiro personalizado para fortalecer a {orgData.nome_organizacao}.</p>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso Geral</div>
                <div className="text-2xl font-black text-slate-900">{orgData.overall_score || 0}%</div>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                <Target size={32} />
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-12">
          {journeySteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';
            const isLocked = step.status === 'locked';

            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex gap-12 group ${isLocked ? 'opacity-60' : ''}`}
              >
                {/* Timeline Line */}
                {index < journeySteps.length - 1 && (
                  <div className="absolute left-8 top-16 bottom-0 w-1 bg-slate-200 -mb-12" />
                )}

                {/* Step Icon */}
                <div className="relative z-10 shrink-0">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${
                    isCompleted ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' :
                    isCurrent ? 'bg-brand-blue text-white shadow-xl shadow-brand-blue/20 animate-pulse' :
                    'bg-slate-200 text-slate-400'
                  }`}>
                    {isLocked ? <Lock size={24} /> : <Icon size={24} />}
                  </div>
                </div>

                {/* Step Content */}
                <div className={`flex-1 bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm transition-all ${
                  isCurrent ? 'ring-4 ring-brand-blue/10 shadow-2xl' : ''
                }`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{step.title}</h3>
                        {isCompleted && <CheckCircle2 size={20} className="text-emerald-500" />}
                      </div>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">{step.description}</p>
                    </div>
                    {isCurrent && (
                      <Button onClick={() => navigate('/ecossistema/recomendacao/' + orgData.last_diagnostic_id)} className="bg-slate-900 text-white text-[10px] uppercase tracking-widest font-black">
                        Continuar Evolução <ChevronRight size={14} />
                      </Button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-3 gap-6">
                    {step.tasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        {task.done ? (
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        ) : (
                          <Circle size={16} className="text-slate-300 shrink-0" />
                        )}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${task.done ? 'text-slate-900' : 'text-slate-400'}`}>
                          {task.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Next Milestone Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-20 p-12 rounded-[60px] bg-brand-blue text-white relative overflow-hidden shadow-2xl shadow-brand-blue/30"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center">
                <Award size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black tracking-tighter">Próximo Marco: Selo {orgData.maturity_seal === 'Bronze' ? 'Prata' : orgData.maturity_seal === 'Prata' ? 'Ouro' : 'Diamante'}</h3>
                <p className="text-white/70 font-medium max-w-xl leading-relaxed">
                  Ao completar as tarefas de Governança e Transparência, sua organização estará apta a receber o próximo selo de maturidade, desbloqueando novas oportunidades de financiamento.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/ecossistema/recomendacao/' + orgData.last_diagnostic_id)} className="bg-white text-brand-blue py-6 px-12 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
              Acessar Recomendações
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EvolutionJourney;
