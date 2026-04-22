import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardCheck, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  History, 
  ShieldCheck, 
  Users, 
  Briefcase, 
  MessageSquare, 
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Save,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useReactToPrint } from 'react-to-print';
import { QUESTIONS, calculateDiagnostic } from '../../services/diagnosticMotor';
import { InstitutionalDiagnostic as DiagnosticType, Answer, Question } from '../../types';
import { db, auth } from '../../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { formatBRDateTime, formatBRDate } from '../../services/maintenanceService';
import { useAuth } from '../../hooks/useAuth';
import CACIiaChat from '../../components/AI/CACIiaChat';
import { Skeleton } from '../../components/Skeleton';

const InstitutionalDiagnostic = () => {
  const { user, profile } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<'intro' | 'questions' | 'results' | 'history'>('intro');
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [result, setResult] = useState<DiagnosticType | null>(null);
  const [history, setHistory] = useState<DiagnosticType[]>([]);
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState<string>('org_default');
  const [orgName, setOrgName] = useState<string>('Organização');

  const dimensions = Array.from(new Set(QUESTIONS.map(q => q.dimension)));
  const currentDimension = dimensions[currentDimensionIndex];
  const dimensionQuestions = QUESTIONS.filter(q => q.dimension === currentDimension);

  useEffect(() => {
    if (user) {
      fetchHistory();
      fetchOrg();
    }
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step, currentDimensionIndex]);

  const fetchOrg = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'organizations'), where('owner_user_id', '==', user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setOrgId(snapshot.docs[0].id);
        setOrgName(data.name || 'Minha Organização');
      }
    } catch (err) {
      console.error('Error fetching organization:', err);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'institutional_diagnostics'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      const historyData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        // Ensure timestamp is handled correctly for display
        timestamp: doc.data().timestamp
      } as DiagnosticType));
      setHistory(historyData);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
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
    if (currentDimensionIndex < dimensions.length - 1) {
      setCurrentDimensionIndex(prev => prev + 1);
    } else {
      finishDiagnostic();
    }
  };

  const finishDiagnostic = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const diagResult = calculateDiagnostic(answers, user.uid, orgId, orgName);
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'institutional_diagnostics'), {
        ...diagResult,
        id_ccgu: profile?.id_ccgu || 'pendente_configuracao',
        id_cfrh: profile?.id_cfrh || 'pendente_configuracao',
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // Update local state with the saved result (including the new ID)
      const finalResult = { ...diagResult, id: docRef.id };
      setResult(finalResult);
      
      await fetchHistory();
      setStep('results');
    } catch (err) {
      console.error('Error saving diagnostic:', err);
      // Even if saving fails, show the results to the user
      const diagResult = calculateDiagnostic(answers, user.uid, orgId, orgName);
      setResult(diagResult);
      setStep('results');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Diagnostico_IMI_${orgName}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`,
  });

  const getDimensionIcon = (dimension: string) => {
    switch (dimension) {
      case 'Governança e Liderança': return <ShieldCheck size={20} />;
      case 'Estratégia e Planejamento': return <TrendingUp size={20} />;
      case 'Gestão de Pessoas (Capital Humano)': return <Users size={20} />;
      case 'Execução de Projetos e Impacto': return <Briefcase size={20} />;
      case 'Sustentabilidade Financeira': return <DollarSign size={20} />;
      case 'Comunicação e Posicionamento Institucional': return <MessageSquare size={20} />;
      case 'Maturidade Digital e Tecnológica': return <ClipboardCheck size={20} />;
      case 'Monitoramento, Avaliação e Aprendizado': return <CheckCircle2 size={20} />;
      default: return <ClipboardCheck size={20} />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ClipboardCheck className="text-brand-blue" size={32} />
            Diagnóstico Institucional
          </h1>
          <p className="text-slate-500 font-medium mt-1">Avaliação de maturidade e conformidade institucional (IMI Base).</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setStep('history')}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <History size={18} />
            Histórico
          </button>
          {step !== 'intro' && (
            <button 
              onClick={() => {
                setStep('intro');
                setAnswers([]);
                setResult(null);
                setCurrentDimensionIndex(0);
              }}
              className="px-6 py-3 bg-brand-blue text-white rounded-2xl font-bold hover:bg-brand-blue/90 transition-all shadow-lg"
            >
              Novo Diagnóstico
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-12 rounded-[40px] shadow-2xl border border-slate-100 text-center space-y-8"
          >
            <div className="w-24 h-24 bg-brand-blue/10 text-brand-blue rounded-[32px] flex items-center justify-center mx-auto">
              <TrendingUp size={48} />
            </div>
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-2xl font-black text-slate-900">Pronto para elevar o nível da sua instituição?</h2>
              <p className="text-slate-500 leading-relaxed">
                Nosso motor de diagnóstico analisa 8 camadas críticas da sua organização para gerar um Índice de Maturidade Institucional (IMI) avançado, 
                baseado em frameworks globais de gestão, ESG e maturidade digital.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left max-w-4xl mx-auto">
              {[
                'Governança & Liderança', 
                'Estratégia & Planejamento', 
                'Gestão de Pessoas', 
                'Projetos & Impacto',
                'Sustentabilidade Financeira',
                'Comunicação & Marca',
                'Maturidade Digital',
                'Monitoramento & Dados'
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-500" size={16} />
                  <span className="text-[11px] font-bold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setStep('questions')}
              className="px-12 py-5 bg-brand-blue text-white rounded-[24px] font-black text-lg hover:bg-brand-blue/90 transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
            >
              Iniciar Diagnóstico
              <ArrowRight size={20} />
            </button>
          </motion.div>
        )}

        {step === 'questions' && (
          <motion.div 
            key="questions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Progress */}
            <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center">
                  {getDimensionIcon(currentDimension)}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dimensão Atual</div>
                  <div className="text-lg font-black text-slate-900">{currentDimension}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progresso</div>
                <div className="text-lg font-black text-brand-blue">{currentDimensionIndex + 1} / {dimensions.length}</div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {dimensionQuestions.map((q) => (
                <div key={q.id} className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100 space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">{q.text}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {q.options?.map((opt) => (
                      <motion.button
                        key={opt.label}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(q.id, opt.value)}
                        className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${
                          answers.find(a => a.questionId === q.id)?.value === opt.value
                            ? 'bg-brand-blue/5 border-brand-blue text-brand-blue'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                        }`}
                      >
                        <span className="font-bold">{opt.label}</span>
                        {opt.isCritical && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1">
                            <AlertTriangle size={10} />
                            Crítico
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <button
                disabled={currentDimensionIndex === 0}
                onClick={() => setCurrentDimensionIndex(prev => prev - 1)}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <ChevronLeft size={20} />
                Anterior
              </button>
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-12 py-4 bg-brand-blue text-white rounded-2xl font-black hover:bg-brand-blue/90 transition-all shadow-lg flex items-center gap-2"
              >
                {currentDimensionIndex === dimensions.length - 1 ? (loading ? 'Processando...' : 'Finalizar') : 'Próxima Dimensão'}
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'results' && result && (
          <motion.div 
            key="results"
            ref={contentRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 print:space-y-4 print:text-slate-900 print:p-8"
          >
            {/* Classification Card */}
            <div className="bg-slate-900 p-12 rounded-[48px] shadow-2xl text-center relative overflow-hidden print:bg-white print:text-slate-900 print:border print:border-slate-200 print:shadow-none print:p-6 print:rounded-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 blur-[100px] rounded-full -mr-32 -mt-32 print:hidden" />
              <div className="relative z-10 space-y-6 print:space-y-2">
                <div className="text-[12px] font-black uppercase tracking-[0.3em] text-brand-blue print:tracking-normal">Classificação IMI</div>
                <h2 className="text-5xl font-black text-white tracking-tight print:text-slate-900 print:text-3xl">{result.classification}</h2>
                <div className="flex items-center justify-center gap-4 print:hidden">
                  <div className="px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm font-bold backdrop-blur-md">
                    {result.dimensionScores.length} Dimensões Avaliadas
                  </div>
                  <div className="px-4 py-2 bg-emerald-500/20 rounded-full text-emerald-400 text-sm font-bold backdrop-blur-md">
                    Auditado por Regras
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block print:space-y-6">
              {/* Risks & Recommendations */}
              <div className="lg:col-span-2 space-y-8 print:space-y-6">
                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
                  <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 print:p-4 print:rounded-2xl print:shadow-none">
                    <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="text-emerald-500" size={20} />
                      Pontos Fortes
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.strengths.map((s, i) => (
                        <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider print:border print:border-emerald-100">
                          {s}
                        </span>
                      ))}
                      {result.strengths.length === 0 && <span className="text-slate-400 text-sm italic">Nenhum destaque identificado.</span>}
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 print:p-4 print:rounded-2xl print:shadow-none">
                    <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="text-rose-500" size={20} />
                      Gaps Críticos
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.weaknesses.map((w, i) => (
                        <span key={i} className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-bold uppercase tracking-wider print:border print:border-rose-100">
                          {w}
                        </span>
                      ))}
                      {result.weaknesses.length === 0 && <span className="text-slate-400 text-sm italic">Nenhum gap crítico identificado.</span>}
                    </div>
                  </div>
                </div>

                {/* Risks */}
                <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 print:p-4 print:rounded-2xl print:shadow-none">
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <AlertTriangle className="text-rose-500" size={24} />
                    Riscos Identificados
                  </h3>
                  <div className="space-y-4">
                    {result.risks.length > 0 ? result.risks.map((risk, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-4 print:bg-white print:border-slate-200">
                        <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0 print:hidden">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-rose-900 print:text-slate-900">{risk.message}</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 mt-1">Dimensão: {risk.dimension}</div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-slate-400 font-medium">Nenhum risco crítico identificado.</div>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 print:p-4 print:rounded-2xl print:shadow-none">
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <TrendingUp className="text-emerald-500" size={24} />
                    Recomendações Automáticas
                  </h3>
                  <div className="space-y-4">
                    {result.recommendations.map((rec, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4 print:bg-white print:border-slate-200">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 print:hidden ${
                          rec.priority === 'alta' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          <ChevronRight size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{rec.text}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dimensão: {rec.dimension}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              rec.priority === 'alta' ? 'text-rose-500' : 'text-amber-500'
                            }`}>Prioridade {rec.priority}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dimension Performance */}
              <div className="space-y-8 print:space-y-6">
                <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 print:p-4 print:rounded-2xl print:shadow-none">
                  <h3 className="text-xl font-black text-slate-900 mb-6">Desempenho por Dimensão</h3>
                  <div className="space-y-8 print:space-y-4">
                    {result.dimensionScores.map((d) => (
                      <div key={d.dimension} className="space-y-3 print:space-y-1">
                        <div className="flex justify-between text-sm font-bold text-slate-700">
                          <span>{d.dimension}</span>
                          <span className={d.percentage > 75 ? 'text-emerald-500' : d.percentage < 40 ? 'text-rose-500' : 'text-amber-500'}>
                            {d.level}
                          </span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden print:h-2 print:border print:border-slate-200">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${d.percentage}%` }}
                            className={`h-full rounded-full ${
                              d.percentage > 75 ? 'bg-emerald-500' : d.percentage > 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-brand-blue p-8 rounded-[40px] shadow-xl text-white print:bg-white print:text-slate-900 print:border print:border-slate-200">
                  <h3 className="font-bold mb-4">Resumo Executivo</h3>
                  <p className="text-sm text-white/80 leading-relaxed font-medium print:text-slate-600">
                    {result.summary}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 print:hidden">
                    <button 
                      onClick={() => handlePrint()}
                      className="flex-1 py-4 bg-white text-brand-blue hover:bg-white/90 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95"
                    >
                      <ClipboardCheck size={18} />
                      IMPRIMIR RELATÓRIO
                    </button>
                    <button 
                      onClick={() => handlePrint()}
                      className="flex-1 py-4 bg-white/20 hover:bg-white/30 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                    >
                      <FileText size={18} />
                      Exportar PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Histórico de Diagnósticos</h3>
              <span className="text-sm font-bold text-slate-400">{history.length} registros encontrados</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Classificação</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Riscos</th>
                    <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i}>
                        <td className="px-8 py-6"><Skeleton height={20} width="80%" /></td>
                        <td className="px-8 py-6"><Skeleton height={20} width="60%" /></td>
                        <td className="px-8 py-6"><Skeleton height={20} width="40%" /></td>
                        <td className="px-8 py-6"><Skeleton height={20} width="100%" /></td>
                      </tr>
                    ))
                  ) : history.map((diag) => (
                    <tr key={diag.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-slate-900">
                          {formatBRDate(diag.timestamp)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {diag.timestamp ? formatBRDateTime(diag.timestamp).split(' ')[1] : ''}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          diag.classification === 'Referência institucional' ? 'bg-emerald-50 text-emerald-600' :
                          diag.classification === 'Consolidado' ? 'bg-blue-50 text-blue-600' :
                          diag.classification === 'Estruturando' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {diag.classification}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} className={diag.risks.length > 0 ? 'text-rose-500' : 'text-slate-200'} />
                          <span className="text-sm font-bold text-slate-600">{diag.risks.length}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={async () => {
                              setResult(diag);
                              setStep('results');
                              // Wait for state update and rendering
                              setTimeout(() => handlePrint(), 500);
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                            title="Imprimir"
                          >
                            <ClipboardCheck size={20} />
                          </button>
                          <button 
                            onClick={() => {
                              setResult(diag);
                              setStep('results');
                            }}
                            className="p-2 text-slate-400 hover:text-brand-blue transition-colors"
                            title="Ver Detalhes"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {step === 'results' && result && (
        <CACIiaChat 
          agentType="osc" 
          organizationId={result.organizationId} 
          initialMessage={`Olá! Sou a CACIia. Analisei seu diagnóstico de maturidade (${result.classification}). Como posso te ajudar a interpretar esses dados ou sugerir melhorias práticas?`}
        />
      )}
    </div>
  );
};

export default InstitutionalDiagnostic;
