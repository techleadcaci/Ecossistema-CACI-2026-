import ModuleList from '../components/ModuleList';

const Entities = () => {
  const columns = [
    { key: 'name', label: 'Nome da Entidade', sortable: true },
    { key: 'type', label: 'Tipo', sortable: true },
    { key: 'responsible', label: 'Responsável', sortable: true },
    { key: 'status', label: 'Status', render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
        val === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
      }`}>
        {val || 'Ativo'}
      </span>
    )},
  ];

  const formFields: any[] = [
    { key: 'name', label: 'Nome da Entidade', type: 'text', required: true },
    { key: 'type', label: 'Tipo de Entidade', type: 'select', required: true, options: [
      { label: 'Institucional', value: 'Institucional' },
      { label: 'Parceiro', value: 'Parceiro' },
      { label: 'Governo', value: 'Governo' },
      { label: 'Doador', value: 'Doador' },
    ]},
    { key: 'responsible', label: 'Responsável', type: 'text', required: true },
    { key: 'email', label: 'E-mail de Contato', type: 'email' },
    { key: 'phone', label: 'Telefone', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { label: 'Ativo', value: 'Ativo' },
      { label: 'Inativo', value: 'Inativo' },
    ]},
    { key: 'description', label: 'Descrição/Vínculos', type: 'textarea' },
  ];

  return (
    <ModuleList
      collectionName="entities"
      title="Gestão de Identidades"
      description="Gerencie entidades institucionais, responsáveis e vínculos organizacionais."
      columns={columns}
      formFields={formFields}
    />
  );
};

export default Entities;
