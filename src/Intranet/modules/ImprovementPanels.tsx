import React, { useState, useEffect } from 'react';
import { 
  collection, query, onSnapshot, orderBy, limit, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import ModuleList from '../components/ModuleList';
import { formatBRDate } from '../../services/maintenanceService';
import { 
  TrendingUp, CheckCircle2, Clock, AlertCircle, 
  LayoutGrid, List, Target, ArrowRight,
  ShieldCheck, Zap, Users, BarChart3, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ImprovementPanels = () => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    critical: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'improvement_actions'), orderBy('created_at', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, async (snap) => {
      if (snap.empty) {
        const initialActions = [
          {
            title: 'Implementar Governança de Dados',
            category: 'Governança',
            priority: 'Alta',
            status: 'Em Andamento',
            responsible: 'TI / Diretoria',
            deadline: '2026-06-30',
            description: 'Estabelecer políticas de acesso e segurança para os dados do ecossistema CACI.',
            created_at: serverTimestamp()
          },
          {
            title: 'Revisão do Plano Estratégico 2026',
            category: 'Estratégia',
            priority: 'Crítica',
            status: 'Pendente',
            responsible: 'Diretoria Executiva',
            deadline: '2026-04-15',
            description: 'Atualizar os objetivos estratégicos com base nos novos diagnósticos IMI.',
            created_at: serverTimestamp()
          },
          {
            title: 'Campanha Apoia Brasil - Educação Inclusiva',
            category: 'Financeiro',
            priority: 'Média',
            status: 'Concluída',
            responsible: 'Comunicação',
            deadline: '2026-03-20',
            description: 'Lançamento da campanha de crowdfunding para o projeto de educação.',
            created_at: serverTimestamp()
          }
        ];

        for (const action of initialActions) {
          try {
            await addDoc(collection(db, 'improvement_actions'), action);
          } catch (err) {
            console.error('Error seeding improvement action:', err);
          }
        }
        return;
      }

      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setItems(data);
      setStats({
        total: data.length,
        pending: data.filter((i: any) => i.status === 'Pendente').length,
        inProgress: data.filter((i: any) => i.status === 'Em Andamento').length,
        completed: data.filter((i: any) => i.status === 'Concluída').length,
        critical: data.filter((i: any) => i.priority === 'Crítica').length
      });
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const columns = [
    { key: 'title', label: 'Título', sortable: true },
    { 
      key: 'category', 
      label: 'Categoria', 
      sortable: true,
      render: (val: string) => (
        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
          {val}
        </span>
      )
    },
    { 
      key: 'priority', 
      label: 'Prioridade', 
      sortable: true,
      render: (val: string) => {
        const colors: any = {
          'Baixa': 'bg-green-100 text-green-700',
          'Média': 'bg-blue-100 text-blue-700',
          'Alta': 'bg-orange-100 text-orange-700',
          'Crítica': 'bg-red-100 text-red-700'
        };
        return (
          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${colors[val] || 'bg-slate-100 text-slate-600'}`}>
            {val}
          </span>
        );
      }
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (val: string) => {
        const colors: any = {
          'Pendente': 'bg-slate-100 text-slate-600',
          'Em Andamento': 'bg-amber-100 text-amber-700',
          'Concluída': 'bg-emerald-100 text-emerald-700',
          'Cancelada': 'bg-red-100 text-red-700'
        };
        return (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${colors[val]?.split(' ')[0]?.replace('bg-', 'bg-')?.replace('-100', '-500') || 'bg-slate-400'}`} />
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${colors[val] || 'bg-slate-100 text-slate-600'}`}>
              {val}
            </span>
          </div>
        );
      }
    },
    { key: 'responsible', label: 'Responsável' },
    { key: 'deadline', label: 'Prazo', sortable: true }
  ];

  const formFields: any[] = [
    { key: 'title', label: 'Título da Melhoria', type: 'text', required: true },
    { 
      key: 'category', 
      label: 'Categoria (Dimensão IMI)', 
      type: 'select', 
      required: true,
      options: [
        { label: 'Governança e Liderança', value: 'Governança' },
        { label: 'Estratégia e Planejamento', value: 'Estratégia' },
        { label: 'Gestão de Pessoas', value: 'RH' },
        { label: 'Execução e Impacto', value: 'Impacto' },
        { label: 'Sustentabilidade Financeira', value: 'Financeiro' },
        { label: 'Comunicação e Posicionamento', value: 'Comunicação' },
        { label: 'Maturidade Digital', value: 'Digital' }
      ]
    },
    { 
      key: 'priority', 
      label: 'Prioridade', 
      type: 'select', 
      required: true,
      options: [
        { label: 'Baixa', value: 'Baixa' },
        { label: 'Média', value: 'Média' },
        { label: 'Alta', value: 'Alta' },
        { label: 'Crítica', value: 'Crítica' }
      ]
    },
    { 
      key: 'status', 
      label: 'Status', 
      type: 'select', 
      required: true,
      options: [
        { label: 'Pendente', value: 'Pendente' },
        { label: 'Em Andamento', value: 'Em Andamento' },
        { label: 'Concluída', value: 'Concluída' },
        { label: 'Cancelada', value: 'Cancelada' }
      ]
    },
    { key: 'responsible', label: 'Responsável / Departamento', type: 'text' },
    { key: 'deadline', label: 'Prazo para Conclusão', type: 'date' },
    { key: 'description', label: 'Descrição Detalhada', type: 'textarea' }
  ];

  return (
    <div className="space-y-8">
      {/* Strategic Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total de Ações" 
          value={stats.total} 
          icon={<Target className="text-brand-blue" />} 
          color="bg-brand-blue/10" 
        />
        <StatCard 
          title="Em Andamento" 
          value={stats.inProgress} 
          icon={<Clock className="text-amber-600" />} 
          color="bg-amber-50" 
        />
        <StatCard 
          title="Concluídas" 
          value={stats.completed} 
          icon={<CheckCircle2 className="text-emerald-600" />} 
          color="bg-emerald-50" 
        />
        <StatCard 
          title="Críticas" 
          value={stats.critical} 
          icon={<AlertCircle className="text-red-600" />} 
          color="bg-red-50" 
        />
      </div>

      {/* Strategic Context Banner */}
      <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand-blue/20 rounded-xl">
                <TrendingUp className="text-brand-blue" size={24} />
              </div>
              <h2 className="text-xl font-bold">Ciclo de Melhoria Contínua</h2>
            </div>
            <p className="text-slate-400 leading-relaxed">
              As ações listadas aqui são derivadas diretamente dos diagnósticos de maturidade (IMI). 
              Cada melhoria concluída eleva a pontuação institucional da CACI e fortalece o ecossistema.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
              <button 
                onClick={() => setViewMode('cards')}
                className={`p-3 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xl' : 'text-white hover:bg-white/10'}`}
              >
                <LayoutGrid size={20} />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`p-3 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xl' : 'text-white hover:bg-white/10'}`}
              >
                <List size={20} />
              </button>
            </div>
            
            <button 
              onClick={() => setViewMode('table')}
              className="px-6 py-4 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-blue-dark transition-all shadow-xl flex items-center gap-2"
            >
              <Plus size={16} />
              Nova Ação
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
        <AnimatePresence mode="wait">
          {viewMode === 'table' ? (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ModuleList
                collectionName="improvement_actions"
                title="Gestão de Ações"
                description="Acompanhe e gerencie as iniciativas de evolução institucional."
                columns={columns}
                formFields={formFields}
              />
            </motion.div>
          ) : (
            <motion.div
              key="cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Quadro Estratégico</h3>
                <p className="text-sm text-slate-500">Visualize as ações por status e prioridade.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['Pendente', 'Em Andamento', 'Concluída'].map((status) => (
                  <div key={status} className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">{status}</h4>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">
                        {items.filter(i => i.status === status).length}
                      </span>
                    </div>
                    
                    <div className="space-y-4 min-h-[200px]">
                      {items.filter(i => i.status === status).map((item) => (
                        <ActionCard key={item.id} item={item} />
                      ))}
                      {items.filter(i => i.status === status).length === 0 && (
                        <div className="border-2 border-dashed border-slate-100 rounded-3xl p-8 text-center text-slate-300 text-xs italic">
                          Nenhuma ação {status.toLowerCase()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ActionCard = ({ item }: any) => {
  const priorityColors: any = {
    'Baixa': 'bg-green-500',
    'Média': 'bg-blue-500',
    'Alta': 'bg-orange-500',
    'Crítica': 'bg-red-500'
  };

  return (
    <motion.div 
      layout
      whileHover={{ y: -5, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
      className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <span className={`w-2 h-8 rounded-full ${priorityColors[item.priority] || 'bg-slate-300'}`} />
        <div className="flex-1">
          <h5 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-brand-blue transition-colors">{item.title}</h5>
          <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue">
            <Users size={12} />
          </div>
          <span className="text-[10px] font-bold text-slate-500">{item.responsible || 'Sem resp.'}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Clock size={12} />
          <span className="text-[10px] font-bold">{item.deadline ? formatBRDate(item.deadline) : 'S/ prazo'}</span>
        </div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-black text-slate-900">{value}</div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</div>
    </div>
  </motion.div>
);

export default ImprovementPanels;
