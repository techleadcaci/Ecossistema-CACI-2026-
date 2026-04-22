import React from 'react';
import ModuleList from '../components/ModuleList';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';

const Users = () => {
  const { profile } = useAuth();

  // Only superadmins can manage users
  if (profile && profile.role !== 'superadmin') {
    return <Navigate to="/intranet" replace />;
  }

  const columns = [
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'id_ccgu', label: 'ID-CCGU', sortable: true },
    { key: 'id_cfrh', label: 'ID-CFRH', sortable: true },
    { key: 'email', label: 'E-mail', sortable: true },
    { key: 'cpf', label: 'CPF', sortable: true },
    { key: 'role', label: 'Cargo', sortable: true, render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
        val === 'superadmin' ? 'bg-purple-50 text-purple-600' : 
        val === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
      }`}>
        {val || 'user'}
      </span>
    )},
    { key: 'department', label: 'Departamento', sortable: true },
    { key: 'status', label: 'Status', render: (val: string) => (
      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
        val === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
      }`}>
        {val || 'Ativo'}
      </span>
    )},
  ];

  const formFields: any[] = [
    { key: 'name', label: 'Nome Completo', type: 'text', required: true },
    { key: 'id_ccgu', label: 'ID-CCGU (Pessoa)', type: 'text', required: true },
    { key: 'id_cfrh', label: 'ID-CFRH (Função)', type: 'text', required: true },
    { key: 'email', label: 'E-mail Institucional', type: 'email', required: true },
    { key: 'cpf', label: 'CPF', type: 'text', required: true },
    { key: 'role', label: 'Cargo/Nível de Acesso', type: 'select', required: true, options: [
      { label: 'Usuário Comum', value: 'user' },
      { label: 'Administrador', value: 'admin' },
      { label: 'Super Administrador', value: 'superadmin' },
    ]},
    { key: 'department', label: 'Departamento/Área', type: 'select', options: [
      { label: 'Geral', value: 'Geral' },
      { label: 'Financeiro', value: 'Financeiro' },
      { label: 'Marketing', value: 'Marketing' },
      { label: 'Operacional', value: 'Operacional' },
      { label: 'RH', value: 'RH' },
      { label: 'Tecnologia', value: 'Tecnologia' },
    ]},
    { key: 'status', label: 'Status da Conta', type: 'select', options: [
      { label: 'Ativo', value: 'Ativo' },
      { label: 'Inativo/Bloqueado', value: 'Inativo' },
    ]},
  ];

  return (
    <ModuleList
      collectionName="users"
      title="Gestão de Usuários"
      description="Gerencie permissões, cargos e status de acesso dos colaboradores da plataforma."
      columns={columns}
      formFields={formFields}
    />
  );
};

export default Users;
