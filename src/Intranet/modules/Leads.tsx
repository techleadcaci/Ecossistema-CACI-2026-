import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import ModuleList from '../components/ModuleList';
import { Users, UserPlus, Target, CheckCircle } from 'lucide-react';

const Leads = () => {
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    converted: 0,
    conversionRate: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'leads'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => doc.data());
      const total = data.length;
      const converted = data.filter(i => i.status === 'Convertido').length;
      
      setStats({
        total,
        new: data.filter(i => i.status === 'Novo' || !i.status).length,
        converted,
        conversionRate: total > 0 ? (converted / total) * 100 : 0
      });
    });
    return () => unsubscribe();
  }, []);

  const columns = [
    { key: 'name', label: 'Nome do Lead', sortable: true },
    { key: 'email', label: 'E-mail', sortable: true },
    { key: 'origin', label: 'Origem', sortable: true },
    { key: 'campaign', label: 'Campanha', sortable: true },
    { key: 'status', label: 'Status', render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
        val === 'Convertido' ? 'bg-emerald-50 text-emerald-600' : 
        val === 'Novo' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
      }`}>
        {val || 'Novo'}
      </span>
    )},
  ];

  const formFields: any[] = [
    { key: 'name', label: 'Nome do Lead', type: 'text', required: true },
    { key: 'email', label: 'E-mail', type: 'email', required: true },
    { key: 'phone', label: 'Telefone', type: 'text' },
    { key: 'origin', label: 'Origem', type: 'select', required: true, options: [
      { label: 'Site', value: 'Site' },
      { label: 'Landing Page', value: 'Landing Page' },
      { label: 'Formulário Externo', value: 'Formulário Externo' },
      { label: 'Indicação', value: 'Indicação' },
      { label: 'Evento', value: 'Evento' },
    ]},
    { key: 'campaign', label: 'Campanha Vinculada', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { label: 'Novo', value: 'Novo' },
      { label: 'Em Atendimento', value: 'Em Atendimento' },
      { label: 'Qualificado', value: 'Qualificado' },
      { label: 'Convertido', value: 'Convertido' },
      { label: 'Perdido', value: 'Perdido' },
    ]},
    { key: 'notes', label: 'Observações', type: 'textarea' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total de Leads', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Novos Leads', value: stats.new, icon: UserPlus, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Convertidos', value: stats.converted, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Taxa de Conv.', value: `${stats.conversionRate.toFixed(1)}%`, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <ModuleList
        collectionName="leads"
        title="Gestão de Leads"
        description="Gerencie os leads captados e acompanhe a jornada de conversão."
        columns={columns}
        formFields={formFields}
      />
    </div>
  );
};

export default Leads;
