import React, { useState } from 'react';
import { Info, X, CheckCircle2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ModuleList from '../components/ModuleList';
import { useAuth } from '../../hooks/useAuth';
import { PARTNERSHIP_MODELS } from '../constants/partnershipConstants';

const Partners = () => {
  const [showModels, setShowModels] = useState(false);

  const columns = [
    { key: 'name', label: 'Parceiro', sortable: true },
    { key: 'area', label: 'Área de Atuação', sortable: true },
    { key: 'performance', label: 'Desempenho', render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
        val === 'Alto' ? 'bg-emerald-50 text-emerald-600' : 
        val === 'Médio' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
      }`}>
        {val || 'Médio'}
      </span>
    )},
    { key: 'status', label: 'Status', render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
        val === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
      }`}>
        {val || 'Ativo'}
      </span>
    )},
  ];

  const formFields: any[] = [
    { key: 'name', label: 'Nome do Parceiro', type: 'text', required: true },
    { key: 'area', label: 'Área de Atuação', type: 'select', required: true, options: [
      { label: 'Educação', value: 'Educação' },
      { label: 'Saúde', value: 'Saúde' },
      { label: 'Meio Ambiente', value: 'Meio Ambiente' },
      { label: 'Tecnologia', value: 'Tecnologia' },
      { label: 'Cidadania', value: 'Cidadania' },
    ]},
    { key: 'campaigns', label: 'Campanhas Associadas', type: 'textarea' },
    { key: 'performance', label: 'Desempenho', type: 'select', options: [
      { label: 'Alto', value: 'Alto' },
      { label: 'Médio', value: 'Médio' },
      { label: 'Baixo', value: 'Baixo' },
    ]},
    { key: 'status', label: 'Status', type: 'select', options: [
      { label: 'Ativo', value: 'Ativo' },
      { label: 'Inativo', value: 'Inativo' },
    ]},
    { key: 'description', label: 'Descrição da Parceria', type: 'textarea' },
  ];

  const { profile } = useAuth();
  const isSubordinate = profile && !['superadmin', 'diretoria', 'governanca', 'projetos', 'rh', 'ti'].includes(profile.role);

  return (
    <>
      <ModuleList
        collectionName="partners"
        title="Gestão de Parcerias"
        description="Gerencie as parcerias institucionais e acompanhe seu desempenho."
        columns={columns}
        formFields={formFields}
        hierarchyRole={isSubordinate ? 'subordinate' : 'executive'}
        executiveModule="Diretoria & Conselhos"
        extraHeaderAction={
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowModels(true);
            }}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
          >
            <Info size={18} />
            Modelos de Plano
          </button>
        }
      />

      <AnimatePresence>
        {showModels && (
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowModels(false);
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="bg-white rounded-[40px] p-6 sm:p-10 w-full max-w-6xl shadow-2xl overflow-hidden relative max-h-[85vh] flex flex-col"
            >
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowModels(false);
                }}
                className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors z-10"
              >
                <X size={24} />
              </button>

              <div className="mb-8 shrink-0">
                <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Modelos de Parceria</h3>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                  <Info size={12} />
                  Programa de Parcerias Estratégicas
                </div>
                <p className="text-slate-500 font-medium italic">Conheça as estruturas de formalização e remuneração para parceiros do Ecossistema CACI.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-4 custom-scrollbar py-2">
                {PARTNERSHIP_MODELS.map((model, idx) => (
                  <div key={idx} className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 flex flex-col h-full hover:shadow-xl hover:bg-white transition-all group">
                    <h4 className="font-black text-brand-blue mb-4 text-xs uppercase tracking-widest group-hover:scale-105 transition-transform origin-left">{model.title}</h4>
                    <p className="text-xs text-slate-600 mb-6 flex-grow leading-relaxed">{model.description}</p>
                    
                    <div className="space-y-4 mt-auto">
                      <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Formalização</div>
                        <p className="text-[10px] text-slate-500 leading-tight font-medium">{model.details}</p>
                      </div>
                      
                      <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Remuneração</div>
                        <p className="text-[10px] text-slate-500 leading-tight font-black">{model.remuneration}</p>
                      </div>

                      {model.requirements && (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 shadow-sm">
                          <div className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Requisitos</div>
                          <p className="text-[10px] text-amber-700 leading-tight font-medium">{model.requirements}</p>
                        </div>
                      )}

                      <div className="space-y-2.5 pt-2">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Benefícios Inclusos</div>
                        {model.benefits.map((benefit, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-2.5 text-[9px] text-slate-500 font-medium">
                            <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
                <div className="text-sm text-slate-500 font-medium">
                  Para mais detalhes sobre o programa e registrar sua manifestação de interesse, 
                  <a 
                    href="https://forms.gle/5HLs8j14h3G9bxSE6" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-brand-blue font-black hover:underline ml-1"
                  >
                    acesse a página completa (Manifestação de interesse)
                  </a>
                </div>
                <div className="flex gap-4">
                  <a 
                    href="https://forms.gle/5HLs8j14h3G9bxSE6" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-8 py-4 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-blue/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    Manifestação de Interesse
                    <ExternalLink size={16} />
                  </a>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowModels(false);
                    }}
                    className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Partners;
