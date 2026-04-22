import ModuleList from '../components/ModuleList';
import { formatBRDateTime } from '../../services/maintenanceService';

const Audit = () => {
  const columns = [
    { key: 'timestamp', label: 'Data/Hora', sortable: true, render: (val: any) => formatBRDateTime(val) },
    { key: 'id_ccgu', label: 'ID-CCGU', sortable: true },
    { key: 'id_cfrh', label: 'ID-CFRH', sortable: true },
    { key: 'user_id', label: 'UID', sortable: true },
    { key: 'action', label: 'Ação', sortable: true, render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
        (val || '').includes('Criação') ? 'bg-emerald-50 text-emerald-600' : 
        (val || '').includes('Atualização') ? 'bg-blue-50 text-blue-600' : 
        (val || '').includes('Exclusão') ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
      }`}>
        {val || 'Ação desconhecida'}
      </span>
    )},
    { key: 'collection', label: 'Módulo', sortable: true },
    { key: 'details', label: 'Detalhes' },
  ];

  const formFields: any[] = [
    { key: 'action', label: 'Ação Realizada', type: 'text', required: true },
    { key: 'id_ccgu', label: 'ID-CCGU', type: 'text', required: true },
    { key: 'id_cfrh', label: 'ID-CFRH', type: 'text', required: true },
    { key: 'user_id', label: 'UID', type: 'text', required: true },
    { key: 'collection', label: 'Módulo Afetado', type: 'text', required: true },
    { key: 'details', label: 'Detalhes da Alteração', type: 'textarea' },
  ];

  return (
    <ModuleList
      collectionName="audit_logs"
      title="Segurança e Auditoria"
      description="Rastreie todas as alterações e acessos ao sistema para total transparência."
      columns={columns}
      formFields={formFields}
    />
  );
};

export default Audit;
