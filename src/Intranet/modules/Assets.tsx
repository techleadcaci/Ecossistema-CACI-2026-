import ModuleList from '../components/ModuleList';

const Assets = () => {
  const columns = [
    { key: 'name', label: 'Ativo', sortable: true },
    { key: 'type', label: 'Tipo', sortable: true },
    { key: 'category', label: 'Categoria', sortable: true },
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
    { key: 'name', label: 'Nome do Ativo', type: 'text', required: true },
    { key: 'type', label: 'Tipo de Ativo', type: 'select', required: true, options: [
      { label: 'Documento', value: 'Documento' },
      { label: 'Landing Page', value: 'Landing Page' },
      { label: 'Formulário', value: 'Formulário' },
      { label: 'Conteúdo', value: 'Conteúdo' },
      { label: 'Vídeo', value: 'Vídeo' },
      { label: 'Imagem', value: 'Imagem' },
    ]},
    { key: 'category', label: 'Categoria', type: 'select', required: true, options: [
      { label: 'Interno', value: 'Interno' },
      { label: 'Externo', value: 'Externo' },
    ]},
    { key: 'link', label: 'Link ou Arquivo', type: 'url' },
    { key: 'product', label: 'Produto Vinculado', type: 'text' },
    { key: 'program', label: 'Programa Vinculado', type: 'text' },
    { key: 'responsible', label: 'Responsável', type: 'text', required: true },
    { key: 'status', label: 'Status', type: 'select', options: [
      { label: 'Ativo', value: 'Ativo' },
      { label: 'Inativo', value: 'Inativo' },
      { label: 'Em Revisão', value: 'Em Revisão' },
    ]},
    { key: 'description', label: 'Descrição', type: 'textarea' },
  ];

  return (
    <ModuleList
      collectionName="assets"
      title="Ativos Digitais"
      description="Gerencie ativos digitais internos e externos unificados."
      columns={columns}
      formFields={formFields}
    />
  );
};

export default Assets;
