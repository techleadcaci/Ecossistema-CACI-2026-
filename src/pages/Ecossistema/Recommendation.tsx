import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { useReactToPrint } from "react-to-print";
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2, 
  Lightbulb, 
  Target, 
  Users, 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  Globe, 
  Cpu,
  MessageSquare,
  Heart,
  Settings,
  FileText,
  Printer,
  Scale,
  Database,
  Eye
} from "lucide-react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import DiagnosticReport from "../../components/DiagnosticReport";
import { InstitutionalDiagnostic as DiagnosticType } from "../../types";

const ICON_MAP: Record<string, any> = {
  "Governança": ShieldCheck,
  "Estratégia": Target,
  "Impacto": Heart,
  "Gestão": Settings,
  "Financeiro": BarChart3,
  "Comunicação": MessageSquare,
  "Tecnologia": Cpu,
  "Inovação": Lightbulb,
  "Transparência": Eye,
  "Dados": Database,
  "Escalabilidade": Scale
};

const Recommendation: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { diagnosticId } = useParams();
  const [orgData, setOrgData] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Relatorio_Diagnostico_${state?.orgName || 'CACI'}`,
  });

  useEffect(() => {
    const fetchOrgData = async () => {
      if (state?.detailedResult?.organizationId) {
        try {
          const orgDoc = await getDoc(doc(db, "organizations", state.detailedResult.organizationId));
          if (orgDoc.exists()) {
            setOrgData(orgDoc.data());
          }
        } catch (error) {
          console.error("Erro ao buscar dados da organização:", error);
        }
      }
    };
    fetchOrgData();
  }, [state?.detailedResult?.organizationId]);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Nenhum dado de diagnóstico encontrado.</p>
      </div>
    );
  }

  const { orgName, detailedResult } = state;
  const result = detailedResult as DiagnosticType;

  const chartData = result.dimensionScores.map(d => ({
    subject: d.dimension.split(' ')[0],
    A: d.score,
    fullMark: 10
  }));

  const getCommercialScript = () => {
    const score = result.overallScore;
    if (score < 4) {
      return {
        product: "Consultoria Estratégica",
        script: "Percebi que sua organização ainda está estruturando pontos fundamentais como governança e captação de recursos. O caminho mais rápido agora é um apoio mais próximo. Hoje temos um programa de diagnóstico + acompanhamento estratégico que ajuda a organizar toda a base institucional.",
        question: "Quer que eu te explique como funciona?"
      };
    } else if (score >= 4 && score < 7) {
      return {
        product: "Comunidade CACI",
        script: "Sua organização já tem uma base estruturada, o que é ótimo. Agora o próximo passo é fortalecer gestão, estratégia e sustentabilidade. A Comunidade CACI foi criada exatamente para isso.",
        question: "Quer conhecer como funciona?"
      };
    } else {
      return {
        product: "Mentoria de Escala",
        script: "Sua organização já tem um nível de maturidade bem acima da média. Nesse estágio, o mais interessante é trabalhar crescimento e escala. Temos programas de mentoria e desenvolvimento institucional mais avançados.",
        question: "Faz sentido conversarmos sobre isso?"
      };
    }
  };

  const commercial = getCommercialScript();

  const handleWhatsApp = () => {
    const message = `Olá! Acabei de realizar o diagnóstico da ${orgName}. Meu nível é ${result.maturityLevel} (Score: ${result.overallScore.toFixed(1)}). ${commercial.script} ${commercial.question}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5511999999999?text=${encodedMessage}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-sequential-0 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Navigation */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-500 hover:text-brand-blue transition-colors font-medium"
        >
          <ArrowLeft className="mr-2 w-4 h-4" /> Voltar para o Resultado
        </button>

        {/* Hero Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-xs font-bold uppercase tracking-widest border border-brand-blue/20">
            Jornada de Evolução Institucional
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Plano de Ação: <span className="text-brand-blue">{orgName}</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
            Com base na sua maturidade de nível <strong>{result.maturityLevel}</strong>, preparamos este roteiro estratégico para potencializar seu impacto.
          </p>
        </div>

        {/* Recommendations List */}
        <div className="space-y-12">
          {result.recommendations.map((rec, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="grid md:grid-cols-3 gap-8 items-start"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm relative">
                  {React.createElement(ICON_MAP[rec.dimension] || Zap, { className: "text-brand-blue w-7 h-7" })}
                  <div className={`absolute -top-2 -right-2 w-6 h-6 ${rec.priority === 'alta' ? 'bg-rose-500' : 'bg-amber-500'} text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white`}>
                    !
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{rec.dimension}</h3>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${rec.priority === 'alta' ? 'text-rose-500' : 'text-amber-500'}`}>
                    Prioridade {rec.priority}
                  </span>
                </div>
              </div>
              <div className="md:col-span-2 space-y-6">
                <p className="text-slate-600 leading-relaxed italic text-lg">
                  "{rec.text}"
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-brand-blue uppercase tracking-widest">
                  <Zap size={14} />
                  Impacto Esperado: Alto
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Hidden Report for Printing */}
        <div style={{ display: "none" }}>
          <DiagnosticReport 
            ref={reportRef}
            orgData={orgData}
            diagnosticData={{ ...state, diagnosticId }}
            chartData={chartData}
          />
        </div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 rounded-[40px] p-12 text-center space-y-8 text-white shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-brand-blue/10 blur-3xl rounded-full -ml-32 -mt-32" />
          
          <div className="max-w-xl mx-auto space-y-4 relative z-10">
            <h2 className="text-3xl font-black tracking-tight">{commercial.product}</h2>
            <p className="text-slate-400 italic leading-relaxed">
              "{commercial.script}"
            </p>
            <p className="text-brand-blue font-black text-xl">
              {commercial.question}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button 
              onClick={handleWhatsApp}
              className="px-8 py-4 bg-brand-blue text-white rounded-2xl font-bold hover:bg-brand-blue/90 transition-all flex items-center gap-2 shadow-lg shadow-brand-blue/20"
            >
              Falar com Especialista CACI <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => handlePrint()}
              className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-all border border-white/10 flex items-center gap-2"
            >
              <FileText size={18} /> Relatório Completo
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Recommendation;
