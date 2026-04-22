import React, { useState } from 'react';
import ModuleList from '../components/ModuleList';
import { Sparkles, Brain, CheckCircle, XCircle } from 'lucide-react';
import { getDiagnosticInsights } from '../../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

const Diagnostics = () => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<any>(null);

  const handleGetAiInsight = async (diagnostic: any) => {
    setLoadingAi(true);
    setSelectedDiagnostic(diagnostic);
    try {
      const insight = await getDiagnosticInsights(diagnostic);
      setAiInsight(insight || 'Não foi possível gerar insights no momento.');
    } catch (error) {
      console.error('Erro ao gerar insight:', error);
    } finally {
      setLoadingAi(false);
    }
  };

  const columns = [
    { key: 'organizationName', label: 'Organização', sortable: true },
    { key: 'classification', label: 'Nível de Maturidade', sortable: true, render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
        val === 'Referência institucional' ? 'bg-emerald-50 text-emerald-600' : 
        val === 'Consolidado' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
      }`}>
        {val || 'Iniciante'}
      </span>
    )},
    { key: 'overallPercentage', label: 'Pontuação', sortable: true, render: (val: number) => `${Math.round(val || 0)}%` },
    { key: 'timestamp', label: 'Data', render: (val: any) => val?.toDate ? val.toDate().toLocaleDateString('pt-BR') : 'Recente' },
    { key: 'ai', label: 'IA Assistente', render: (_: any, row: any) => (
      <button 
        onClick={() => handleGetAiInsight(row)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue/10 text-brand-blue rounded-lg text-[10px] font-bold hover:bg-brand-blue hover:text-white transition-all"
      >
        <Sparkles size={12} />
        Insights IA
      </button>
    )},
  ];

  const formFields: any[] = [
    { key: 'organizationName', label: 'Nome da OSC', type: 'text', required: true },
    { key: 'classification', label: 'Nível de Maturidade', type: 'select', required: true, options: [
      { label: 'Em desenvolvimento', value: 'Em desenvolvimento' },
      { label: 'Estruturando', value: 'Estruturando' },
      { label: 'Consolidado', value: 'Consolidado' },
      { label: 'Referência institucional', value: 'Referência institucional' },
    ]},
    { key: 'overallPercentage', label: 'Pontuação (0-100)', type: 'number', required: true },
    { key: 'strengths', label: 'Pontos Fortes', type: 'textarea' },
    { key: 'weaknesses', label: 'Pontos de Melhoria', type: 'textarea' },
    { key: 'summary', label: 'Resumo', type: 'textarea' },
  ];

  return (
    <div className="relative">
      <ModuleList
        collectionName="institutional_diagnostics"
        title="Gestão de Diagnósticos"
        description="Gerencie os resultados dos diagnósticos de maturidade organizacional das OSCs."
        columns={columns}
        formFields={formFields}
      />

      {/* AI Insight Modal */}
      <AnimatePresence>
        {(loadingAi || aiInsight) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setAiInsight(null); setLoadingAi(false); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <header className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-brand-blue text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Brain size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Insights da IA Assistente</h3>
                    <p className="text-sm opacity-80">{selectedDiagnostic?.oscName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setAiInsight(null); setLoadingAi(false); }}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </header>

              <div className="p-8 overflow-y-auto">
                {loadingAi ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Analisando dados e gerando recomendações...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10">
                      <h4 className="text-brand-blue font-bold mb-4 flex items-center gap-2">
                        <Sparkles size={18} />
                        Sugestões de Melhoria
                      </h4>
                      <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {aiInsight}
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
                      <div className="text-amber-500 shrink-0">
                        <CheckCircle size={20} />
                      </div>
                      <p className="text-xs text-amber-700 font-medium italic">
                        Atenção: Estes insights são gerados automaticamente por inteligência artificial e devem ser validados por um consultor institucional antes de qualquer implementação estratégica.
                      </p>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button 
                        onClick={() => setAiInsight(null)}
                        className="px-8 py-3 bg-brand-blue text-white rounded-2xl font-bold shadow-lg shadow-brand-blue/20 hover:scale-[1.02] active:scale-100 transition-all"
                      >
                        Entendido, Validar Depois
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Diagnostics;
