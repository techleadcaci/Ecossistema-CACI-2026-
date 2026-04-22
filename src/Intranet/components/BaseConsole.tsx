import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Building2, History, Lock, Search, UserPlus, 
  MoreVertical, AlertTriangle, CheckCircle2, XCircle, BarChart3, 
  Activity, ArrowRight, ShieldAlert, Settings, Download, Filter, 
  MessageSquare, AlertCircle, Terminal, Cpu, LayoutDashboard,
  ClipboardCheck, TrendingUp, RotateCcw, ShieldCheck, Leaf, FileDigit,
  ShieldAlert as AlertCircleIcon, Printer, FileUp, FileText, X, Trash2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  collection, query, onSnapshot, orderBy, limit, 
  addDoc, updateDoc, doc, serverTimestamp, getDocs, 
  where, setDoc, getDoc, deleteDoc
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

interface BaseConsoleProps {
  title: string;
  subtitle: string;
  color: string; // Tailwind color class prefix like 'brand-blue' or 'caci-rh'
  icon: any;
  departmentFilter?: string[]; // List of department names or IDs to filter data
  moduleName: string; // For logging
  customTabs?: {
    users?: string;
    departments?: string;
    audit?: string;
  };
  hierarchyRole?: 'executive' | 'subordinate';
  subordinateModules?: string[];
  executiveModule?: string;
  extraStats?: { label: string, value: number | string, icon: any, statColor: string }[];
}

// --- Safelist for Tailwind (to ensure dynamic classes are generated) ---
// text-caci-exec bg-caci-exec shadow-caci-exec/20 group-hover:bg-caci-exec/10 group-hover:text-caci-exec border-caci-exec
// text-caci-gov bg-caci-gov shadow-caci-gov/20 group-hover:bg-caci-gov/10 group-hover:text-caci-gov border-caci-gov
// text-caci-fin bg-caci-fin shadow-caci-fin/20 group-hover:bg-caci-fin/10 group-hover:text-caci-fin border-caci-fin
// text-caci-rh bg-caci-rh shadow-caci-rh/20 group-hover:bg-caci-rh/10 group-hover:text-caci-rh border-caci-rh
// text-caci-proj bg-caci-proj shadow-caci-proj/20 group-hover:bg-caci-proj/10 group-hover:text-caci-proj border-caci-proj
// text-caci-edu bg-caci-edu shadow-caci-edu/20 group-hover:bg-caci-edu/10 group-hover:text-caci-edu border-caci-edu
// text-caci-ass bg-caci-ass shadow-caci-ass/20 group-hover:bg-caci-ass/10 group-hover:text-caci-ass border-caci-ass
// text-caci-def bg-caci-def shadow-caci-def/20 group-hover:bg-caci-def/10 group-hover:text-caci-def border-caci-def
// text-caci-esg bg-caci-esg shadow-caci-esg/20 group-hover:bg-caci-esg/10 group-hover:text-caci-esg border-caci-esg
// text-caci-mkt bg-caci-mkt shadow-caci-mkt/20 group-hover:bg-caci-mkt/10 group-hover:text-caci-mkt border-caci-mkt
// text-caci-ti bg-caci-ti shadow-caci-ti/20 group-hover:bg-caci-ti/10 group-hover:text-caci-ti border-caci-ti

const BaseConsole: React.FC<BaseConsoleProps> = ({ 
  title, 
  subtitle, 
  color, 
  icon: Icon, 
  departmentFilter,
  moduleName,
  customTabs = {} as NonNullable<BaseConsoleProps['customTabs']>,
  hierarchyRole,
  subordinateModules,
  executiveModule,
  extraStats
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [logs, setLogs] = useState<GovernanceLog[]>([]);
  const [validationRequests, setValidationRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qUsers = query(collection(db, 'users'), orderBy('name', 'asc'));
    const qDepts = query(collection(db, 'departments'), orderBy('name', 'asc'));
    const qLogs = query(collection(db, 'governance_logs'), orderBy('timestamp', 'desc'), limit(50));
    const qValidations = query(collection(db, 'validation_requests'), where('status', '==', 'pendente'), orderBy('timestamp', 'desc'));

    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      let usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
    });

    const unsubDepts = onSnapshot(qDepts, (snapshot) => {
      setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)));
    });

    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GovernanceLog)));
      setLoading(false);
    });

    const unsubValidations = onSnapshot(qValidations, (snapshot) => {
      setValidationRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubUsers();
      unsubDepts();
      unsubLogs();
      unsubValidations();
    };
  }, [departmentFilter]);

  const { profile } = useAuth();
  const FULL_ACCESS_ROLES = ['superadmin', 'diretoria', 'governanca', 'projetos', 'rh', 'ti'];

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: customTabs.users || 'Gestão de Pessoas', icon: Users },
    { id: 'departments', label: customTabs.departments || 'Unidades & Áreas', icon: Building2 },
    { id: 'audit', label: customTabs.audit || 'Auditoria & Controle', icon: ShieldCheck },
    { id: 'collaborative', label: 'Contexto Colaborativo', icon: MessageSquare },
  ];

  if (hierarchyRole === 'executive' || (profile && FULL_ACCESS_ROLES.includes(profile.role))) {
    tabs.push({ id: 'validations', label: 'Validações', icon: ClipboardCheck });
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className={`w-20 h-20 rounded-[32px] bg-white shadow-2xl flex items-center justify-center text-${color} border border-slate-100`}>
            <Icon size={40} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
            <p className="text-slate-500 font-medium italic">{subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-3xl shadow-xl border border-slate-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? `bg-${color} text-white shadow-lg shadow-${color}/20` 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <tab.icon size={16} />
              <span className="hidden lg:inline">{tab.label}</span>
              {tab.id === 'validations' && validationRequests.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-white text-[8px] rounded-full animate-pulse">
                  {validationRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && (
            (hierarchyRole === 'executive' || (profile && FULL_ACCESS_ROLES.includes(profile.role)))
              ? <ExecutiveDashboard users={users} logs={logs} color={color} validationRequests={validationRequests} extraStats={extraStats} />
              : <AdminDashboard users={users} logs={logs} color={color} hierarchyRole={hierarchyRole} extraStats={extraStats} />
          )}
          {activeTab === 'users' && (
            <UserManagement 
              users={users} 
              departments={departments} 
              color={color} 
              moduleName={moduleName} 
              hierarchyRole={hierarchyRole}
              executiveModule={executiveModule}
            />
          )}
          {activeTab === 'departments' && (
            <DepartmentManagement 
              departments={departments} 
              users={users} 
              color={color} 
              moduleName={moduleName} 
              hierarchyRole={hierarchyRole}
              executiveModule={executiveModule}
            />
          )}
          {activeTab === 'audit' && <AuditPanel logs={logs} color={color} />}
          {activeTab === 'collaborative' && <CollaborativeContext logs={logs} color={color} />}
          {activeTab === 'validations' && <ValidationPanel requests={validationRequests} color={color} moduleName={moduleName} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// --- Sub-Components ---

const ValidationPanel = ({ requests, color, moduleName }: { requests: any[], color: string, moduleName: string }) => {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (request: any) => {
    try {
      // 1. Apply the change
      if (request.type === 'user_update') {
        await updateDoc(doc(db, 'users', request.targetId), request.data);
      } else if (request.type === 'user_create') {
        await addDoc(collection(db, 'users'), {
          ...request.data,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      } else if (request.type === 'dept_create') {
        await addDoc(collection(db, 'departments'), {
          ...request.data,
          created_at: serverTimestamp()
        });
      } else if (request.type === 'module_update') {
        await updateDoc(doc(db, request.collection, request.targetId), request.data);
      } else if (request.type === 'module_create') {
        await addDoc(collection(db, request.collection), {
          ...request.data,
          createdAt: serverTimestamp(),
          createdBy: request.requested_by
        });
      } else if (request.type === 'module_delete') {
        await deleteDoc(doc(db, request.collection, request.targetId));
      } else if (request.type === 'test_action') {
        console.log('Ação de teste aprovada:', request.data);
      }

      // 2. Mark request as approved
      await updateDoc(doc(db, 'validation_requests', request.id), {
        status: 'aprovado',
        approved_by: auth.currentUser?.uid,
        approved_by_name: auth.currentUser?.displayName || auth.currentUser?.email,
        approved_at: serverTimestamp()
      });

      // 3. Log
      await addDoc(collection(db, 'governance_logs'), {
        user_id: auth.currentUser?.uid,
        action: `Validação Aprovada: ${request.action}`,
        module: moduleName,
        timestamp: serverTimestamp(),
        before: request.before || null,
        after: request.data
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao aprovar validação.');
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectReason) {
      alert('Por favor, informe o motivo da rejeição.');
      return;
    }

    try {
      await updateDoc(doc(db, 'validation_requests', requestId), {
        status: 'rejeitado',
        rejected_by: auth.currentUser?.uid,
        rejected_by_name: auth.currentUser?.displayName || auth.currentUser?.email,
        rejected_at: serverTimestamp(),
        rejection_reason: rejectReason
      });
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      console.error(err);
      alert('Erro ao rejeitar validação.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Fluxo de Validação Executiva</h3>
        <div className="px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-2">
          <ShieldAlert size={16} className="text-amber-600" />
          <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Autoridade Máxima Ativa</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {requests.map((req) => (
          <div key={req.id} className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-3xl bg-${color}/10 text-${color} flex items-center justify-center shadow-inner`}>
                  <ShieldAlert size={32} />
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900 leading-tight mb-1">{req.action}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest">{req.module}</span>
                    <span>•</span>
                    <span>Solicitado por: <span className="font-bold text-slate-700">{req.requested_by_name}</span></span>
                    <span>•</span>
                    <span>{req.timestamp?.toDate().toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setRejectingId(req.id)}
                  className="px-6 py-3 text-rose-600 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all"
                >
                  Rejeitar
                </button>
                <button 
                  onClick={() => handleApprove(req)}
                  className={`px-8 py-3 bg-${color} text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-${color}/20 hover:scale-105 transition-all active:scale-95`}
                >
                  Aprovar Alteração
                </button>
              </div>
            </div>

            {/* Data Diff View */}
            <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Estado Atual (ou nulo)</div>
                <pre className="text-[10px] font-mono text-slate-600 overflow-x-auto">
                  {JSON.stringify(req.before || 'Nenhum dado anterior', null, 2)}
                </pre>
              </div>
              <div className="p-5 rounded-3xl bg-emerald-50/30 border border-emerald-100">
                <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-3">Nova Proposta</div>
                <pre className="text-[10px] font-mono text-slate-700 overflow-x-auto">
                  {JSON.stringify(req.data, null, 2)}
                </pre>
              </div>
            </div>

            {rejectingId === req.id && (
              <div className="px-8 pb-8 pt-4 border-t border-slate-50 bg-rose-50/30">
                <div className="flex flex-col gap-4">
                  <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Motivo da Rejeição</label>
                  <textarea 
                    className="w-full p-4 rounded-2xl border border-rose-100 bg-white text-sm outline-none focus:ring-2 focus:ring-rose-500/20"
                    placeholder="Explique por que esta alteração foi rejeitada..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setRejectingId(null)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancelar</button>
                    <button onClick={() => handleReject(req.id)} className="px-6 py-2 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Confirmar Rejeição</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {requests.length === 0 && (
          <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-slate-200" />
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2">Tudo em Ordem</h4>
            <p className="text-slate-400 font-medium">Nenhuma solicitação de validação pendente no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ExecutiveDashboard = ({ users, logs, color, validationRequests, extraStats }: { users: User[], logs: GovernanceLog[], color: string, validationRequests: any[], extraStats?: any[] }) => {
  const baseStats = [
    { label: 'Total de Usuários', value: users.length, icon: Users, statColor: 'blue' },
    { label: 'Validações Pendentes', value: validationRequests.length, icon: ClipboardCheck, statColor: 'rose' },
    { label: 'Ações de Governança', value: logs.length, icon: Activity, statColor: 'amber' },
    { label: 'Unidades Ativas', value: 12, icon: Building2, statColor: 'emerald' }, // Mocked for now
  ];

  const stats = extraStats ? [...baseStats, ...extraStats] : baseStats;

  const mainModules = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/intranet', color: 'blue' },
    { icon: TrendingUp, label: 'Painéis de Melhorias', path: '/intranet/melhorias', color: 'emerald' },
    { icon: ClipboardCheck, label: 'Diagnóstico Institucional', path: '/intranet/diagnostico-institucional', color: 'amber' },
    { icon: Leaf, label: 'SIMPLIFICA ESG', path: '/intranet/esg', color: 'green' },
    { icon: ShieldCheck, label: 'Maturidade Digital', path: '/intranet/digital', color: 'indigo' },
    { icon: Users, label: 'Personality I.D.', path: '/intranet/personality', color: 'purple' },
    { icon: FileDigit, label: 'Ponto Eletrônico', path: '/intranet/ponto', color: 'slate' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 flex items-center gap-6 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.statColor}-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-${stat.statColor}-500/10 transition-all`} />
            <div className={`w-16 h-16 rounded-2xl bg-${stat.statColor}-50 text-${stat.statColor}-600 flex items-center justify-center relative z-10`}>
              <stat.icon size={32} />
            </div>
            <div className="relative z-10">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</div>
              <div className="text-3xl font-black text-slate-900">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Módulos Principais Section */}
      <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <LayoutDashboard size={24} className={`text-${color}`} />
            Módulos de Gestão Estratégica
          </h3>
          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">Acesso Rápido</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {mainModules.map((mod) => (
            <Link 
              key={mod.path}
              to={mod.path}
              className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:scale-105 transition-all group"
            >
              <div className={`w-12 h-12 rounded-2xl bg-${mod.color}-50 text-${mod.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <mod.icon size={24} />
              </div>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter text-center leading-tight">{mod.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Activity size={24} className={`text-${color}`} />
              Auditoria de Governança
            </h3>
            <button className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">Ver Tudo</button>
          </div>
          <div className="space-y-4">
            {logs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-lg transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 font-bold border border-slate-100 group-hover:border-${color}/20`}>
                    {log.user_id ? log.user_id.substring(0, 1).toUpperCase() : '?'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{log.action}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{log.module}</div>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  {log.timestamp?.toDate().toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-64 h-64 bg-${color}/20 blur-[100px] -mr-32 -mt-32`} />
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-4 flex items-center gap-3">
                <Shield size={24} className={`text-${color}`} />
                Status de Autoridade
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Este console possui autoridade executiva sobre os módulos de TI & Dados, Recursos Humanos, Projetos & Captação e Adm & Financeiro. Todas as alterações críticas nestes módulos requerem validação humana.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">TI & Dados</div>
                <div className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">RH</div>
                <div className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">Projetos</div>
                <div className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">Financeiro</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 blur-[100px] -mr-32 -mt-32 group-hover:bg-brand-blue/30 transition-all" />
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-4 flex items-center gap-3">
                <TrendingUp size={24} className="text-brand-blue" />
                Visão Estratégica 2026
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Expansão de Impacto</span>
                  <span className="font-bold">75%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-blue w-[75%]" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Maturidade Digital</span>
                  <span className="font-bold">88%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[88%]" />
                </div>
              </div>
              <button className="mt-6 w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                Relatório Estratégico Completo
              </button>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <AlertCircle size={24} className="text-rose-500" />
              Alertas Críticos
            </h3>
            <div className="space-y-4">
              {validationRequests.length > 0 ? (
                <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100 flex items-start gap-4">
                  <AlertTriangle className="text-rose-600 shrink-0" size={24} />
                  <div>
                    <div className="text-sm font-bold text-rose-900">Validações Pendentes</div>
                    <p className="text-xs text-rose-600/80 mb-4">Existem {validationRequests.length} solicitações aguardando sua revisão para serem aplicadas ao sistema.</p>
                    <button className="px-4 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-600/20">Revisar Agora</button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                  <CheckCircle2 className="text-emerald-600" size={24} />
                  <div className="text-sm font-bold text-emerald-900">Sistema em Conformidade</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ users, logs, color, hierarchyRole, extraStats }: { users: User[], logs: GovernanceLog[], color: string, hierarchyRole?: string, extraStats?: any[] }) => {
  const [showTestModal, setShowTestModal] = useState(false);
  const [testAttachment, setTestAttachment] = useState<{ name: string; data: string; type: string } | null>(null);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

  const handleTestFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTestAttachment({
          name: file.name,
          type: file.type,
          data: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrintProtocol = () => {
    window.print();
  };

  const baseStats = [
    { label: 'Total de Usuários', value: users.length, icon: Users, statColor: 'blue' },
    { label: 'Usuários Ativos', value: users.filter(u => u.status === 'ativo').length, icon: CheckCircle2, statColor: 'emerald' },
    { label: 'Usuários Bloqueados', value: users.filter(u => u.status === 'bloqueado').length, icon: XCircle, statColor: 'rose' },
    { label: 'Ações de Governança', value: logs.length, icon: Activity, statColor: 'amber' },
  ];

  const stats = extraStats ? [...baseStats, ...extraStats] : baseStats;

  const recentActivities = logs.slice(0, 5);

  const handleTestValidation = async () => {
    if (!auth.currentUser) {
      alert('Erro: Usuário não autenticado.');
      return;
    }

    setIsSubmittingTest(true);
    try {
      await addDoc(collection(db, 'validation_requests'), {
        type: 'test_action',
        action: `Teste de Fluxo: Ação disparada por ${auth.currentUser.email}`,
        data: { 
          test: true, 
          timestamp: new Date().toISOString(),
          user_email: auth.currentUser.email,
          user_id: auth.currentUser.uid,
          attachment: testAttachment
        },
        module: 'Console Subordinado',
        requested_by: auth.currentUser.uid,
        requested_by_name: auth.currentUser.displayName || auth.currentUser.email,
        status: 'pendente',
        timestamp: serverTimestamp()
      });
      alert('Teste enviado com sucesso! Verifique a aba de Validações no console da Diretoria.');
      setShowTestModal(false);
      setTestAttachment(null);
    } catch (err: any) {
      console.error('Erro ao enviar teste de validação:', err);
      alert(`Erro ao enviar teste: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsSubmittingTest(false);
    }
  };

  return (
    <div className="space-y-8">
      {hierarchyRole === 'subordinate' && (
        <div className="mb-8 p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-[40px] shadow-2xl shadow-amber-500/10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 blur-[100px] -mr-32 -mt-32" />
          <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-inner relative z-10">
            <ShieldAlert size={40} />
          </div>
          <div className="relative z-10 flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-lg shadow-amber-600/20">
              <Lock size={12} />
              Modo de Validação Ativo
            </div>
            <h4 className="text-xl font-black text-amber-900 mb-2 tracking-tight">Console sob Supervisão Executiva</h4>
            <p className="text-sm text-amber-700/80 leading-relaxed max-w-2xl">
              Como este é um console subordinado à Diretoria, qualquer alteração (Novo Registro ou Mudança de Status) não será aplicada imediatamente. 
              Uma solicitação será enviada para a <strong>Diretoria Executiva e Conselhos</strong> para validação humana.
            </p>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTestModal(true);
            }}
            className="shrink-0 px-8 py-4 bg-amber-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-600/30 hover:bg-amber-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 relative z-20"
          >
            <Terminal size={18} />
            Enviar Solicitação de Teste
          </button>
        </div>
      )}

      {/* Test Validation Modal */}
      <AnimatePresence>
        {showTestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTestModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <header className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Solicitação de Teste</h3>
                  <p className="text-sm text-slate-500">Validação de Fluxo Hierárquico</p>
                </div>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowTestModal(false);
                  }}
                  className="p-3 rounded-2xl hover:bg-slate-100 text-slate-500 transition-all"
                >
                  <X size={24} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-10 space-y-8">
                <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 flex items-start gap-4">
                  <Info className="text-amber-600 shrink-0" size={24} />
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Este formulário simula o envio de uma alteração para validação pela Diretoria Executiva. 
                    Você pode anexar um documento de teste para verificar como ele será visualizado pelo aprovador.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest">
                    Inserir Documento (Word/PDF/Imagem)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex items-center justify-center gap-3 px-8 py-6 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all group">
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleTestFileChange}
                        accept=".doc,.docx,.pdf,image/*"
                      />
                      <FileUp className="text-slate-400 group-hover:text-amber-600" size={28} />
                      <span className="text-sm font-bold text-slate-500 group-hover:text-amber-600">
                        {testAttachment ? testAttachment.name : 'Selecionar Documento de Teste'}
                      </span>
                    </label>
                    {testAttachment && (
                      <button 
                        onClick={() => setTestAttachment(null)}
                        className="p-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                      >
                        <Trash2 size={24} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <footer className="p-10 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePrintProtocol();
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-white transition-all border border-slate-200 shadow-sm"
                >
                  <Printer size={18} />
                  IMPRIMIR (protocolo)
                </button>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowTestModal(false);
                    }}
                    className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-white transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTestValidation();
                    }}
                    disabled={isSubmittingTest}
                    className="px-8 py-3 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-amber-600/30 hover:bg-amber-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                  >
                    {isSubmittingTest ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Terminal size={18} />
                        Enviar Solicitação
                      </>
                    )}
                  </button>
                </div>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-${stat.statColor}-50 text-${stat.statColor}-600 flex items-center justify-center`}>
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
            <Activity size={20} className={`text-${color}`} />
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

const UserManagement = ({ users, departments, color, moduleName, hierarchyRole, executiveModule }: { users: User[], departments: Department[], color: string, moduleName: string, hierarchyRole?: string, executiveModule?: string }) => {
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
      const cpfDoc = await getDoc(doc(db, 'cpfs', newUser.cpf));
      if (cpfDoc.exists()) {
        alert('CPF já cadastrado no sistema.');
        return;
      }

      if (hierarchyRole === 'subordinate' && executiveModule) {
        // Create validation request instead of direct add
        await addDoc(collection(db, 'validation_requests'), {
          type: 'user_create',
          action: `Criação de Usuário: ${newUser.name}`,
          data: newUser,
          module: moduleName,
          requested_by: auth.currentUser?.uid,
          requested_by_name: auth.currentUser?.displayName || auth.currentUser?.email,
          status: 'pendente',
          timestamp: serverTimestamp()
        });
        alert('Solicitação de criação enviada para validação da Diretoria.');
      } else {
        const userRef = await addDoc(collection(db, 'users'), {
          ...newUser,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        await setDoc(doc(db, 'cpfs', newUser.cpf), { user_id: userRef.id });
        await addDoc(collection(db, 'governance_logs'), {
          user_id: auth.currentUser?.uid,
          action: 'Criação de Usuário',
          module: moduleName,
          timestamp: serverTimestamp(),
          after: newUser
        });
      }

      setShowAddModal(false);
      setNewUser({
        name: '', email: '', cpf: '', id_ccgu: 'pendente_configuracao', id_cfrh: 'pendente_configuracao',
        user_type: 'interno', role: 'operacional', department_id: '', status: 'pendente'
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao processar usuário.');
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const oldData = userSnap.data();

      if (hierarchyRole === 'subordinate' && executiveModule) {
        await addDoc(collection(db, 'validation_requests'), {
          type: 'user_update',
          targetId: userId,
          action: `Alteração de Status para ${newStatus} (Usuário: ${oldData?.name})`,
          data: { ...oldData, status: newStatus },
          module: moduleName,
          requested_by: auth.currentUser?.uid,
          requested_by_name: auth.currentUser?.displayName || auth.currentUser?.email,
          status: 'pendente',
          timestamp: serverTimestamp()
        });
        alert('Solicitação de alteração enviada para validação da Diretoria.');
      } else {
        await updateDoc(userRef, { 
          status: newStatus,
          updated_at: serverTimestamp()
        });

        await addDoc(collection(db, 'governance_logs'), {
          user_id: auth.currentUser?.uid,
          action: `Alteração de Status para ${newStatus}`,
          module: moduleName,
          timestamp: serverTimestamp(),
          before: oldData,
          after: { ...oldData, status: newStatus }
        });
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status.');
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
          className={`w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95`}
        >
          <UserPlus size={20} />
          Novo Registro
        </button>
      </div>

      <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-bottom border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Usuário</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Identidade</th>
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
            <h3 className="text-xl font-black text-slate-900 mb-6">Novo Registro</h3>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Nome Completo</label>
                  <input required type="text" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">E-mail</label>
                  <input required type="email" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">CPF</label>
                  <input required type="text" maxLength={11} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200" value={newUser.cpf} onChange={e => setNewUser({...newUser, cpf: (e.target.value || '').replace(/\D/g, '')})} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Tipo</label>
                  <select className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200" value={newUser.user_type} onChange={e => setNewUser({...newUser, user_type: e.target.value as any})}>
                    <option value="interno">Interno</option>
                    <option value="externo">Externo</option>
                    <option value="parceiro">Parceiro</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Papel</label>
                  <select className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                    <option value="operacional">Operacional</option>
                    <option value="gestor">Gestor</option>
                    <option value="diretoria">Diretoria</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Departamento</label>
                  <select className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200" value={newUser.department_id} onChange={e => setNewUser({...newUser, department_id: e.target.value})}>
                    <option value="">Selecione...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="col-span-full flex gap-4 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50">Cancelar</button>
                <button type="submit" className={`flex-1 py-4 bg-${color} text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg`}>Confirmar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const DepartmentManagement = ({ departments, users, color, moduleName, hierarchyRole, executiveModule }: { departments: Department[], users: User[], color: string, moduleName: string, hierarchyRole?: string, executiveModule?: string }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', responsible_id: '', description: '' });

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (hierarchyRole === 'subordinate' && executiveModule) {
        await addDoc(collection(db, 'validation_requests'), {
          type: 'dept_create',
          action: `Criação de Unidade: ${newDept.name}`,
          data: newDept,
          module: moduleName,
          requested_by: auth.currentUser?.uid,
          requested_by_name: auth.currentUser?.displayName || auth.currentUser?.email,
          status: 'pendente',
          timestamp: serverTimestamp()
        });
        alert('Solicitação de criação enviada para validação da Diretoria.');
      } else {
        await addDoc(collection(db, 'departments'), { ...newDept, created_at: serverTimestamp(), updated_at: serverTimestamp() });
        await addDoc(collection(db, 'governance_logs'), {
          user_id: auth.currentUser?.uid,
          action: 'Criação de Unidade/Área',
          module: moduleName,
          timestamp: serverTimestamp(),
          after: newDept
        });
      }
      setShowAddModal(false);
      setNewDept({ name: '', responsible_id: '', description: '' });
    } catch (err) {
      console.error(err);
      alert('Erro ao processar unidade.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">Unidades & Áreas</h3>
        <button onClick={() => setShowAddModal(true)} className={`px-6 py-3 bg-${color} text-white rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all`}>
          <Building2 size={18} />
          Nova Unidade
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className={`bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 group hover:border-${color} transition-all`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-${color}/10 group-hover:text-${color} flex items-center justify-center transition-all`}>
                <Building2 size={24} />
              </div>
              <button className="p-2 text-slate-400 hover:text-brand-blue transition-colors"><MoreVertical size={18} /></button>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">{dept.name}</h4>
            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{dept.description || 'Sem descrição.'}</p>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Users size={14} />
              {users.filter(u => u.department_id === dept.id).length} Integrantes
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 mb-6">Nova Unidade</h3>
            <form onSubmit={handleAddDept} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Nome</label>
                <input required type="text" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200" value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Responsável</label>
                <select className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200" value={newDept.responsible_id} onChange={e => setNewDept({...newDept, responsible_id: e.target.value})}>
                  <option value="">Selecione...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Descrição</label>
                <textarea className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 h-24 resize-none" value={newDept.description} onChange={e => setNewDept({...newDept, description: e.target.value})} />
              </div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50">Cancelar</button>
                <button type="submit" className={`flex-1 py-4 bg-${color} text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg`}>Criar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const AuditPanel = ({ logs, color }: { logs: GovernanceLog[], color: string }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">Histórico de Auditoria</h3>
        <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
          <Download size={16} /> Exportar
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs text-slate-600">{log.timestamp?.toDate().toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-900">{log.user_id}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black uppercase tracking-wider text-${color} bg-${color}/10 px-2 py-1 rounded-full`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{log.module}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CollaborativeContext = ({ logs, color }: { logs: GovernanceLog[], color: string }) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}/20 blur-[60px] -mr-16 -mt-16`} />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/10 rounded-2xl"><Cpu className={`text-${color}`} size={24} /></div>
                <div>
                  <h3 className="font-black text-lg">Contexto IA</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestão de memória</p>
                </div>
              </div>
              <button className={`w-full py-4 bg-${color} text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2`}>
                <MessageSquare size={14} /> Iniciar Consulta IA
              </button>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Log de Atividades do Departamento</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-6 max-h-[600px] no-scrollbar">
            {logs.map((log) => (
              <div key={log.id} className="relative pl-8 border-l-2 border-slate-100 pb-6 last:pb-0">
                <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-${color}`} />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">{log.user_id}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.timestamp?.toDate().toLocaleString()}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-sm font-bold text-slate-700 mb-2">{log.action}</p>
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-${color}`}>
                        <Terminal size={12} /> {log.module}
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

export default BaseConsole;
