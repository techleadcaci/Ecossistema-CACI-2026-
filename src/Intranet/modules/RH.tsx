import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Clock, MapPin, Smartphone, History, CheckCircle2, AlertCircle, 
  AlertTriangle, Users, UserPlus, Briefcase, Award, ClipboardCheck, 
  FileText, ShieldCheck, TrendingUp, UserCheck, LogOut, Search,
  Plus, Download, Filter, MoreVertical, ChevronRight, BarChart3,
  Fingerprint, FileSpreadsheet, UserCog, Timer
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { db, auth } from '../../firebase';
import { 
  collection, addDoc, query, where, orderBy, limit, onSnapshot, 
  serverTimestamp, getDocs, doc, updateDoc, getDoc 
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  
  console.error('Erro no Firestore: ', JSON.stringify(errInfo));
  
  let userMessage = "Ocorreu um erro ao processar sua solicitação.";
  if (errInfo.error.includes("insufficient permissions") || errInfo.error.includes("permission-denied")) {
    userMessage = "Permissões ausentes ou insuficientes para realizar esta operação.";
  } else if (errInfo.error.includes("quota exceeded")) {
    userMessage = "Cota do banco de dados excedida. Tente novamente amanhã.";
  }
  
  throw new Error(userMessage);
};

// --- Sub-Components ---

const PontoEletronico = () => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'time_logs'),
      where('user_id', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(logsData);
      setLoading(false);
    }, (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'time_logs');
      } catch (e: any) {
        setMessage(e.message);
        setStatus('error');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleClockAction = async () => {
    if (!auth.currentUser || !selectedAction) return;

    try {
      setStatus('idle');
      await addDoc(collection(db, 'time_logs'), {
        user_id: auth.currentUser.uid,
        type: selectedAction,
        timestamp: serverTimestamp(),
        device_info: navigator.userAgent,
        mfa_verified: true
      });
      
      setStatus('success');
      setMessage(`Ponto de ${(selectedAction || '').replace('_', ' ')} registrado com sucesso!`);
      setSelectedAction(null);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'time_logs');
      } catch (e: any) {
        setStatus('error');
        setMessage(e.message);
      }
    }
  };

  const lastLog = logs[0];
  const canClockIn = !lastLog || lastLog.type === 'saida' || lastLog.type === 'intervalo_fim';
  const canClockOut = lastLog && (lastLog.type === 'entrada' || lastLog.type === 'intervalo_fim');
  const canStartBreak = lastLog && lastLog.type === 'entrada';
  const canEndBreak = lastLog && lastLog.type === 'intervalo_inicio';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {/* Bank of Hours & Session Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
              <Timer size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Banco de Horas</p>
              <p className="text-xl font-black text-slate-900">
                {profile?.bank_of_hours ? `${Math.floor(profile.bank_of_hours / 60)}h ${profile.bank_of_hours % 60}m` : '0h 00m'}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jornada Diária</p>
              <p className="text-xl font-black text-slate-900">
                {profile?.area?.toLowerCase() === 'matriz' ? '6 Horas' : '8 Horas'}
              </p>
              <p className="text-[9px] text-slate-400 italic">
                Descanso: {profile?.area?.toLowerCase() === 'matriz' ? '2 horas' : '1 hora'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100">
          <div className="text-center space-y-4 mb-8">
            <div className="text-5xl font-black text-slate-900 font-mono">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <p className="text-slate-500 font-medium">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedAction('entrada')}
              disabled={!canClockIn}
              className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                selectedAction === 'entrada'
                  ? 'bg-emerald-600 text-white border-2 border-emerald-600'
                  : canClockIn 
                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-2 border-emerald-100' 
                    : 'bg-slate-50 text-slate-300 border-2 border-transparent cursor-not-allowed'
              }`}
            >
              <CheckCircle2 size={32} />
              <span className="font-bold uppercase tracking-wider text-xs">Entrada</span>
            </button>

            <button
              onClick={() => setSelectedAction('saida')}
              disabled={!canClockOut}
              className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                selectedAction === 'saida'
                  ? 'bg-rose-600 text-white border-2 border-rose-600'
                  : canClockOut 
                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-2 border-rose-100' 
                    : 'bg-slate-50 text-slate-300 border-2 border-transparent cursor-not-allowed'
              }`}
            >
              <AlertCircle size={32} />
              <span className="font-bold uppercase tracking-wider text-xs">Saída</span>
            </button>

            <button
              onClick={() => setSelectedAction('intervalo_inicio')}
              disabled={!canStartBreak}
              className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                selectedAction === 'intervalo_inicio'
                  ? 'bg-amber-600 text-white border-2 border-amber-600'
                  : canStartBreak 
                    ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-2 border-amber-100' 
                    : 'bg-slate-50 text-slate-300 border-2 border-transparent cursor-not-allowed'
              }`}
            >
              <Clock size={32} />
              <span className="font-bold uppercase tracking-wider text-xs">Início Intervalo</span>
            </button>

            <button
              onClick={() => setSelectedAction('intervalo_fim')}
              disabled={!canEndBreak}
              className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                selectedAction === 'intervalo_fim'
                  ? 'bg-blue-600 text-white border-2 border-blue-600'
                  : canEndBreak 
                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-2 border-blue-100' 
                    : 'bg-slate-50 text-slate-300 border-2 border-transparent cursor-not-allowed'
              }`}
            >
              <Clock size={32} />
              <span className="font-bold uppercase tracking-wider text-xs">Fim Intervalo</span>
            </button>
          </div>

          <div className="mt-8">
            <button
              onClick={handleClockAction}
              disabled={!selectedAction}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${
                selectedAction
                  ? 'bg-slate-900 text-white shadow-lg hover:bg-slate-800 active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Confirmar Registro
            </button>
          </div>

          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-xl text-center font-bold text-sm ${
                status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {message}
            </motion.div>
          )}
        </div>

        <div className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10 flex items-start gap-4">
          <Smartphone className="text-brand-blue shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-brand-blue text-sm">Segurança 2FA Ativa</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Seu acesso está protegido por autenticação de dois fatores. Cada registro é auditado e vinculado ao seu dispositivo e endereço IP.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100">
        <div className="flex items-center gap-2 mb-6">
          <History size={20} className="text-slate-400" />
          <h3 className="font-bold text-slate-900">Últimos Registros</h3>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Carregando histórico...</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">Nenhum registro encontrado.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-slate-900">
                    {(log.type || '').replace('_', ' ')}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {log.timestamp?.toDate().toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="text-sm font-bold text-slate-700 font-mono">
                  {log.timestamp?.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const BaseInstitucional = ({ onAddClick }: { onAddClick: () => void }) => {
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPerson, setNewPerson] = useState({
    name: '',
    email: '',
    type: 'colaborador',
    link_type: 'interno',
    department: '',
    status: 'ativo',
    entry_date: new Date().toISOString().split('T')[0],
    role: '',
    phone: '',
    id_cfrh: '',
    id_digital: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'rh_people'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPeople(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'rh_people'), {
        ...newPerson,
        created_at: serverTimestamp(),
        history: [{ type: 'entry', date: newPerson.entry_date, note: 'Cadastro inicial' }]
      });
      setShowAddModal(false);
      setNewPerson({
        name: '',
        email: '',
        type: 'colaborador',
        link_type: 'interno',
        department: '',
        status: 'ativo',
        entry_date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar pessoa. Verifique as permissões.');
    }
  };

  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-brand-blue outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={onAddClick}
          className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all font-mono text-[10px] uppercase tracking-widest"
        >
          <UserPlus size={18} />
          Cadastrar Novo Colaborador (Padronizado)
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl"
          >
            <h3 className="text-xl font-black text-slate-900 mb-6">Novo Cadastro Institucional</h3>
            <form onSubmit={handleAddPerson} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Nome Completo</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200"
                  value={newPerson.name}
                  onChange={e => setNewPerson({...newPerson, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">E-mail</label>
                <input 
                  required
                  type="email" 
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200"
                  value={newPerson.email}
                  onChange={e => setNewPerson({...newPerson, email: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Tipo</label>
                  <select 
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200"
                    value={newPerson.type}
                    onChange={e => setNewPerson({...newPerson, type: e.target.value})}
                  >
                    <option value="colaborador">Colaborador</option>
                    <option value="voluntario">Voluntário</option>
                    <option value="estagiario">Estagiário</option>
                    <option value="participante">Participante</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Vínculo</label>
                  <select 
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200"
                    value={newPerson.link_type}
                    onChange={e => setNewPerson({...newPerson, link_type: e.target.value})}
                  >
                    <option value="interno">Interno</option>
                    <option value="externo">Externo</option>
                    <option value="parceiro">Parceiro</option>
                    <option value="voluntario">Voluntário</option>
                  </select>
                </div>
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
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Colaborador / ID-Digital</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">ID-CFRH</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Função / Área</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
               <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Carregando dados...</td></tr>
              ) : filteredPeople.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Nenhuma pessoa encontrada.</td></tr>
              ) : (
                filteredPeople.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-black text-xs">
                          {person.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-xs uppercase">{person.name}</div>
                          <div className="text-[10px] text-indigo-600 font-mono font-bold">{person.id_digital || person.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md w-fit">
                        {person.id_cfrh || 'NÃO DEFINIDO'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] font-black text-slate-700 uppercase">{person.role || 'Colaborador'}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{person.department || 'Geral'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${
                        person.status === 'ativo' ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          person.status === 'ativo' ? 'bg-emerald-600' : 'bg-slate-400'
                        }`} />
                        {person.status}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CicloDeVida = () => {
  const stages = [
    { id: 'recrutamento', label: 'Recrutamento', icon: Search, color: 'blue' },
    { id: 'seleção', label: 'Seleção', icon: UserCheck, color: 'indigo' },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus, color: 'emerald' },
    { id: 'acompanhamento', label: 'Acompanhamento', icon: History, color: 'amber' },
    { id: 'avaliação', label: 'Avaliação', icon: Award, color: 'violet' },
    { id: 'desligamento', label: 'Desligamento', icon: LogOut, color: 'rose' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stages.map((stage) => (
          <div key={stage.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-3 text-center group hover:border-brand-blue transition-all cursor-pointer">
            <div className={`w-12 h-12 rounded-xl bg-${stage.color}-50 text-${stage.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stage.icon size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{stage.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100">
        <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
          <TrendingUp size={20} className="text-brand-blue" />
          Fluxo de Movimentação Recente
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <UserPlus size={20} className="text-emerald-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Novo Onboarding Iniciado</div>
                  <div className="text-xs text-slate-500">Colaborador: João Silva • Depto: Projetos</div>
                </div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Há 2 horas</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AvaliacaoIMI = () => {
  return (
    <div className="space-y-8">
      <div className="bg-slate-900 text-white p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-black mb-2">Índice de Maturidade Institucional (IMI)</h3>
          <p className="text-slate-400 font-medium max-w-md">
            O IMI avalia o nível de excelência e governança de cada colaborador no ecossistema CACI.
          </p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Em desenvolvimento', color: 'bg-amber-500' },
              { label: 'Adequado', color: 'bg-emerald-500' },
              { label: 'Avançado', color: 'bg-blue-500' },
              { label: 'Referência', color: 'bg-violet-500' },
            ].map((tier) => (
              <div key={tier.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{tier.label}</span>
              </div>
            ))}
          </div>
        </div>
        <Award className="absolute -right-8 -bottom-8 text-white/5" size={240} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100">
          <h4 className="font-bold text-slate-900 mb-6">Nova Avaliação</h4>
          <form className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Colaborador</label>
              <select className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-brand-blue">
                <option>Selecione...</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Engajamento (0-10)</label>
                <input type="number" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Governança (0-10)</label>
                <input type="number" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200" />
              </div>
            </div>
            <button className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-blue/20">
              Calcular e Registrar
            </button>
          </form>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100">
          <h4 className="font-bold text-slate-900 mb-6">Histórico de Maturidade</h4>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="font-bold text-slate-900">Ana Oliveira</div>
                  <div className="text-xs text-slate-500">Avaliado em 10/03/2026</div>
                </div>
                <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-[10px] font-black uppercase tracking-wider">
                  Referência
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckupRH = () => {
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'rh_diagnostics'), orderBy('created_at', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setDiagnostic(snapshot.docs[0].data());
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const items = [
    { id: 'formal_contracts', label: 'Contratos de Trabalho Formalizados', status: 'formal' },
    { id: 'onboarding_process', label: 'Processo de Onboarding Estruturado', status: 'parcial' },
    { id: 'performance_eval', label: 'Sistema de Avaliação de Desempenho', status: 'informal' },
    { id: 'training_plan', label: 'Plano de T&D (Treinamento e Desenv.)', status: 'inexistente' },
    { id: 'compliance_lgpd', label: 'Conformidade LGPD em Dados de Pessoas', status: 'formal' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <ClipboardCheck size={20} className="text-brand-blue" />
              Check-up de Processos RH
            </h3>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-sm font-bold text-slate-700">{item.label}</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    item.status === 'formal' ? 'bg-emerald-50 text-emerald-600' :
                    item.status === 'parcial' ? 'bg-blue-50 text-blue-600' :
                    item.status === 'informal' ? 'bg-amber-50 text-amber-600' :
                    'bg-rose-50 text-rose-600'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-xl">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              Riscos Identificados
            </h4>
            <ul className="space-y-3">
              <li className="text-xs text-slate-400 flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                Ausência de plano de sucessão para cargos chave.
              </li>
              <li className="text-xs text-slate-400 flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                Baixa formalização de treinamentos técnicos.
              </li>
            </ul>
          </div>

          <div className="bg-brand-blue p-6 rounded-[32px] shadow-xl text-white">
            <h4 className="font-bold mb-2">Nível de Maturidade RH</h4>
            <div className="text-3xl font-black mb-4">PARCIAL</div>
            <p className="text-xs text-white/70 leading-relaxed">
              Sua organização possui processos básicos, mas carece de integração estratégica e automação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const RelatoriosRH = () => {
  const reports = [
    { id: 'headcount', title: 'Relatório de Headcount e Turnover', icon: Users, date: '21/03/2026' },
    { id: 'imi_evolution', title: 'Evolução do IMI Institucional', icon: TrendingUp, date: '20/03/2026' },
    { id: 'compliance', title: 'Auditoria de Conformidade RH', icon: ShieldCheck, date: '18/03/2026' },
    { id: 'programs', title: 'Impacto de Programas (Voluntariado/Estágio)', icon: Briefcase, date: '15/03/2026' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 group hover:border-brand-blue transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-brand-blue/10 group-hover:text-brand-blue flex items-center justify-center transition-all">
                <report.icon size={24} />
              </div>
              <button className="p-2 text-slate-400 hover:text-brand-blue transition-colors">
                <Download size={20} />
              </button>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">{report.title}</h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Última atualização: {report.date}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100">
        <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
          <History size={20} className="text-slate-400" />
          Log de Auditoria (Governança)
        </h3>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 font-bold">
                  A
                </div>
                <div>
                  <span className="font-bold text-slate-900">Admin</span> alterou status de <span className="font-bold text-slate-900">João Silva</span> para <span className="text-emerald-600 font-bold">Ativo</span>
                </div>
              </div>
              <div className="text-slate-400 font-medium">21/03/2026 14:32</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const IdentidadeDigital = ({ initialSubTab = 'cfrh' }: { initialSubTab?: 'cfrh' | 'ccgu' | 'form' }) => {
  const [subTab, setSubTab] = useState<'cfrh' | 'ccgu' | 'form'>(initialSubTab);
  const [cfrhCodes, setCfrhCodes] = useState<any[]>([]);
  const [ccguCodes, setCcguCodes] = useState<any[]>([]);
  const [identities, setIdentities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    birthDate: '',
    phone: '',
    emailCorporate: '',
    emailPersonal: '',
    department: '',
    project: '',
    role: '',
    startDate: new Date().toISOString().split('T')[0],
    vinculo: 'Interno',
    platform: 'Google Workspace',
    account_type: 'Padrão',
    has_sensitive_data: false,
    has_external_sharing: false,
    has_redundancy: false
  });

  const [generatedIds, setGeneratedIds] = useState({
    id_cfrh: 'AGUARDANDO DADOS...',
    id_digital: 'AGUARDANDO DADOS...'
  });

  useEffect(() => {
    if (formData.fullName && formData.role && formData.department && formData.startDate) {
      const year = formData.startDate.split('-')[0];
      const count = identities.length;
      const serial = (count + 1).toString().padStart(4, '0');
      const areaPrefix = formData.department.substring(0, 3).toUpperCase();
      const type = formData.vinculo.toLowerCase().includes('interno') ? 'PER' : 'TEM';
      const cfrh = `${serial}-${areaPrefix}-${year}-${type}`;

      const firstName = formData.fullName.trim().split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const rolePrefix = formData.role.trim().split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\//g, "-");
      const digital = `${firstName}.${rolePrefix}@caci.ong.br`;

      setGeneratedIds({ id_cfrh: cfrh, id_digital: digital });
    } else {
      setGeneratedIds({ 
        id_cfrh: 'AGUARDANDO DADOS...', 
        id_digital: 'AGUARDANDO DADOS...' 
      });
    }
  }, [formData.fullName, formData.role, formData.department, formData.startDate, formData.vinculo, identities.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generatedIds.id_cfrh.includes('AGUARDANDO') || generatedIds.id_digital.includes('AGUARDANDO')) {
      alert('Por favor, preencha os dados básicos para gerar as identidades.');
      return;
    }

    try {
      const payload = {
        ...formData,
        id_cfrh: generatedIds.id_cfrh,
        id_digital: generatedIds.id_digital,
        is_admin: formData.account_type === 'Admin' || formData.account_type === 'Superadmin',
        timestamp: serverTimestamp()
      };

      // 1. Save Institutional Identity
      await addDoc(collection(db, 'institutional_identities'), payload);

      // 2. Also register in RH People for central governance
      await addDoc(collection(db, 'rh_people'), {
        name: formData.fullName,
        email: formData.emailCorporate || formData.emailPersonal,
        type: 'colaborador',
        link_type: formData.vinculo.toLowerCase(),
        department: formData.department,
        project: formData.project,
        status: 'ativo',
        entry_date: formData.startDate,
        id_cfrh: generatedIds.id_cfrh,
        id_digital: generatedIds.id_digital,
        created_at: serverTimestamp()
      });

      setFormData({
        fullName: '',
        gender: '',
        birthDate: '',
        phone: '',
        emailCorporate: '',
        emailPersonal: '',
        department: '',
        project: '',
        role: '',
        startDate: new Date().toISOString().split('T')[0],
        vinculo: 'Interno',
        platform: 'Google Workspace',
        account_type: 'Padrão',
        has_sensitive_data: false,
        has_external_sharing: false,
        has_redundancy: false
      });
      alert('Cadastro de Colaborador e Identidade Digital registrados com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar:', error);
      alert('Erro ao registrar colaborador.');
    }
  };

  useEffect(() => {
    const unsubCFRH = onSnapshot(query(collection(db, 'cfrh_codes'), orderBy('id_cfrh', 'asc')), (snap) => {
      setCfrhCodes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubCCGU = onSnapshot(query(collection(db, 'ccgu_codes'), orderBy('id_ccgu', 'asc')), (snap) => {
      setCcguCodes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubIdentities = onSnapshot(query(collection(db, 'institutional_identities'), orderBy('timestamp', 'desc')), (snap) => {
      setIdentities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubCFRH();
      unsubCCGU();
      unsubIdentities();
    };
  }, []);

  const generateNextCFRH = () => {
    if (cfrhCodes.length === 0) return '0001';
    const lastCode = cfrhCodes[cfrhCodes.length - 1].id_cfrh.split('-')[0];
    const nextNum = parseInt(lastCode) + 1;
    return nextNum.toString().padStart(4, '0');
  };

  const generateNextCCGU = () => {
    if (ccguCodes.length === 0) return '0001';
    const lastCode = ccguCodes[ccguCodes.length - 1].id_ccgu.split('-')[3];
    const nextNum = parseInt(lastCode) + 1;
    return nextNum.toString().padStart(4, '0');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 p-1 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setSubTab('cfrh')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            subTab === 'cfrh' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Estrutura Funcional (CFRH)
        </button>
        <button 
          onClick={() => setSubTab('ccgu')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            subTab === 'ccgu' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Cadastro Geral (CCGU)
        </button>
        <button 
          onClick={() => setSubTab('form')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            subTab === 'form' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Identidade Institucional
        </button>
      </div>

      {subTab === 'cfrh' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-brand-blue" />
                Controle de Códigos Funcionais RH (ID-CFRH)
              </h3>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Próximo Sequencial: {generateNextCFRH()}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">ID-CFRH</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Área</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Função/Cargo</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Instrumento</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cfrhCodes.map((code) => (
                    <tr key={code.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-brand-blue">{code.id_cfrh}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-700">{code.area}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{code.role}</td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-500">{code.instrument} ({code.instrument_code})</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          code.type === 'P' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {code.type === 'P' ? 'Permanente' : 'Temporário'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          code.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {code.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subTab === 'ccgu' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Fingerprint size={20} className="text-brand-blue" />
                Cadastro Geral Único (ID-CCGU)
              </h3>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Próximo Sequencial: {generateNextCCGU()}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">ID-CCGU</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Nome</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Vínculo</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Primeiro Vínculo</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">CFRH Atual</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ccguCodes.map((code) => (
                    <tr key={code.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600">{code.id_ccgu}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-700">{code.person_name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black uppercase">
                          {code.link_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{code.first_link_date}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{code.id_cfrh}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          code.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {code.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subTab === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <UserCog size={20} className="text-brand-blue" />
              Cadastro Estruturado de Colaborador e Identidade Digital
            </h3>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Seção 1: Dados Pessoais */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-brand-blue flex items-center gap-2">
                  <Users size={14} /> Dados Pessoais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Nome Completo</label>
                    <input 
                      required
                      type="text" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Sexo</label>
                    <select 
                      required
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs"
                    >
                      <option value="">Selecione...</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Data de Nascimento</label>
                    <input 
                      required
                      type="date" 
                      value={formData.birthDate}
                      onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Idade</label>
                    <input 
                      disabled
                      type="text" 
                      value={formData.birthDate ? `${Math.floor((new Date().getTime() - new Date(formData.birthDate).getTime()) / 31557600000)} anos` : '--'}
                      className="w-full p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Telefone (WhatsApp)</label>
                    <input 
                      required
                      type="tel" 
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs" 
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Dados Profissionais */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-brand-blue flex items-center gap-2">
                  <Briefcase size={14} /> Atuação e Vínculo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Área/Departamento</label>
                    <select 
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs"
                    >
                      <option value="">Selecione a Área...</option>
                      <option value="DIRETORIA">DIRETORIA</option>
                      <option value="FINANCEIRO">FINANCEIRO</option>
                      <option value="TI/DADOS">TI/DADOS</option>
                      <option value="PROJETOS">PROJETOS</option>
                      <option value="COMUNICAÇÃO">COMUNICAÇÃO</option>
                      <option value="RECURSOS HUMANOS">RECURSOS HUMANOS</option>
                      <option value="CAPTAÇÃO">CAPTAÇÃO</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Projeto/ Programa</label>
                    <input 
                      required
                      type="text" 
                      value={formData.project}
                      onChange={(e) => setFormData({...formData, project: e.target.value})}
                      placeholder="Ex: Apoia Brasil, Evolution..."
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Cargo/ Função/ Atividade</label>
                    <input 
                      required
                      type="text" 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Data de Início</label>
                    <input 
                      required
                      type="date" 
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Vínculo</label>
                    <select 
                      required
                      value={formData.vinculo}
                      onChange={(e) => setFormData({...formData, vinculo: e.target.value})}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs"
                    >
                      <option>Interno (Permanente)</option>
                      <option>Voluntário</option>
                      <option>Estagiário</option>
                      <option>Prestador de Serviço (PJ)</option>
                      <option>Parceiro Externo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção 3: Identidade Digital (CAMPOS AUTOMÁTICOS) */}
              <div className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-brand-blue flex items-center gap-2">
                  <Fingerprint size={14} /> Identidade Institucional Autogerada
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1 flex items-center justify-between">
                        ID-CFRH <span className="text-[8px] text-emerald-600">SISTEMA AUTOMÁTICO</span>
                      </label>
                      <div className="w-full p-4 rounded-xl bg-white border-2 border-brand-blue/20 text-sm font-black font-mono text-brand-blue shadow-sm">
                        {generatedIds.id_cfrh}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1 italic">Padrão: SERIAL-ÁREA-ANO-TIPO</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1 flex items-center justify-between">
                        ID-Digital <span className="text-[8px] text-emerald-600">SISTEMA AUTOMÁTICO</span>
                      </label>
                      <div className="w-full p-4 rounded-xl bg-white border-2 border-brand-blue/20 text-sm font-black font-mono text-indigo-600 shadow-sm">
                        {generatedIds.id_digital}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1 italic">Padrão: nome.cargo@caci.ong.br</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">E-mail Corporativo</label>
                      <input 
                        required
                        type="email" 
                        placeholder="nome.sobrenome@caci.ong.br"
                        value={formData.emailCorporate}
                        onChange={(e) => setFormData({...formData, emailCorporate: e.target.value})}
                        className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">E-mail Pessoal</label>
                      <input 
                        required
                        type="email" 
                        value={formData.emailPersonal}
                        onChange={(e) => setFormData({...formData, emailPersonal: e.target.value})}
                        className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 4: Configurações de Acesso */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Plataforma Base</label>
                    <select 
                      value={formData.platform}
                      onChange={(e) => setFormData({...formData, platform: e.target.value})}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs"
                    >
                      <option>Google Workspace</option>
                      <option>Microsoft 365</option>
                      <option>AWS / Dev</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Privilégio de Conta</label>
                    <select 
                      value={formData.account_type}
                      onChange={(e) => setFormData({...formData, account_type: e.target.value})}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs"
                    >
                      <option>Padrão</option>
                      <option>Gestor de Área</option>
                      <option>Admin</option>
                      <option>Superadmin</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all">
                    <input 
                      type="checkbox" 
                      checked={formData.has_sensitive_data}
                      onChange={(e) => setFormData({...formData, has_sensitive_data: e.target.checked})}
                      className="w-4 h-4 rounded text-brand-blue border-slate-300 focus:ring-brand-blue" 
                    />
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Dados Sensíveis</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all">
                    <input 
                      type="checkbox" 
                      checked={formData.has_external_sharing}
                      onChange={(e) => setFormData({...formData, has_external_sharing: e.target.checked})}
                      className="w-4 h-4 rounded text-brand-blue border-slate-300 focus:ring-brand-blue" 
                    />
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Compart. Externo</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all">
                    <input 
                      type="checkbox" 
                      checked={formData.has_redundancy}
                      onChange={(e) => setFormData({...formData, has_redundancy: e.target.checked})}
                      className="w-4 h-4 rounded text-brand-blue border-slate-300 focus:ring-brand-blue" 
                    />
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Redundância Ativa</span>
                  </label>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-sm shadow-2xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <UserCheck size={20} />
                Finalizar Cadastro e Ativar Identidade Digital
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const RH = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    volunteers: 0,
    interns: 0,
    turnover: '0%'
  });
  const [deptDistribution, setDeptDistribution] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!auth.currentUser) return;
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role);
      }
    };
    fetchUserRole();

    // Real-time stats
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data());
      const total = users.length;
      const volunteers = users.filter((u: any) => u.user_type === 'voluntario').length;
      const interns = users.filter((u: any) => u.user_type === 'estagiario').length;
      
      setStats({
        total,
        volunteers,
        interns,
        turnover: '1.2%' // Mocked for now as it requires historical data
      });

      // Distribution
      const depts: Record<string, number> = {};
      users.forEach((u: any) => {
        const dept = u.department_id || 'Não Definido';
        depts[dept] = (depts[dept] || 0) + 1;
      });

      const dist = Object.entries(depts).map(([name, count]) => ({
        dept: name,
        count,
        pct: total > 0 ? (count / total) * 100 : 0
      })).sort((a, b) => b.count - a.count);

      setDeptDistribution(dist);
    });

    return () => unsubscribe();
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'base', label: 'Base Institucional', icon: Users },
    { id: 'ciclo', label: 'Ciclo de Vida', icon: TrendingUp },
    { id: 'imi', label: 'Avaliação IMI', icon: Award },
    { id: 'ponto', label: 'Ponto Eletrônico', icon: Clock },
    { id: 'diagnostico', label: 'Check-up RH', icon: ClipboardCheck },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
    { id: 'identidade', label: 'Identidade Digital', icon: Fingerprint },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Headcount', value: stats.total.toString(), icon: Users, color: 'blue' },
                { label: 'Voluntários Ativos', value: stats.volunteers.toString(), icon: UserCheck, color: 'emerald' },
                { label: 'Estagiários', value: stats.interns.toString(), icon: Briefcase, color: 'indigo' },
                { label: 'Turnover Mensal', value: stats.turnover, icon: TrendingUp, color: 'rose' },
              ].map((stat) => (
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
                <h3 className="font-bold text-slate-900 mb-6">Distribuição por Departamento</h3>
                <div className="space-y-4">
                  {deptDistribution.map((item) => (
                    <div key={item.dept} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600 truncate max-w-[200px]">{item.dept}</span>
                        <span className="text-slate-900">{item.count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-blue rounded-full" style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                  {deptDistribution.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-4 italic">Nenhum dado de distribuição disponível.</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-6">Alertas de Governança</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-4">
                    <AlertTriangle className="text-rose-600 shrink-0" size={20} />
                    <div>
                      <div className="text-sm font-bold text-rose-900">3 Onboardings Atrasados</div>
                      <p className="text-xs text-rose-600/80">Processos de integração pendentes há mais de 5 dias.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-4">
                    <AlertCircle className="text-amber-600 shrink-0" size={20} />
                    <div>
                      <div className="text-sm font-bold text-amber-900">Avaliação IMI Pendente</div>
                      <p className="text-xs text-amber-600/80">12 colaboradores aguardam avaliação trimestral.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'base': return <BaseInstitucional onAddClick={() => setActiveTab('identidade')} />;
      case 'ciclo': return <CicloDeVida />;
      case 'imi': return <AvaliacaoIMI />;
      case 'ponto': return <PontoEletronico />;
      case 'diagnostico': return <CheckupRH />;
      case 'relatorios': return <RelatoriosRH />;
      case 'identidade': return <IdentidadeDigital initialSubTab="form" />;
      default: return <BaseInstitucional onAddClick={() => setActiveTab('identidade')} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="heading-md">Governança de Pessoas</h1>
          <p className="text-slate-500 font-medium">Sistema Estratégico de Capital Humano CACI.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-brand-blue/10 text-brand-blue rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={14} />
            {userRole || 'Acesso Restrito'}
          </div>
        </div>
      </div>

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

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

export default RH;
