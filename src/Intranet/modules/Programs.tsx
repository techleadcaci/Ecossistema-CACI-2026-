import ModuleList from '../components/ModuleList';

const Programs = () => {
  const columns = [
    { key: 'name', label: 'Programa', sortable: true },
    { key: 'description', label: 'Descrição' },
    { key: 'status', label: 'Status', render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
        val === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
      }`}>
        {val || 'Ativo'}
      </span>
    )},
  ];

  const formFields: any[] = [
    { key: 'name', label: 'Nome do Programa', type: 'text', required: true },
    { key: 'objectives', label: 'Objetivos', type: 'textarea', required: true },
    { key: 'description', label: 'Descrição Detalhada', type: 'textarea' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { label: 'Ativo', value: 'Ativo' },
      { label: 'Planejamento', value: 'Planejamento' },
      { label: 'Suspenso', value: 'Suspenso' },
    ]},
  ];

  return (
    <ModuleList
      collectionName="programs"
      title="Programas Sociais"
      description="Gerencie os programas, seus objetivos e relação com produtos."
      columns={columns}
      formFields={formFields}
    />
  );
};

export default Programs;
