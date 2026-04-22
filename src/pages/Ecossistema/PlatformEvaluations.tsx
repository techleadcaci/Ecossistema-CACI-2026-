import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  Star, 
  MessageSquare, 
  Calendar, 
  Filter,
  Download,
  BarChart3,
  TrendingUp,
  Layout,
  Navigation,
  Smartphone,
  Search as SearchIcon,
  Zap,
  Printer
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { db, auth } from "../../firebase";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

interface Evaluation {
  id: string;
  performance: number;
  visual: number;
  navigation: number;
  access: number;
  information: number;
  comment?: string;
  timestamp: any;
}

const PlatformEvaluations: React.FC = () => {
  const navigate = useNavigate();
  const componentRef = useRef<HTMLDivElement>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [averages, setAverages] = useState({
    performance: 0,
    visual: 0,
    navigation: 0,
    access: 0,
    information: 0,
    overall: 0
  });

  useEffect(() => {
    const q = query(collection(db, "platform_evaluations"), orderBy("timestamp", "desc"), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Evaluation[];
      
      setEvaluations(docs);
      
      if (docs.length > 0) {
        const sums = docs.reduce((acc, curr) => ({
          performance: acc.performance + curr.performance,
          visual: acc.visual + curr.visual,
          navigation: acc.navigation + curr.navigation,
          access: acc.access + curr.access,
          information: acc.information + curr.information,
        }), { performance: 0, visual: 0, navigation: 0, access: 0, information: 0 });

        const count = docs.length;
        const avg = {
          performance: sums.performance / count,
          visual: sums.visual / count,
          navigation: sums.navigation / count,
          access: sums.access / count,
          information: sums.information / count,
          overall: (sums.performance + sums.visual + sums.navigation + sums.access + sums.information) / (count * 5)
        };
        setAverages(avg);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const chartData = [
    { name: 'Desempenho', value: averages.performance, color: '#3B82F6' },
    { name: 'Visual', value: averages.visual, color: '#10B981' },
    { name: 'Navegação', value: averages.navigation, color: '#8B5CF6' },
    { name: 'Acesso', value: averages.access, color: '#F59E0B' },
    { name: 'Informação', value: averages.information, color: '#EC4899' },
  ];

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Relatório de Avaliações - Ecossistema CACI",
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="h-24 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Avaliações do Ecossistema</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={12} /> Feedback Consolidado da Plataforma
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Exportar Relatório removed for public view */}
        </div>
      </header>

      <div ref={componentRef} className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Overview Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center">
                <Star size={24} />
              </div>
              <div className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Média Geral</div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-black text-slate-900 tracking-tighter">
                {averages.overall.toFixed(1)}<span className="text-slate-300 text-2xl">/5.0</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avaliação Consolidada</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Total Avaliações</div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-black text-slate-900 tracking-tighter">
                {evaluations.length}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feedbacks Recebidos</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center">
                <MessageSquare size={24} />
              </div>
              <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Comentários</div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-black text-slate-900 tracking-tighter">
                {evaluations.filter(e => e.comment).length}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sugestões de melhoria</p>
            </div>
          </motion.div>
        </div>

        {/* Charts and Details */}
        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Métricas por Categoria</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análise detalhada de usabilidade</p>
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 5]} hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '20px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}
                  />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={32}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm space-y-8"
          >
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Distribuição</h3>
            <div className="space-y-6">
              {[
                { label: 'Desempenho', value: averages.performance, icon: Zap, color: 'text-blue-500' },
                { label: 'Visual', value: averages.visual, icon: Layout, color: 'text-emerald-500' },
                { label: 'Navegação', value: averages.navigation, icon: Navigation, color: 'text-purple-500' },
                { label: 'Acesso', value: averages.access, icon: Smartphone, color: 'text-amber-500' },
                { label: 'Informação', value: averages.information, icon: SearchIcon, color: 'text-pink-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className={item.color} />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-black text-slate-900">{item.value.toFixed(1)}</span>
                    <Star size={12} className="fill-brand-gold text-brand-gold" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Comments */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[50px] border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-10 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Comentários e Sugestões</h3>
            <div className="flex items-center gap-4">
              <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {evaluations.filter(e => e.comment).map((evalItem, i) => (
              <div key={i} className="p-10 hover:bg-slate-50/50 transition-colors space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, idx) => (
                      <Star 
                        key={idx} 
                        size={14} 
                        className={idx < Math.round((evalItem.performance + evalItem.visual + evalItem.navigation + evalItem.access + evalItem.information) / 5) ? "fill-brand-gold text-brand-gold" : "text-slate-200"} 
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Calendar size={12} />
                    {evalItem.timestamp?.toDate().toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  "{evalItem.comment}"
                </p>
              </div>
            ))}
            {evaluations.filter(e => e.comment).length === 0 && (
              <div className="p-20 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum comentário registrado ainda.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlatformEvaluations;
