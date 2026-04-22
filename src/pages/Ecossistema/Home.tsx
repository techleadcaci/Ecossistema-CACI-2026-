import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ClipboardCheck, Users, ArrowRight, Handshake, Info, X, CheckCircle2 } from "lucide-react";
import { PARTNERSHIP_MODELS } from "../../Intranet/constants/partnershipConstants";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [showPartnershipInfo, setShowPartnershipInfo] = useState(false);

  return (
    <div className="min-h-screen bg-sequential-0 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl w-full text-center space-y-8"
      >
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight">
            O Futuro <span className="text-[#6A1B9A]">Acontece</span> Aqui
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Avalie a maturidade institucional da sua OSC e receba recomendações personalizadas para crescer e gerar mais impacto.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {/* Opção 1: Avaliar Organização */}
          <motion.button
            whileHover={{ y: -5, scale: 1.02, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/ecossistema/adesao")}
            className="flex flex-col items-center p-8 bg-white rounded-[40px] shadow-sm border border-slate-200 hover:border-[#6A1B9A] transition-all group text-left"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#6A1B9A] transition-colors">
              <ClipboardCheck className="w-8 h-8 text-[#6A1B9A] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Protocolo de Adesão</h3>
            <p className="text-slate-500 mb-6">
              Inicie sua jornada no Ecossistema CACI através do protocolo institucional unificado.
            </p>
            <div className="mt-auto flex items-center text-[#6A1B9A] font-semibold">
              Iniciar Adesão <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </motion.button>

          {/* Opção 2: Atuar como Parceiro */}
          <motion.button
            whileHover={{ y: -5, scale: 1.02, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/ecossistema/adesao?type=profissional")}
            className="flex flex-col items-center p-8 bg-white rounded-[40px] shadow-sm border border-slate-200 hover:border-emerald-500 transition-all group text-left"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors">
              <Users className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Rede de Colaboração</h3>
            <p className="text-slate-500 mb-6">
              Junte-se à nossa rede de especialistas e ajude a fortalecer o terceiro setor.
            </p>
            <div className="mt-auto flex items-center text-emerald-600 font-semibold">
              Cadastrar Perfil <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </motion.button>

          {/* Opção 3: Parceiros Institucionais */}
          <motion.button
            whileHover={{ y: -5, scale: 1.02, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPartnershipInfo(true)}
            className="flex flex-col items-center p-8 bg-white rounded-[40px] shadow-sm border border-slate-200 hover:border-brand-blue transition-all group text-left"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-brand-blue transition-colors">
              <Handshake className="w-8 h-8 text-brand-blue group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Parceiros Institucionais</h3>
            <p className="text-slate-500 mb-6">
              Programa de Parcerias Estratégicas para profissionais e instituições de alto impacto.
            </p>
            <div className="mt-auto flex items-center text-brand-blue font-semibold">
              Ver Modelo <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </motion.button>
        </div>

        <div className="pt-12 text-slate-400 text-sm">
          ONG CACI • Casa de Apoio ao Cidadão
        </div>
      </motion.div>

      <AnimatePresence>
        {showPartnershipInfo && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] p-10 w-full max-w-4xl shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowPartnershipInfo(false)}
                className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-[10px] font-black uppercase tracking-widest mb-4">
                  <Handshake size={14} />
                  Modelos de Parceria
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-3">Programa de Parcerias Estratégicas</h3>
                <p className="text-slate-500 text-lg">Conheça as estruturas de formalização e remuneração para parceiros do Ecossistema CACI.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PARTNERSHIP_MODELS.map((model, idx) => (
                  <div key={idx} className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 flex flex-col h-full hover:border-brand-blue/30 transition-all">
                    <h4 className="font-black text-brand-blue mb-4 text-sm uppercase tracking-widest leading-tight">{model.title}</h4>
                    <p className="text-xs text-slate-600 mb-6 flex-grow leading-relaxed">{model.description}</p>
                    
                    <div className="space-y-4 mt-auto">
                      <div className="p-4 rounded-2xl bg-white border border-slate-100">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Formalização</div>
                        <p className="text-[11px] text-slate-500 leading-tight">{model.details}</p>
                      </div>
                      
                      <div className="p-4 rounded-2xl bg-white border border-slate-100">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Remuneração</div>
                        <p className="text-[11px] text-slate-700 leading-tight font-bold">{model.remuneration}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Benefícios</div>
                        {model.benefits.map((benefit, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-2 text-[10px] text-slate-500">
                            <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                <p className="text-xs text-slate-400 font-medium max-w-md text-center sm:text-left">
                  Para mais detalhes sobre o programa e registrar sua manifestação de interesse, acesse a página completa.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowPartnershipInfo(false)}
                    className="px-8 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                  >
                    Fechar
                  </button>
                  <button 
                    onClick={() => navigate("/ecossistema/parcerias")}
                    className="px-8 py-4 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-blue/20 hover:bg-brand-blue-dark transition-all flex items-center gap-2"
                  >
                    Página Completa
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
