import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import ModuleList from '../components/ModuleList';
import { Star } from 'lucide-react';

const Evaluations = () => {
  const columns = [
    { key: 'timestamp', label: 'Data/Hora', render: (val: any) => val?.toDate().toLocaleString('pt-BR') || '-' },
    { key: 'performance', label: 'Desempenho', render: (val: number) => (
      <div className="flex items-center gap-1">
        <span className="font-bold">{val}</span>
        <Star size={10} className="fill-brand-gold text-brand-gold" />
      </div>
    )},
    { key: 'visual', label: 'Visual', render: (val: number) => (
      <div className="flex items-center gap-1">
        <span className="font-bold">{val}</span>
        <Star size={10} className="fill-brand-gold text-brand-gold" />
      </div>
    )},
    { key: 'navigation', label: 'Navegação', render: (val: number) => (
      <div className="flex items-center gap-1">
        <span className="font-bold">{val}</span>
        <Star size={10} className="fill-brand-gold text-brand-gold" />
      </div>
    )},
    { key: 'access', label: 'Acesso', render: (val: number) => (
      <div className="flex items-center gap-1">
        <span className="font-bold">{val}</span>
        <Star size={10} className="fill-brand-gold text-brand-gold" />
      </div>
    )},
    { key: 'information', label: 'Informação', render: (val: number) => (
      <div className="flex items-center gap-1">
        <span className="font-bold">{val}</span>
        <Star size={10} className="fill-brand-gold text-brand-gold" />
      </div>
    )},
    { key: 'comment', label: 'Comentário', render: (val: string) => (
      <div className="max-w-xs truncate italic text-slate-500" title={val}>
        {val || '-'}
      </div>
    )},
    { key: 'userEmail', label: 'Usuário', sortable: true },
    { key: 'userId', label: 'UID', sortable: true },
  ];

  const formFields: any[] = [
    { key: 'performance', label: 'Desempenho (1-5)', type: 'number', required: true },
    { key: 'visual', label: 'Visual (1-5)', type: 'number', required: true },
    { key: 'navigation', label: 'Navegação (1-5)', type: 'number', required: true },
    { key: 'access', label: 'Acesso (1-5)', type: 'number', required: true },
    { key: 'information', label: 'Informação (1-5)', type: 'number', required: true },
    { key: 'comment', label: 'Comentário', type: 'textarea' },
    { key: 'userEmail', label: 'E-mail do Usuário', type: 'text' },
  ];

  return (
    <ModuleList
      collectionName="platform_evaluations"
      title="Avaliações da Plataforma"
      description="Registros e controle de feedback dos usuários sobre o Ecossistema CACI."
      columns={columns}
      formFields={formFields}
    />
  );
};

export default Evaluations;
