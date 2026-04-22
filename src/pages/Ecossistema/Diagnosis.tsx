import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Target, 
  Heart, 
  Settings, 
  DollarSign, 
  MessageSquare, 
  Cpu, 
  Lightbulb,
  ClipboardCheck,
  Lock,
  LogIn,
  AlertTriangle,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase';
import { processarDiagnostico } from "../../services/ecossistemaService";
import { QUESTIONS } from "../../services/diagnosticMotor";
import { Answer } from "../../types";

const Diagnosis: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Erro ao fazer login:", err);
    }
  };

  const stateData = location.state as { 
    orgId?: string; 
    orgName?: string; 
    name?: string; 
    email?: string; 
    phone?: string;
    existingDiagId?: string;
  } | null;

  const [step, setStep] = useState(stateData?.orgId ? 1 : 0);
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: stateData?.name || "",
    email: stateData?.email || "",
    phone: stateData?.phone || "",
    orgName: stateData?.orgName || "",
    city: "",
    state: "",
    year_founded: "",
    legal_status: "",
    size: "",
    main_area: "",
  });

  const dimensions = Array.from(new Set(QUESTIONS.map(q => q.dimension)));
  const currentDimension = dimensions[currentDimensionIndex];
  const dimensionQuestions = QUESTIONS.filter(q => q.dimension === currentDimension);
  
  const progress = (step === 0) ? 0 : ((currentDimensionIndex + 1) / dimensions.length) * 100;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-sequential-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-sequential-0 min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-12 rounded-[60px] shadow-2xl text-center space-y-8 border border-slate-100"
        >
          <div className="w-20 h-20 bg-brand-blue/10 text-brand-blue rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock size={40} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Autenticação Necessária</h2>
            <p className="text-slate-500 font-medium">
              Para realizar o diagnóstico institucional no Ecossistema CACI, você precisa estar autenticado.
            </p>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-blue transition-all shadow-xl shadow-slate-200"
          >
            <LogIn size={18} />
            Entrar com Google
          </button>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Ambiente Seguro • CACI Strategic
          </p>
        </motion.div>
      </div>
    );
  }

  const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => a.questionId === questionId ? { ...a, value } : a);
      }
      return [...prev, { questionId, value }];
    });
  };

  const handleNext = () => {
    // Check if all questions in current dimension are answered
    const unanswered = dimensionQuestions.filter(q => !answers.find(a => a.questionId === q.id));
    if (unanswered.length > 0) {
      alert("Por favor, responda todas as perguntas desta dimensão antes de prosseguir.");
      return;
    }

    if (currentDimensionIndex < dimensions.length - 1) {
      setCurrentDimensionIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      setStep(dimensions.length + 1); // Final step
    }
  };

  const handleSubmit = async () => {
    if (!stateData?.orgId) {
      alert("Por favor, realize a adesão ao ecossistema antes de fazer o diagnóstico.");
      navigate("/ecossistema/adesao");
      return;
    }

    setLoading(true);
    try {
      const { diagId, detailedResult } = await processarDiagnostico(
        stateData.orgId,
        answers,
        formData.orgName,
        formData.phone,
        formData.name,
        stateData.existingDiagId
      );

      navigate(`/ecossistema/resultado/${diagId}`, { 
        state: { 
          detailedResult,
          name: formData.name, 
          email: formData.email,
          phone: formData.phone,
          orgName: formData.orgName,
        } 
      });
    } catch (error) {
      console.error("Erro ao salvar diagnóstico:", error);
      alert("Erro ao processar diagnóstico.");
    } finally {
      setLoading(false);
    }
  };

  const getDimensionIcon = (dimension: string) => {
    switch (dimension) {
      case 'Governança e Liderança': return <ShieldCheck size={24} />;
      case 'Estratégia e Planejamento': return <Target size={24} />;
      case 'Gestão de Pessoas (Capital Humano)': return <Users size={24} />;
      case 'Execução de Projetos e Impacto': return <Heart size={24} />;
      case 'Sustentabilidade Financeira': return <DollarSign size={24} />;
      case 'Comunicação e Posicionamento Institucional': return <MessageSquare size={24} />;
      case 'Maturidade Digital e Tecnológica': return <Cpu size={24} />;
      case 'Monitoramento, Avaliação e Aprendizado': return <CheckCircle2 size={24} />;
      default: return <ClipboardCheck size={24} />;
    }
  };

  return (
    <div className="min-h-screen bg-sequential-0 flex flex-col p-6">
      <div className="max-w-4xl w-full mx-auto space-y-8 py-12">
        {/* Header & Progress */}
        <div className="space-y-4">
          <button 
            onClick={() => {
              if (step === 0) navigate("/ecossistema");
              else if (currentDimensionIndex > 0) setCurrentDimensionIndex(currentDimensionIndex - 1);
              else setStep(0);
            }}
            className="flex items-center text-slate-500 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Voltar
          </button>
          
          <div className="flex items-center justify-between text-sm font-medium text-slate-500">
            <span>{step === 0 ? "Identificação" : `Dimensão ${currentDimensionIndex + 1} de ${dimensions.length}`}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-emerald-500"
            />
          </div>
        </div>

        <div className="bg-white p-8 sm:p-12 rounded-[40px] shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 flex-1"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-slate-900">Identificação Institucional</h2>
                  <p className="text-slate-500">Confirme os dados da sua organização para iniciar o diagnóstico avançado.</p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome da Organização</label>
                    <input name="orgName" value={formData.orgName} onChange={handleOrgChange} type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" placeholder="Ex: Instituto CACI" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Seu Nome</label>
                    <input name="name" value={formData.name} onChange={handleOrgChange} type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" placeholder="Ex: João Silva" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">E-mail</label>
                    <input name="email" value={formData.email} onChange={handleOrgChange} type="email" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" placeholder="seu@email.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">WhatsApp</label>
                    <input name="phone" value={formData.phone} onChange={handleOrgChange} type="tel" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" placeholder="(00) 00000-0000" />
                  </div>
                </div>
              </motion.div>
            ) : step <= dimensions.length ? (
              <motion.div
                key={`dim-${currentDimensionIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 flex-1"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    {getDimensionIcon(currentDimension)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{currentDimension}</h2>
                    <p className="text-sm text-slate-500 font-medium">Responda com sinceridade para um diagnóstico preciso.</p>
                  </div>
                </div>

                <div className="space-y-8 py-4">
                  {dimensionQuestions.map((q) => (
                    <div key={q.id} className="space-y-4 p-6 rounded-3xl bg-slate-50 border border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 leading-tight">{q.text}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options?.map((opt) => (
                          <button
                            key={opt.label}
                            onClick={() => handleAnswer(q.id, opt.value)}
                            className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-1 ${
                              answers.find(a => a.questionId === q.id)?.value === opt.value
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                : 'bg-white border-transparent text-slate-600 hover:border-slate-200'
                            }`}
                          >
                            <span className="font-bold text-sm">{opt.label}</span>
                            {opt.isCritical && (
                              <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1">
                                <AlertTriangle size={10} />
                                Crítico
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="final"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center flex-1 space-y-8"
              >
                <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={64} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Diagnóstico Concluído</h2>
                <p className="text-slate-500 max-w-md font-medium">
                  Tudo pronto! Agora vamos gerar seu score institucional, selo de maturidade e as recomendações personalizadas da CACIia.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between">
            <button 
              onClick={() => {
                if (step === 0) navigate("/ecossistema");
                else if (currentDimensionIndex > 0) setCurrentDimensionIndex(currentDimensionIndex - 1);
                else setStep(0);
              }}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
            >
              <ArrowLeft size={18} /> Voltar
            </button>
            
            {step === 0 ? (
              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-brand-blue transition-all"
              >
                Começar Diagnóstico <ArrowRight size={18} />
              </button>
            ) : step <= dimensions.length ? (
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 hover:scale-105 active:scale-95 transition-all"
              >
                {currentDimensionIndex === dimensions.length - 1 ? 'Revisar e Finalizar' : 'Próxima Dimensão'} <ArrowRight size={18} />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-12 py-5 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Gerar Inteligência Estratégica'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Users = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

export default Diagnosis;
