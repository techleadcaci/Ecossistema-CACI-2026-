import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { useReactToPrint } from "react-to-print";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from "recharts";
import { 
  ArrowRight, 
  Download, 
  Share2, 
  Trophy, 
  TrendingUp, 
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  FileText,
  Printer,
  ShieldCheck,
  Clock,
  Zap,
  Activity,
  Award,
  BarChart3
} from "lucide-react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import DiagnosticReport from "../../components/DiagnosticReport";
import { InstitutionalDiagnostic as DiagnosticType } from "../../types";

const Result: React.FC = () => {
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
    subject: d.dimension.split(' ')[0], // Short name
    A: d.score,
    fullMark: 10
  }));

  const getSealColor = (seal: string) => {
    switch (seal) {
      case 'Diamante': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Ouro': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Prata': return 'text-slate-500 bg-slate-50 border-slate-200';
      case 'Bronze': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="min-h-screen bg-sequential-0 py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hidden Report for Printing */}
        <div style={{ display: "none" }}>
          <DiagnosticReport 
            ref={reportRef}
            orgData={orgData}
            diagnosticData={{ ...state, diagnosticId }}
            chartData={chartData}
          />
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Inteligência Estratégica: <span className="text-brand-blue">{orgName}</span>
            </h1>
            <p className="text-slate-500 font-medium">Análise de maturidade e potencial de escala • Ecossistema CACI</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/ecossistema/diagnostico', { 
                state: { 
                  ...state, 
                  existingDiagId: diagnosticId,
                } 
              })}
              className="p-3 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
              title="Refazer Diagnóstico"
            >
              <RefreshCw size={20} />
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Refazer</span>
            </button>
            <button 
              onClick={() => handlePrint()}
              className="p-3 bg-brand-blue rounded-xl text-white hover:bg-brand-blue/90 transition-colors shadow-sm flex items-center gap-2"
              title="Gerar Relatório Institucional"
            >
              <FileText size={20} />
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Relatório Completo</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Main Stats & Radar */}
          <div className="lg:col-span-8 space-y-8">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-3"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${getSealColor(result.maturitySeal)}`}>
                  <Award size={32} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selo de Maturidade</div>
                  <div className="text-xl font-black text-slate-900">{result.maturitySeal}</div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck size={32} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Score de Confiabilidade</div>
                  <div className={`text-2xl font-black ${getReliabilityColor(result.reliabilityScore)}`}>{result.reliabilityScore}%</div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                  <BarChart3 size={32} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">IMI Geral</div>
                  <div className="text-2xl font-black text-slate-900">{result.overallScore.toFixed(1)}</div>
                </div>
              </motion.div>
            </div>

            {/* Radar Chart Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Perfil de Maturidade Institucional</h2>
                <div className="px-4 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                  Nível {result.maturityLevel}
                </div>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} />
                    <Radar
                      name="Maturidade"
                      dataKey="A"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    Pontos Fortes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.strengths.map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} />
                    Gaps Críticos
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.weaknesses.map((w, i) => (
                      <span key={i} className="px-3 py-1 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Predictive IA & Actions */}
          <div className="lg:col-span-4 space-y-8">
            {/* Predictive IA Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900 p-8 rounded-[40px] text-white space-y-8 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/20 blur-3xl rounded-full -mr-16 -mt-16" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-brand-blue/20 rounded-xl flex items-center justify-center">
                  <Zap className="text-brand-blue" size={20} />
                </div>
                <h3 className="text-xl font-bold tracking-tight">IA Preditiva CACIia</h3>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Risco de Descontinuidade</span>
                    <span className={`text-xs font-black uppercase tracking-widest ${
                      result.reliabilityRisk === 'baixo' ? 'text-emerald-400' : 
                      result.reliabilityRisk === 'médio' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {result.reliabilityRisk}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        result.reliabilityRisk === 'baixo' ? 'bg-emerald-400' : 
                        result.reliabilityRisk === 'médio' ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                      style={{ width: result.reliabilityRisk === 'baixo' ? '20%' : result.reliabilityRisk === 'médio' ? '50%' : '85%' }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Potencial de Escala</span>
                    <span className="text-xs font-black uppercase tracking-widest text-brand-blue">
                      {result.predictiveAnalysis.scalePotential}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-blue rounded-full"
                      style={{ width: `${result.predictiveAnalysis.scalePotential}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{result.predictiveAnalysis.recommendations[0]}"
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Recommendations List */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="text-brand-blue" size={20} />
                Próximos Passos
              </h3>
              <div className="space-y-4">
                {result.recommendations.slice(0, 3).map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      rec.priority === 'alta' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-snug">{rec.text}</p>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1 block">
                        {rec.dimension}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => navigate(`/ecossistema/recomendacao/${diagnosticId}`, { state })}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-brand-blue transition-all flex items-center justify-center gap-2"
              >
                Ver Jornada Completa
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
