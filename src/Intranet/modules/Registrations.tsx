import React from 'react';
import ModuleList from '../components/ModuleList';

const Registrations = () => {
  const columns = [
    { key: 'razaoSocial', label: 'Razão Social', sortable: true },
    { key: 'cnpj', label: 'CNPJ', sortable: true },
    { key: 'email', label: 'E-mail', sortable: true },
    { key: 'classification', label: 'Classificação', render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
        val === 'OSC válida' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
      }`}>
        {val || 'Pendente'}
      </span>
    )},
    { key: 'createdAt', label: 'Data de Cadastro', render: (val: any) => val?.toDate ? val.toDate().toLocaleDateString('pt-BR') : 'Recente' },
  ];

  const formFields: any[] = [
    { key: 'razaoSocial', label: 'Razão Social', type: 'text', required: true },
    { key: 'cnpj', label: 'CNPJ', type: 'text', required: true },
    { key: 'email', label: 'E-mail de Contato', type: 'email', required: true },
    { key: 'classification', label: 'Classificação', type: 'select', options: [
      { label: 'OSC válida', value: 'OSC válida' },
      { label: 'Iniciativa em estruturação', value: 'Iniciativa em estruturação' },
    ]},
    { key: 'priority', label: 'Prioridade', type: 'select', options: [
      { label: 'Alta', value: 'Alta' },
      { label: 'Média', value: 'Média' },
      { label: 'Baixa', value: 'Baixa' },
    ]},
  ];

  return (
    <ModuleList
      collectionName="osc_registrations"
      title="Gestão de Cadastros"
      description="Gerencie as organizações cadastradas no ecossistema CACI."
      columns={columns}
      formFields={formFields}
    />
  );
};

export default Registrations;
