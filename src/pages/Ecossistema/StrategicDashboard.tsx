import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  DollarSign, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart3, 
  PieChart, 
  Calendar, 
  ShieldCheck, 
  ArrowLeft,
  Search,
  Bell,
  User,
  ExternalLink,
  ChevronRight,
  Star,
  Coins,
  CreditCard,
  Briefcase
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";
import { db } from "../../firebase";
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { GlobalStats } from "../../types";

const PERFORMANCE_DATA = [
  { name: "Jan", leads: 12, conversions: 5 },
  { name: "Fev", leads: 18, conversions: 8 },
  { name: "Mar", leads: 25, conversions: 12 },
  { name: "Abr", leads: 20, conversions: 10 },
  { name: "Mai", leads: 32, conversions: 15 },
  { name: "Jun", leads: 45, conversions: 22 },
];

const StrategicDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { orgId: string; orgName: string } | null;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    conversionRate: 0,
    generatedRevenue: 0,
    roi: 4.2
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsSnap, diagsSnap, adesaoSnap] = await Promise.all([
          getDoc(doc(db, 'global_stats', 'current')),
          getDocs(collection(db, 'diagnostics')),
          getDocs(collection(db, 'adesao_ecossistema'))
        ]);

        let totalLeads = adesaoSnap.size;
        let conversionRate = 0;
        let generatedRevenue = 0;

        if (statsSnap.exists()) {
          const globalData = statsSnap.data() as GlobalStats;
          totalLeads = globalData.total_oscs;
          const conversions = diagsSnap.size;
          conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;
          generatedRevenue = conversions * 1500;
        }
        
        setStats({
          totalLeads,
          conversionRate,
          generatedRevenue,
          roi: 4.2
        });
      } catch (error) {
        console.error("Error fetching strategic data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const monetizationStrategies = [
    { 
      title: 'Assinatura Premium OSC', 
      desc: 'Acesso a dashboards avançados, benchmarking detalhado e IA de captação.', 
      icon: CreditCard,
      potential: 'Alto',
      color: 'text-brand-blue'
    },
    { 
      title: 'Taxa de Sucesso em Editais', 
      desc: 'Porcentagem sobre recursos captados através das propostas geradas pelo motor CACI.', 
      icon: Coins,
      potential: 'Escalável',
      color: 'text-brand-emerald'
    },
    { 
      title: 'Marketplace de Especialistas', 
      desc: 'Comissão sobre serviços de consultoria contratados dentro da plataforma.', 
      icon: Briefcase,
      potential: 'Médio',
      color: 'text-brand-purple'
    }
  ];

  if (loading) return <div className="flex items-center justify-center h-screen font-black text-slate-400 animate-pulse text-2xl">Carregando Estratégia...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 p-8 space-y-12 hidden lg:block">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-white font-black text-xl">C</div>
          <div className="font-black text-slate-900 tracking-tighter leading-none">
            ECOSSISTEMA<br/><span className="text-brand-blue">ONG CACI</span>
          </div>
        </div>

        <nav className="space-y-2">
          {[
            { label: 'Visão Geral', icon: BarChart3, active: true },
            { label: 'Leads & Funil', icon: Target },
            { label: 'Receita & ROI', icon: DollarSign },
            { label: 'Configurações', icon: Settings },
          ].map((item, i) => (
            <button 
              key={i}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                item.active ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-12">
          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4">
            <div className="w-10 h-10 bg-brand-gold rounded-xl flex items-center justify-center text-slate-900">
              <Star size={20} />
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/50">Plano Atual</div>
              <div className="text-sm font-black">Enterprise CACI</div>
            </div>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Upgrade
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-12 py-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => navigate('/ecossistema/dashboard')}
              className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-400" />
            </button>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Dashboard Estratégico</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar leads..." 
                className="pl-12 pr-6 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-blue/20 w-64"
              />
            </div>
            <button className="p-2 hover:bg-slate-50 rounded-xl relative">
              <Bell size={20} className="text-slate-400" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
              <User size={20} />
            </div>
          </div>
        </header>

        <div className="p-12 space-y-12">
          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Total de Leads', value: stats.totalLeads, trend: '+12%', trendUp: true, sub: 'vs mês anterior', icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
              { label: 'Taxa de Conversão', value: `${stats.conversionRate.toFixed(1)}%`, trend: '+5%', trendUp: true, sub: 'de eficiência', icon: Target, color: 'text-brand-emerald', bg: 'bg-brand-emerald/10' },
              { label: 'Receita Gerada', value: `R$ ${stats.generatedRevenue.toLocaleString('pt-BR')}`, trend: '-2%', trendUp: false, sub: 'vs meta', icon: DollarSign, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
              { label: 'ROI Campanhas', value: `${stats.roi}x`, trend: 'Alta', trendUp: true, sub: 'performance', icon: Zap, color: 'text-brand-orange', bg: 'bg-brand-orange/10' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    <stat.icon size={24} />
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-black ${stat.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {stat.trend}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
                  <div className="text-[10px] font-medium text-slate-400">{stat.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Performance do Funil</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Leads vs Conversões (Semestre)</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-brand-blue" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-brand-emerald" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversões</span>
                  </div>
                </div>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PERFORMANCE_DATA}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0052FF" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0052FF" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', fontWeight: 900, fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="leads" stroke="#0052FF" strokeWidth={4} fillOpacity={1} fill="url(#colorLeads)" />
                    <Area type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorConversions)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 p-10 rounded-[50px] shadow-2xl text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/20 blur-[60px] rounded-full -mr-16 -mt-16" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black">Metas 2026</h3>
                    <PieChart className="text-brand-gold" size={24} />
                  </div>
                  
                  <div className="space-y-6">
                    {[
                      { label: 'Novas OSCs', current: 45, target: 100, color: 'bg-brand-blue' },
                      { label: 'Receita Anual', current: 65, target: 100, color: 'bg-brand-emerald' },
                      { label: 'Impacto Social', current: 82, target: 100, color: 'bg-brand-gold' },
                    ].map((goal, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-white/50">{goal.label}</span>
                          <span>{goal.current}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${goal.current}%` }}
                            className={`h-full ${goal.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-10">
                  <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all">
                    Ver Relatório Completo
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Monetization & Sustainability */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-3">
              <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Estratégias de Monetização & Sustentabilidade</h3>
              <div className="grid md:grid-cols-3 gap-8">
                {monetizationStrategies.map((strategy, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6 hover:shadow-xl transition-all"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-slate-50 ${strategy.color} flex items-center justify-center`}>
                      <strategy.icon size={28} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-slate-900">{strategy.title}</h4>
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-slate-100 rounded-lg text-slate-400">Potencial: {strategy.potential}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{strategy.desc}</p>
                    </div>
                    <button className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                      Simular Viabilidade
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity / Leads List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[50px] border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-10 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Leads Recentes</h3>
              <button className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline flex items-center gap-2">
                Exportar CSV <ExternalLink size={14} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Organização / Lead</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origem</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs">AB</div>
                        <div>
                          <div className="text-sm font-black text-slate-900 tracking-tight">Associação Beneficente</div>
                          <div className="text-[10px] font-medium text-slate-400 tracking-widest">contato@ab.org.br</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">Apoia Brasil</span>
                    </td>
                    <td className="px-10 py-6 text-xs font-bold text-slate-500">20/03/2026</td>
                    <td className="px-10 py-6">
                      <span className="flex items-center gap-2 text-[9px] font-black text-amber-500 uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        Em Análise
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <button className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-brand-blue transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                  {/* Empty state for demo */}
                  <tr className="bg-slate-50/20">
                    <td colSpan={5} className="px-10 py-12 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aguardando novos leads para o ciclo 2026</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default StrategicDashboard;

const Settings = (props: any) => <BarChart3 {...props} />;
