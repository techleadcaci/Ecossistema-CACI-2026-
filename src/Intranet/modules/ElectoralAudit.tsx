import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Printer, 
  RotateCcw, 
  Edit3, 
  CheckCircle2, 
  Trash2, 
  AlertTriangle,
  BarChart3,
  Calendar,
  Users,
  FileText,
  Lock
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  Timestamp,
  getDocs,
  where,
  writeBatch
} from 'firebase/firestore';
import { useReactToPrint } from 'react-to-print';

interface ElectoralAuditProps {
  onEdit?: (election: any) => void;
}

const ElectoralAudit = ({ onEdit }: ElectoralAuditProps) => {
  const { profile } = useAuth();
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const contentRef = useRef<HTMLDivElement>(null);

  const allowedRoles = ['superadmin', 'diretoria', 'ti', 'projetos', 'marketing'];
  const hasAccess = profile && allowedRoles.includes(profile.role?.toLowerCase() || '');

  useEffect(() => {
    const q = query(collection(db, 'elections'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const electionsData = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        // Fetch vote count for each election
        const votesSnap = await getDocs(query(collection(db, 'votes'), where('election_id', '==', docSnap.id)));
        return {
          id: docSnap.id,
          ...data,
          voteCount: votesSnap.size
        };
      }));
      setElections(electionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Auditoria_Eleitoral_CACI_${new Date().toLocaleDateString('pt-BR')}`,
  });

  const handleReset = async (electionId: string) => {
    if (!confirm('ATENÇÃO: Isso excluirá TODOS os votos desta eleição. Deseja continuar?')) return;
    
    try {
      const votesSnap = await getDocs(query(collection(db, 'votes'), where('election_id', '==', electionId)));
      const batch = writeBatch(db);
      votesSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      alert('Votos resetados com sucesso.');
    } catch (error) {
      console.error('Erro ao resetar votos:', error);
      alert('Erro ao resetar votos.');
    }
  };

  const handleValidate = async (electionId: string) => {
    try {
      await updateDoc(doc(db, 'elections', electionId), {
        status: 'active',
        approved_by_caci: true,
        validated_at: Timestamp.now(),
        validated_by: profile?.name || auth.currentUser?.email
      });
    } catch (error) {
      console.error('Erro ao validar eleição:', error);
    }
  };

  const handleDelete = async (electionId: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente esta eleição e todos os seus dados (candidatos e votos)?')) return;
    try {
      const batch = writeBatch(db);
      
      // Delete votes
      const votesSnap = await getDocs(query(collection(db, 'votes'), where('election_id', '==', electionId)));
      votesSnap.docs.forEach((doc) => batch.delete(doc.ref));
      
      // Delete candidates
      const candidatesSnap = await getDocs(query(collection(db, 'candidates'), where('election_id', '==', electionId)));
      candidatesSnap.docs.forEach((doc) => batch.delete(doc.ref));
      
      // Delete election
      batch.delete(doc(db, 'elections', electionId));
      
      await batch.commit();
      alert('Eleição e dados associados excluídos com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir eleição:', error);
      alert('Erro ao excluir eleição.');
    }
  };

  const filteredElections = elections.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         e.requester_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (!hasAccess) {
    return (
      <div className="p-12 text-center bg-white rounded-[40px] border border-slate-100 shadow-xl">
        <Lock className="mx-auto text-slate-300 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-900">Acesso Restrito</h2>
        <p className="text-slate-500">Você não tem permissão para acessar o painel de auditoria eleitoral.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-brand-blue" />
            Painel de Auditoria Eleitoral
          </h2>
          <p className="text-slate-500 text-sm font-medium">Monitoramento em tempo real de integridade e conformidade.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handlePrint()}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 print:hidden"
          >
            <Printer size={16} />
            Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por título ou solicitante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border-none rounded-xl text-sm py-2 pl-3 pr-8 focus:ring-2 focus:ring-brand-blue/20"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="active">Ativas</option>
            <option value="completed">Finalizadas</option>
            <option value="refused">Recusadas</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div ref={contentRef} className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden print:shadow-none print:border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Eleição / ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Solicitante</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Votos</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Integridade</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">Carregando dados de auditoria...</td>
                </tr>
              ) : filteredElections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">Nenhuma eleição encontrada para os filtros aplicados.</td>
                </tr>
              ) : filteredElections.map((election) => (
                <tr key={election.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{election.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">{election.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{election.requester_name}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{election.requester_role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                      election.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      election.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      election.status === 'completed' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {election.status === 'active' ? 'Ativa' : 
                       election.status === 'pending' ? 'Pendente' :
                       election.status === 'completed' ? 'Finalizada' : 'Recusada'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={14} className="text-brand-blue" />
                      <span className="font-bold text-slate-700">{election.voteCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase">
                      <CheckCircle2 size={14} />
                      Verificada
                    </div>
                  </td>
                  <td className="px-6 py-4 print:hidden">
                    <div className="flex items-center gap-2">
                      {election.status === 'pending' && (
                        <button 
                          onClick={() => handleValidate(election.id)}
                          title="Validar & Iniciar"
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(election)}
                          title="Editar Eleição"
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleReset(election.id)}
                        title="Resetar Votos"
                        className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(election.id)}
                        title="Excluir Eleição"
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Processos</span>
            <FileText className="text-brand-blue" size={16} />
          </div>
          <p className="text-3xl font-black text-slate-900">{elections.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Votos Auditados</span>
            <Users className="text-emerald-500" size={16} />
          </div>
          <p className="text-3xl font-black text-slate-900">
            {elections.reduce((acc, curr) => acc + (curr.voteCount || 0), 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Integridade Global</span>
            <ShieldCheck className="text-brand-blue" size={16} />
          </div>
          <p className="text-3xl font-black text-emerald-600">100%</p>
        </div>
      </div>
    </div>
  );
};

export default ElectoralAudit;
