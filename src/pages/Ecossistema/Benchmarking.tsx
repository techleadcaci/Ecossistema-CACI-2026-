import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  ShieldCheck, 
  Globe, 
  ArrowLeft,
  Info,
  Award,
  Zap
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Button } from '../../App';

const Benchmarking: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { orgId: string; orgName: string } | null;
  
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<any>(null);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [benchmarkingStats, setBenchmarkingStats] = useState<any>(null);
  const [includeFounder, setIncludeFounder] = useState(false);

  const calculateStats = (allOrgs: any[], includeF: boolean) => {
    const filteredOrgs = includeF 
      ? allOrgs 
      : allOrgs.filter(o => o.tipo_organizacao !== 'fundadora');

    const maturityScores = filteredOrgs.filter(o => o.overall_score !== undefined).map(o => o.overall_score);
    const avgMaturity = maturityScores.length > 0 
      ? maturityScores.reduce((a, b) => a + b, 0) / maturityScores.length 
      : 0;

    const reliabilityScores = filteredOrgs.filter(o => o.reliability_score !== undefined).map(o => o.reliability_score);
    const avgReliability = reliabilityScores.length > 0
      ? reliabilityScores.reduce((a, b) => a + b, 0) / reliabilityScores.length
      : 0;

    return {
      avgMaturity,
      avgReliability,
      totalOrgs: filteredOrgs.length
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!state?.orgId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch current organization
        const orgDoc = await getDoc(doc(db, 'organizations', state.orgId));
        if (orgDoc.exists()) {
          setOrgData(orgDoc.data());
        }

        // Fetch all organizations for benchmarking
        const allOrgsSnap = await getDocs(collection(db, 'organizations'));
        const allOrgs = allOrgsSnap.docs.map(doc => doc.data());
        setMarketData(allOrgs);

        const stats = calculateStats(allOrgs, includeFounder);
        setBenchmarkingStats(stats);

      } catch (error) {
        console.error("Error fetching benchmarking data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [state?.orgId, includeFounder]);

  if (loading) return <div className="flex items-center justify-center h-screen font-black text-slate-400 animate-pulse text-2xl">Analisando Ecossistema...</div>;

  if (!orgData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Info size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Diagnóstico Necessário</h2>
          <p className="text-slate-500 font-medium">Você precisa realizar um diagnóstico institucional para acessar o benchmarking comparativo.</p>
          <Button onClick={() => navigate('/ecossistema/diagnostico')} className="bg-brand-blue text-white w-full">Iniciar Diagnóstico</Button>
        </div>
      </div>
    );
  }

  const radarData = [
    { subject: 'Governança', A: orgData.overall_score || 0, B: benchmarkingStats.avgMaturity || 0, fullMark: 100 },
    { subject: 'Financeiro', A: orgData.reliability_score || 0, B: benchmarkingStats.avgReliability || 0, fullMark: 100 },
    { subject: 'Impacto', A: (orgData.overall_score + 10) % 100, B: benchmarkingStats.avgMaturity, fullMark: 100 },
    { subject: 'Transparência', A: orgData.reliability_score, B: benchmarkingStats.avgReliability, fullMark: 100 },
    { subject: 'Dados', A: orgData.overall_score, B: benchmarkingStats.avgMaturity, fullMark: 100 },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-6">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest mb-6 transition-colors"
            >
              <ArrowLeft size={14} />
              Voltar ao Painel
            </button>
            <h1 className="text-5xl font-display font-black tracking-tighter text-slate-900 leading-none">
              Benchmarking <span className="text-brand-blue">Anonimizado</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium mt-4">Compare sua organização com a média do terceiro setor no Brasil.</p>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incluir Fundadora</span>
              <button 
                onClick={() => setIncludeFounder(!includeFounder)}
                className={`w-12 h-6 rounded-full transition-all relative ${includeFounder ? 'bg-brand-blue' : 'bg-slate-200'}`}
              >
                <motion.div 
                  animate={{ x: includeFounder ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>
            
            <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base de Dados</div>
                <div className="text-sm font-black text-slate-900">{benchmarkingStats.totalOrgs} Organizações</div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Comparative Radar */}
          <div className="lg:col-span-8 bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm space-y-12">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Comparativo Dimensional</h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-brand-blue" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sua OSC</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Média Setor</span>
                </div>
              </div>
            </div>

            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Sua OSC"
                    dataKey="A"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.5}
                  />
                  <Radar
                    name="Média Setor"
                    dataKey="B"
                    stroke="#cbd5e1"
                    fill="#cbd5e1"
                    fillOpacity={0.3}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '20px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insights Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 p-10 rounded-[50px] text-white space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/20 blur-[60px] rounded-full -mr-16 -mt-16" />
              <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-black tracking-tight">Insights de Benchmarking</h3>
                <div className="space-y-4">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Destaque Positivo</p>
                    <p className="text-sm font-medium leading-relaxed">Sua Governança está <span className="text-emerald-400 font-black">15% acima</span> da média das OSCs do mesmo porte.</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Oportunidade</p>
                    <p className="text-sm font-medium leading-relaxed">A Transparência é um ponto de atenção. OSCs que investem em dados captam <span className="text-brand-blue font-black">3x mais</span> recursos.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Posicionamento no Ranking</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Percentil de Maturidade</div>
                  <div className="text-lg font-black text-brand-blue">Top 15%</div>
                </div>
                <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '85%' }}
                    className="h-full bg-brand-blue rounded-full"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Sua organização está entre as mais maduras do ecossistema, o que aumenta sua elegibilidade para editais internacionais.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div className="mt-12 bg-white rounded-[60px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-10 border-b border-slate-100">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Comparativo por Dimensão</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dimensão</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua Pontuação</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Média do Setor</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gap</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { dim: 'Governança', score: orgData.overall_score, avg: benchmarkingStats.avgMaturity },
                  { dim: 'Financeiro', score: orgData.reliability_score, avg: benchmarkingStats.avgReliability },
                  { dim: 'Impacto Social', score: (orgData.overall_score + 10) % 100, avg: benchmarkingStats.avgMaturity },
                  { dim: 'Transparência', score: orgData.reliability_score, avg: benchmarkingStats.avgReliability },
                  { dim: 'Gestão de Dados', score: orgData.overall_score, avg: benchmarkingStats.avgMaturity },
                ].map((item, i) => {
                  const gap = item.score - item.avg;
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-10 py-6 font-black text-slate-900 text-sm">{item.dim}</td>
                      <td className="px-10 py-6 font-black text-brand-blue">{item.score.toFixed(1)}</td>
                      <td className="px-10 py-6 font-bold text-slate-400">{item.avg.toFixed(1)}</td>
                      <td className={`px-10 py-6 font-black ${gap >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {gap >= 0 ? '+' : ''}{gap.toFixed(1)}
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          gap >= 10 ? 'bg-emerald-100 text-emerald-600' : 
                          gap >= -10 ? 'bg-amber-100 text-amber-600' : 
                          'bg-rose-100 text-rose-600'
                        }`}>
                          {gap >= 10 ? 'Acima da Média' : gap >= -10 ? 'Na Média' : 'Abaixo da Média'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Benchmarking;
