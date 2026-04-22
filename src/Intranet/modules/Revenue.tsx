import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import ModuleList from '../components/ModuleList';
import { TrendingUp, DollarSign, PieChart, Calendar } from 'lucide-react';

const Revenue = () => {
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    avgTicket: 0,
    count: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'revenue'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => doc.data());
      const now = new Date();
      const thisMonthData = data.filter(i => {
        const d = new Date(i.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      const total = data.reduce((sum, i) => sum + (Number(i.value) || 0), 0);
      const thisMonth = thisMonthData.reduce((sum, i) => sum + (Number(i.value) || 0), 0);
      
      setStats({
        total,
        thisMonth,
        avgTicket: data.length > 0 ? total / data.length : 0,
        count: data.length
      });
    });
    return () => unsubscribe();
  }, []);

  const columns = [
    { key: 'product', label: 'Produto', sortable: true },
    { key: 'value', label: 'Valor', render: (val: number) => `R$ ${val?.toLocaleString('pt-BR') || 0}` },
    { key: 'origin', label: 'Origem', sortable: true },
    { key: 'partner', label: 'Parceiro', sortable: true },
    { key: 'date', label: 'Data', render: (val: string) => val ? new Date(val).toLocaleDateString('pt-BR') : 'N/A' },
  ];

  const formFields: any[] = [
    { key: 'product', label: 'Produto Vendido', type: 'text', required: true },
    { key: 'value', label: 'Valor (R$)', type: 'number', required: true },
    { key: 'origin', label: 'Origem da Receita', type: 'select', required: true, options: [
      { label: 'Venda Direta', value: 'Venda Direta' },
      { label: 'Parceria', value: 'Parceria' },
      { label: 'Doação', value: 'Doação' },
      { label: 'Governo', value: 'Governo' },
    ]},
    { key: 'partner', label: 'Parceiro Vinculado', type: 'text' },
    { key: 'date', label: 'Data da Receita', type: 'date', required: true },
    { key: 'notes', label: 'Observações', type: 'textarea' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Receita Total', value: `R$ ${stats.total.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Este Mês', value: `R$ ${stats.thisMonth.toLocaleString('pt-BR')}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Ticket Médio', value: `R$ ${stats.avgTicket.toLocaleString('pt-BR')}`, icon: PieChart, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Transações', value: stats.count, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
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
        collectionName="revenue"
        title="Gestão de Receita"
        description="Gerencie as entradas financeiras e rastreie a origem de cada centavo."
        columns={columns}
        formFields={formFields}
      />
    </div>
  );
};

export default Revenue;
