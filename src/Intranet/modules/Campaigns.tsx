import { useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import ModuleList from '../components/ModuleList';

const Campaigns = () => {
  const { profile, user } = useAuth();

  useEffect(() => {
    const createInitialCampaign = async () => {
      if (!user || !profile) return;
      
      const q = query(
        collection(db, 'apoia_campaigns'), 
        where('title', '==', 'Lançamento Ecossistema CACI 2026+')
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        await addDoc(collection(db, 'apoia_campaigns'), {
          title: 'Lançamento Ecossistema CACI 2026+',
          description: 'Campanha exclusiva de lançamento da plataforma digital ecossistema CACI 2026+',
          status: 'ativa',
          category: 'Crowdfunding',
          goal: 18000,
          raised: 0,
          start_date: '2026-03-23',
          start_time: '12:00',
          end_date: '2026-12-31',
          end_time: '23:59',
          period: 'meses',
          id_ccgu: profile.id_ccgu || 'pendente_configuracao',
          id_cfrh: profile.id_cfrh || 'pendente_configuracao',
          created_at: serverTimestamp(),
          created_by: user.uid
        });
      }
    };

    createInitialCampaign();
  }, [user, profile]);

  const columns = [
    { key: 'title', label: 'Campanha', sortable: true },
    { key: 'status', label: 'Status', render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
        val === 'ativa' ? 'bg-emerald-50 text-emerald-600' : 
        val === 'pausada' ? 'bg-amber-50 text-amber-600' : 
        val === 'concluída' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-600'
      }`}>
        {val}
      </span>
    )},
    { key: 'goal', label: 'Meta', render: (val: number) => `R$ ${val?.toLocaleString('pt-BR') || 0}` },
    { key: 'raised', label: 'Arrecadado', render: (val: number) => `R$ ${val?.toLocaleString('pt-BR') || 0}` },
    { key: 'start_date', label: 'Início', render: (val: string, row: any) => `${val} ${row.start_time || ''}` },
    { key: 'end_date', label: 'Fim', render: (val: string, row: any) => `${val} ${row.end_time || ''}` },
    { key: 'period', label: 'Período', sortable: true },
  ];

  const formFields: any[] = [
    { key: 'title', label: 'Nome da Campanha', type: 'text', required: true },
    { key: 'description', label: 'Descrição/Objetivos', type: 'textarea' },
    { key: 'category', label: 'Categoria', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: [
      { label: 'Planejamento', value: 'planejamento' },
      { label: 'Ativa', value: 'ativa' },
      { label: 'Pausada', value: 'pausada' },
      { label: 'Concluída', value: 'concluída' },
      { label: 'Cancelada', value: 'cancelada' },
    ]},
    { key: 'goal', label: 'Meta (R$)', type: 'number', required: true },
    { key: 'raised', label: 'Arrecadado (R$)', type: 'number' },
    { key: 'start_date', label: 'Data de Início', type: 'date', required: true },
    { key: 'start_time', label: 'Horário de Início', type: 'time' },
    { key: 'end_date', label: 'Data de Fim', type: 'date', required: true },
    { key: 'end_time', label: 'Horário de Fim', type: 'time' },
    { key: 'period', label: 'Período', type: 'select', required: true, options: [
      { label: 'Semanas', value: 'semanas' },
      { label: 'Meses', value: 'meses' },
    ]},
  ];

  return (
    <ModuleList
      collectionName="apoia_campaigns"
      title="Campanhas de Crowdfunding"
      description="Gerencie as campanhas de arrecadação coletiva da CACI."
      columns={columns}
      formFields={formFields}
    />
  );
};

export default Campaigns;
