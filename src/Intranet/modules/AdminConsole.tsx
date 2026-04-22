import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Building2, 
  History, 
  Lock, 
  Search, 
  UserPlus, 
  MoreVertical, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  BarChart3,
  Activity,
  ArrowRight,
  ShieldAlert,
  Settings,
  Download,
  Filter,
  MessageSquare,
  AlertCircle,
  Terminal,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  limit, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  getDocs, 
  where,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../../firebase';

// --- Types ---
interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  id_ccgu?: string;
  id_cfrh?: string;
  role: string;
  status: 'ativo' | 'pendente' | 'bloqueado';
  user_type: 'interno' | 'externo' | 'parceiro';
  department_id?: string;
  created_at: any;
}

interface Department {
  id: string;
  name: string;
  responsible_id?: string;
  description?: string;
}

interface GovernanceLog {
  id: string;
  user_id: string;
  action: string;
  module: string;
  timestamp: any;
  before?: any;
  after?: any;
}

// --- Components ---

const AdminDashboard = ({ users, logs }: { users: User[], logs: GovernanceLog[] }) => {
  const stats = [
    { label: 'Total de Usuários', value: users.length, icon: Users, color: 'blue' },
    { label: 'Usuários Ativos', value: users.filter(u => u.status === 'ativo').length, icon: CheckCircle2, color: 'emerald' },
    { label: 'Usuários Bloqueados', value: users.filter(u => u.status === 'bloqueado').length, icon: XCircle, color: 'rose' },
    { label: 'Ações de Governança', value: logs.length, icon: Activity, color: 'amber' },
  ];

  const recentActivities = logs.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center`}>
              <stat.icon size={28} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</div>
              <div className="text-2xl font-black text-slate-900">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity size={20} className="text-brand-blue" />
            Atividades Recentes
          </h3>
          <div className="space-y-4">
            {recentActivities.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 font-bold">
                    {log.user_id ? log.user_id.substring(0, 1).toUpperCase() : '?'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{log.action}</span> no módulo <span className="font-bold text-slate-900">{log.module}</span>
                  </div>
                </div>
                <div className="text-slate-400 font-medium">
                  {log.timestamp?.toDate().toLocaleString()}
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <div className="text-center py-10 text-slate-400 italic">Nenhuma atividade registrada.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <ShieldAlert size={20} className="text-rose-600" />
            Alertas de Risco
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-4">
              <AlertTriangle className="text-rose-600 shrink-0" size={20} />
              <div>
                <div className="text-sm font-bold text-rose-900">Múltiplas tentativas de login</div>
                <p className="text-xs text-rose-600/80">Detectado padrão suspeito no IP 189.12.45.XX</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-4">
              <Shield size={20} className="text-amber-600 shrink-0" />
              <div>
                <div className="text-sm font-bold text-amber-900">Usuários sem CPF validado</div>
                <p className="text-xs text-amber-600/80">Existem 3 cadastros pendentes de validação documental.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManagement = ({ users, departments }: { users: User[], departments: Department[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    cpf: '',
    id_ccgu: 'pendente_configuracao',
    id_cfrh: 'pendente_configuracao',
    user_type: 'interno' as const,
    role: 'operacional',
    department_id: '',
    status: 'pendente' as const
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Check CPF uniqueness
      const cpfDoc = await getDoc(doc(db, 'cpfs', newUser.cpf));
      if (cpfDoc.exists()) {
        alert('CPF já cadastrado no sistema.');
        return;
      }

      // Create user (this is a simplified version, usually you'd use a cloud function to create Auth user)
      // For this demo, we'll just add to Firestore
      const userRef = await addDoc(collection(db, 'users'), {
        ...newUser,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // Reserve CPF
      await setDoc(doc(db, 'cpfs', newUser.cpf), { user_id: userRef.id });

      // Log action
      await addDoc(collection(db, 'governance_logs'), {
        user_id: auth.currentUser?.uid,
        action: 'Criação de Usuário',
        module: 'Governança',
        timestamp: serverTimestamp(),
        after: newUser
      });

      setShowAddModal(false);
      setNewUser({
        name: '',
        email: '',
        cpf: '',
        id_ccgu: 'pendente_configuracao',
        id_cfrh: 'pendente_configuracao',
        user_type: 'interno',
        role: 'operacional',
        department_id: '',
        status: 'pendente'
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao criar usuário.');
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const oldData = userSnap.data();

      await updateDoc(userRef, { 
        status: newStatus,
        updated_at: serverTimestamp()
      });

      // Log action
      await addDoc(collection(db, 'governance_logs'), {
        user_id: auth.currentUser?.uid,
        action: `Alteração de Status para ${newStatus}`,
        module: 'Governança',
        timestamp: serverTimestamp(),
        before: oldData,
        after: { ...oldData, status: newStatus }
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status do usuário.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.cpf.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou CPF..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-brand-blue outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
        >
          <UserPlus size={18} />
          Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-bottom border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Usuário</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Identidade (CCGU/CFRH)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">CPF</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Papel</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {user.name.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CCGU: {user.id_ccgu || 'Pendente'}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CFRH: {user.id_cfrh || 'Pendente'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                    {user.cpf ? user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : 'Não informado'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {user.user_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      user.status === 'ativo' ? 'bg-emerald-50 text-emerald-600' :
                      user.status === 'pendente' ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(user.id, user.status === 'bloqueado' ? 'ativo' : 'bloqueado')}
                        className={`p-2 rounded-xl transition-colors ${
                          user.status === 'bloqueado' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-rose-600 hover:bg-rose-50'
                        }`}
                        title={user.status === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}
                      >
                        {user.status === 'bloqueado' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      </button>
                      <button className="p-2 text-slate-400 hover:text-brand-blue transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] p-8 w-full max-w-2xl shadow-2xl"
          >
            <h3 className="text-xl font-black text-slate-900 mb-6">Cadastrar Novo Usuário</h3>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200"
                    value={newUser.name}
                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">E-mail</label>
                  <input 
                    required
                    type="email" 
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">CPF (Apenas números)</label>
                  <input 
                    required
                    type="text" 
                    maxLength={11}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200"
                    value={newUser.cpf}
                    onChange={e => setNewUser({...newUser, cpf: (e.target.value || '').replace(/\D/g, '')})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">ID-CCGU</label>
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200"
                      value={newUser.id_ccgu}
                      onChange={e => setNewUser({...newUser, id_ccgu: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">ID-CFRH</label>
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200"
                      value={newUser.id_cfrh}
                      onChange={e => setNewUser({...newUser, id_cfrh: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Tipo de Usuário</label>
                  <select 
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200"
                    value={newUser.user_type}
                    onChange={e => setNewUser({...newUser, user_type: e.target.value as any})}
                  >
                    <option value="interno">Interno</option>
                    <option value="externo">Externo</option>
                    <option value="parceiro">Parceiro</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Papel (Role)</label>
                  <select 
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200"
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="operacional">Usuário Operacional</option>
                    <option value="gestor_projeto">Gestor de Projeto</option>
                    <option value="admin_departamento">Administrador de Departamento</option>
                    <option value="admin_institucional">Administrador Institucional</option>
                    <option value="superadmin">Superadministrador Global</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Departamento</label>
                  <select 
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200"
                    value={newUser.department_id}
                    onChange={e => setNewUser({...newUser, department_id: e.target.value})}
                  >
                    <option value="">Selecione um departamento</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-span-full flex gap-4 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const DepartmentManagement = ({ departments, users }: { departments: Department[], users: User[] }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDept, setNewDept] = useState({
    name: '',
    responsible_id: '',
    description: ''
  });

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'departments'), {
        ...newDept,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // Log action
      await addDoc(collection(db, 'governance_logs'), {
        user_id: auth.currentUser?.uid,
        action: 'Criação de Departamento',
        module: 'Governança',
        timestamp: serverTimestamp(),
        after: newDept
      });

      setShowAddModal(false);
      setNewDept({ name: '', responsible_id: '', description: '' });
    } catch (err) {
      console.error(err);
      alert('Erro ao criar departamento.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">Departamentos</h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-brand-blue text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-brand-blue/90 transition-all"
        >
          <Building2 size={18} />
          Novo Departamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 group hover:border-brand-blue transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-brand-blue/10 group-hover:text-brand-blue flex items-center justify-center transition-all">
                <Building2 size={24} />
              </div>
              <button className="p-2 text-slate-400 hover:text-brand-blue transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">{dept.name}</h4>
            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{dept.description || 'Sem descrição.'}</p>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Users size={14} />
              {users.filter(u => u.department_id === dept.id).length} Usuários
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl"
          >
            <h3 className="text-xl font-black text-slate-900 mb-6">Novo Departamento</h3>
            <form onSubmit={handleAddDept} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Nome do Departamento</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200"
                  value={newDept.name}
                  onChange={e => setNewDept({...newDept, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Responsável</label>
                <select 
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200"
                  value={newDept.responsible_id}
                  onChange={e => setNewDept({...newDept, responsible_id: e.target.value})}
                >
                  <option value="">Selecione um responsável</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Descrição</label>
                <textarea 
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 h-24 resize-none"
                  value={newDept.description}
                  onChange={e => setNewDept({...newDept, description: e.target.value})}
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg"
                >
                  Criar Departamento
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const AuditPanel = ({ logs }: { logs: GovernanceLog[] }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">Logs de Auditoria</h3>
        <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
          <Download size={16} />
          Exportar Logs
        </button>
      </div>

      <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-bottom border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Data/Hora</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Usuário</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ação</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Módulo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs text-slate-600">
                    {log.timestamp?.toDate().toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-900">
                    {log.user_id}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-blue bg-brand-blue/10 px-2 py-1 rounded-full">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {log.module}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-blue transition-colors">
                      Ver JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CollaborativeContext = ({ logs }: { logs: GovernanceLog[] }) => {
  const [activeSubTab, setActiveSubTab] = useState('activities');

  const conflicts = [
    {
      id: 'conf-1',
      title: 'Conflito Potencial Detectado',
      message: 'Alteração em "Parcerias" pode invalidar regra de "Receita". Verifique a integridade dos dados antes de prosseguir.',
      time: 'Atualizado há 5 minutos',
      severity: 'high'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: AI & Alerts */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/20 blur-[60px] -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <Cpu className="text-brand-blue" size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg">Contexto Colaborativo</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestão de memória institucional</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold mb-2">Chat de Governança</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Consulte a IA sobre qualquer decisão institucional ou histórico de alterações.
                  </p>
                  <button className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-blue/90 transition-all shadow-lg flex items-center justify-center gap-2">
                    <MessageSquare size={14} />
                    Iniciar Consulta IA
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <AlertCircle className="text-rose-500" size={20} />
                Alertas de Consistência
              </h3>
              <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Atenção Requerida</span>
            </div>
            
            <div className="space-y-4">
              {conflicts.map(c => (
                <div key={c.id} className="p-5 rounded-3xl bg-rose-50 border border-rose-100 space-y-3">
                  <div className="flex items-center gap-2 text-rose-600">
                    <AlertTriangle size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">{c.title}</span>
                  </div>
                  <p className="text-xs text-rose-900/80 leading-relaxed font-medium">
                    {c.message}
                  </p>
                  <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                    {c.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Activity Log */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div className="flex gap-6">
              {[
                { id: 'activities', label: 'Log de Atividades' },
                { id: 'conflicts', label: 'Conflitos' },
                { id: 'decisions', label: 'Decisões' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`text-sm font-black uppercase tracking-widest transition-all pb-2 border-b-2 ${
                    activeSubTab === tab.id ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Filter size={12} />
              Todos os Módulos
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6 max-h-[600px] no-scrollbar">
            {logs.map((log, i) => (
              <div key={log.id} className="relative pl-8 border-l-2 border-slate-100 pb-6 last:pb-0">
                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-brand-blue" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-900">{log.user_id}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-widest">Confiança: Média</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {log.timestamp?.toDate().toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-sm font-bold text-slate-700 mb-2">{log.action}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-brand-blue">
                        <Terminal size={12} />
                        {log.module}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        log_id: {log.id}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        ID-CCGU: N/A
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminConsole = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [logs, setLogs] = useState<GovernanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    });

    const unsubDepts = onSnapshot(collection(db, 'departments'), (snap) => {
      setDepartments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)));
    });

    const unsubLogs = onSnapshot(
      query(collection(db, 'governance_logs'), orderBy('timestamp', 'desc'), limit(100)),
      (snap) => {
        setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GovernanceLog)));
        setLoading(false);
      }
    );

    return () => {
      unsubUsers();
      unsubDepts();
      unsubLogs();
    };
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Painel', icon: BarChart3 },
    { id: 'context', label: 'Contexto', icon: Cpu },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'departments', label: 'Departamentos', icon: Building2 },
    { id: 'audit', label: 'Auditoria', icon: History },
    { id: 'permissions', label: 'Permissões', icon: Lock },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Carregando Governança...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                <Shield size={24} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Console</h1>
            </div>
            <p className="text-slate-500 font-medium">Governança, Controle de Acesso e Auditoria Institucional</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-100">
              <CheckCircle2 size={16} />
              Sistema Seguro
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && <AdminDashboard users={users} logs={logs} />}
          {activeTab === 'context' && <CollaborativeContext logs={logs} />}
          {activeTab === 'users' && <UserManagement users={users} departments={departments} />}
          {activeTab === 'departments' && <DepartmentManagement departments={departments} users={users} />}
          {activeTab === 'audit' && <AuditPanel logs={logs} />}
          {activeTab === 'permissions' && (
            <div className="bg-white p-12 rounded-[40px] shadow-xl border border-slate-100 text-center">
              <Lock size={48} className="mx-auto text-slate-200 mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Configuração de Permissões</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-8">
                Defina ações permitidas por módulo e papel institucional.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {['RH', 'Projetos', 'Comunicação'].map(module => (
                  <div key={module} className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-4">{module}</h4>
                    <div className="space-y-2">
                      {['Visualizar', 'Criar', 'Editar', 'Excluir', 'Aprovar'].map(action => (
                        <label key={action} className="flex items-center gap-3 cursor-pointer group">
                          <div className="w-5 h-5 rounded border-2 border-slate-300 group-hover:border-brand-blue transition-colors flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-brand-blue opacity-0 group-hover:opacity-20 transition-opacity" />
                          </div>
                          <span className="text-sm text-slate-600">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="bg-white p-12 rounded-[40px] shadow-xl border border-slate-100 text-center">
              <Settings size={48} className="mx-auto text-slate-200 mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Configurações Globais</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Parâmetros de segurança e integração do Admin Console.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminConsole;
