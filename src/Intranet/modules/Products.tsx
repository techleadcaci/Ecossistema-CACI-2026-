import ModuleList from '../components/ModuleList';

const Products = () => {
  const columns = [
    { key: 'name', label: 'Produto', sortable: true },
    { key: 'type', label: 'Tipo', sortable: true },
    { key: 'program', label: 'Programa Vinculado', sortable: true },
    { key: 'status', label: 'Status', render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
        val === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
      }`}>
        {val || 'Ativo'}
      </span>
    )},
  ];

  const formFields: any[] = [
    { key: 'name', label: 'Nome do Produto', type: 'text', required: true },
    { key: 'type', label: 'Tipo de Produto', type: 'select', required: true, options: [
      { label: 'Curso', value: 'Curso' },
      { label: 'Ebook', value: 'Ebook' },
      { label: 'Serviço', value: 'Serviço' },
      { label: 'Evento', value: 'Evento' },
      { label: 'Consultoria', value: 'Consultoria' },
    ]},
    { key: 'program', label: 'Programa Vinculado', type: 'text', required: true },
    { key: 'status', label: 'Status', type: 'select', options: [
      { label: 'Ativo', value: 'Ativo' },
      { label: 'Descontinuado', value: 'Descontinuado' },
    ]},
    { key: 'description', label: 'Descrição', type: 'textarea' },
  ];

  return (
    <ModuleList
      collectionName="products"
      title="Produtos e Serviços"
      description="Gerencie os produtos sociais e serviços vinculados aos programas."
      columns={columns}
      formFields={formFields}
    />
  );
};

export default Products;
