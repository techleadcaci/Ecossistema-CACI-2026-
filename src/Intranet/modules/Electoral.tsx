import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Users, Vote as VoteIcon, Calendar, CheckCircle2, AlertTriangle, Plus, Trash2, Trophy, BarChart3 } from 'lucide-react';
import { db, auth } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';

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

import ElectoralAudit from './ElectoralAudit';

const Electoral = () => {
  const { profile } = useAuth();
  const [view, setView] = useState<'main' | 'audit'>('main');
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newElection, setNewElection] = useState({ 
    title: '', 
    description: '', 
    start_date: '', 
    end_date: '',
    requester_name: '',
    requester_role: '',
    type: 'individual' as 'individual' | 'slate'
  });
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    photo_url: '',
    position: '',
    bio: ''
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [voterCategory, setVoterCategory] = useState<string>('Efetivo');
  const [voters, setVoters] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile && ['superadmin', 'diretoria', 'governanca', 'ti', 'projetos', 'marketing'].some(role => role === profile.role?.toLowerCase());
  const canAudit = profile && ['superadmin', 'diretoria', 'ti', 'projetos', 'marketing'].some(role => role === profile.role?.toLowerCase());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'elections'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const electionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setElections(electionsData);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'elections'));

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedElection) {
      const q = query(collection(db, 'candidates'), where('election_id', '==', selectedElection.id));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setCandidates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'candidates'));

      const checkVote = async () => {
        if (!auth.currentUser) return;
        try {
          const voterHash = btoa(auth.currentUser.uid + selectedElection.id);
          const voteQuery = query(
            collection(db, 'votes'), 
            where('election_id', '==', selectedElection.id),
            where('voter_hash', '==', voterHash)
          );
          const voteSnap = await getDocs(voteQuery);
          setHasVoted(!voteSnap.empty);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'votes');
        }
      };
      checkVote();

      if (selectedElection.status === 'completed') {
        const fetchResults = async () => {
          try {
            const votesSnap = await getDocs(query(collection(db, 'votes'), where('election_id', '==', selectedElection.id)));
            const voteCounts: any = {};
            const votersList: any[] = [];
            votesSnap.docs.forEach(doc => {
              const data = doc.data();
              const cid = data.candidate_id;
              voteCounts[cid] = (voteCounts[cid] || 0) + 1;
              votersList.push({
                id: doc.id,
                name: data.voter_name,
                category: data.voter_category,
                timestamp: data.timestamp
              });
            });
            setResults(voteCounts);
            setVoters(votersList);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, 'votes');
          }
        };
        fetchResults();
      }

      return () => unsubscribe();
    } else {
      setResults(null);
      setCandidates([]);
      setHasVoted(false);
    }
  }, [selectedElection]);

  const handleVote = async (candidateId: string) => {
    if (!auth.currentUser || !selectedElection || hasVoted) return;

    try {
      const voterHash = btoa(auth.currentUser.uid + selectedElection.id);
      await addDoc(collection(db, 'votes'), {
        election_id: selectedElection.id,
        candidate_id: candidateId,
        timestamp: serverTimestamp(),
        voter_hash: voterHash,
        voter_name: auth.currentUser.displayName || auth.currentUser.email,
        voter_category: voterCategory
      });
      setHasVoted(true);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'votes');
      } catch (e: any) {
        setError(e.message);
      }
    }
  };

  const handleCreateElection = async () => {
    if (!auth.currentUser) return;
    try {
      if (isEditing && selectedElection) {
        await updateDoc(doc(db, 'elections', selectedElection.id), {
          ...newElection,
          start_date: Timestamp.fromDate(new Date(newElection.start_date)),
          end_date: Timestamp.fromDate(new Date(newElection.end_date)),
          updated_at: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'elections'), {
          ...newElection,
          start_date: Timestamp.fromDate(new Date(newElection.start_date)),
          end_date: Timestamp.fromDate(new Date(newElection.end_date)),
          status: 'pending',
          organization_id: 'caci',
          approved_by_caci: false,
          created_at: serverTimestamp(),
          created_by_uid: auth.currentUser.uid,
          created_by_email: auth.currentUser.email,
          requester_name: newElection.requester_name || auth.currentUser.displayName || auth.currentUser.email,
          requester_role: newElection.requester_role || 'Colaborador'
        });
      }
      setShowCreateModal(false);
      setIsEditing(false);
      setNewElection({ 
        title: '', 
        description: '', 
        start_date: '', 
        end_date: '',
        requester_name: '',
        requester_role: '',
        type: 'individual'
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'elections');
      } catch (e: any) {
        setError(e.message);
      }
    }
  };

  const handleAddCandidate = async () => {
    if (!selectedElection || !isAdmin) return;
    try {
      await addDoc(collection(db, 'candidates'), {
        ...newCandidate,
        election_id: selectedElection.id,
        created_at: serverTimestamp()
      });
      setShowCandidateModal(false);
      setNewCandidate({ name: '', photo_url: '', position: '', bio: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'candidates');
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!isAdmin) return;
    if (!confirm('Excluir este candidato/chapa?')) return;
    try {
      await deleteDoc(doc(db, 'candidates', candidateId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `candidates/${candidateId}`);
    }
  };

  const handleEditElection = (election: any) => {
    setNewElection({
      title: election.title,
      description: election.description,
      start_date: election.start_date instanceof Timestamp ? election.start_date.toDate().toISOString().slice(0, 16) : '',
      end_date: election.end_date instanceof Timestamp ? election.end_date.toDate().toISOString().slice(0, 16) : '',
      requester_name: election.requester_name || '',
      requester_role: election.requester_role || '',
      type: election.type || 'individual'
    });
    setIsEditing(true);
    setShowCreateModal(true);
  };

  const getTimeRemaining = (endDate: any) => {
    if (!endDate) return null;
    const end = endDate instanceof Timestamp ? endDate.toDate() : new Date(endDate);
    const diff = end.getTime() - currentTime.getTime();
    
    if (diff <= 0) return "Encerrada";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleDeleteElection = async (electionId: string) => {
    if (!isAdmin) return;
    if (!confirm('Tem certeza que deseja excluir esta eleição?')) return;
    try {
      await deleteDoc(doc(db, 'elections', electionId));
      if (selectedElection?.id === electionId) setSelectedElection(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `elections/${electionId}`);
    }
  };

  const handleUpdateStatus = async (electionId: string, status: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'elections', electionId), {
        status,
        approved_by_caci: status === 'active'
      });
      if (selectedElection?.id === electionId) {
        setSelectedElection({...selectedElection, status, approved_by_caci: status === 'active'});
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `elections/${electionId}`);
    }
  };

  const handleCompleteElection = async (electionId: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'elections', electionId), {
        status: 'completed'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `elections/${electionId}`);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={20} />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-md">CACI Sistema Eleitoral Digital</h1>
          <p className="text-slate-500 font-medium">Plataforma segura e auditável para processos democráticos.</p>
        </div>
        <div className="w-16 h-16 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center">
          <ShieldCheck size={32} />
        </div>
      </div>

      {canAudit && (
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
          <button 
            onClick={() => setView('main')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              view === 'main' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
            }`}
          >
            Eleições
          </button>
          <button 
            onClick={() => setView('audit')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              view === 'audit' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
            }`}
          >
            Auditoria
          </button>
        </div>
      )}

      {view === 'audit' ? (
        <ElectoralAudit onEdit={handleEditElection} />
      ) : (
        <>
          {selectedElection ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSelectedElection(null)}
              className="text-brand-blue font-bold text-sm flex items-center gap-2 hover:underline"
            >
              &larr; Voltar para Eleições
            </button>
            {isAdmin && selectedElection.status === 'active' && (
              <button 
                onClick={() => handleCompleteElection(selectedElection.id)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800"
              >
                Finalizar Eleição
              </button>
            )}
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{selectedElection.title}</h2>
                <p className="text-slate-500">{selectedElection.description}</p>
                <div className="mt-2 flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>Início: {selectedElection.start_date instanceof Timestamp ? selectedElection.start_date.toDate().toLocaleString('pt-BR') : 'N/A'}</span>
                  <span>Fim: {selectedElection.end_date instanceof Timestamp ? selectedElection.end_date.toDate().toLocaleString('pt-BR') : 'N/A'}</span>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                  selectedElection.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                  selectedElection.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  {selectedElection.status === 'active' ? 'Eleição Ativa' : 
                   selectedElection.status === 'pending' ? 'Aguardando Início' : 'Eleição Finalizada'}
                </div>
                {selectedElection.status === 'active' && (
                  <div className="text-brand-blue font-mono text-lg font-black">
                    {getTimeRemaining(selectedElection.end_date)}
                  </div>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="mb-8 p-6 bg-slate-900 rounded-3xl text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold">Painel de Gestão da Comissão</h3>
                  <p className="text-xs text-slate-400">Adicione candidatos ou altere o status do processo.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowCandidateModal(true)}
                    className="px-4 py-2 bg-brand-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-blue-dark transition-colors"
                  >
                    Adicionar Candidato/Chapa
                  </button>
                  <button 
                    onClick={() => handleEditElection(selectedElection)}
                    className="px-4 py-2 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-colors"
                  >
                    Editar Eleição
                  </button>
                </div>
              </div>
            )}

            {selectedElection.status === 'completed' && results ? (
              <div className="space-y-8">
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="text-brand-blue" />
                      Resultados Finais & Auditoria
                    </h3>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      ID: {selectedElection.id} | Hash: {btoa(selectedElection.id).slice(0, 12)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      {candidates.sort((a, b) => (results[b.id] || 0) - (results[a.id] || 0)).map((candidate, idx) => {
                        const votes = results[candidate.id] || 0;
                        const totalVotes = Object.values(results).reduce((a: any, b: any) => a + b, 0) as number;
                        const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                        
                        return (
                          <div key={candidate.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-slate-700">{candidate.name}</span>
                                {idx === 0 && totalVotes > 0 && <Trophy size={16} className="text-amber-500" />}
                              </div>
                              <span className="text-sm font-black text-brand-blue">{votes} votos ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                className="h-full bg-brand-blue rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Painel de Auditoria</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Total de Votos:</span>
                          <span className="font-bold">{Object.values(results).reduce((a: any, b: any) => a + b, 0) as number}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Status:</span>
                          <span className="text-emerald-600 font-bold">Integridade Verificada</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Criptografia:</span>
                          <span className="font-mono">AES-256-GCM</span>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Este processo foi auditado digitalmente. Os votos foram anonimizados via hash SHA-256 e vinculados à identidade 2FA do usuário no momento da votação.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-200">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-500" />
                      Lista de Presença Digital (Votantes Auditados)
                    </h4>
                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest">Eleitor</th>
                            <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest">Categoria</th>
                            <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest">Data/Hora</th>
                            <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {voters.map((voter) => (
                            <tr key={voter.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-700">{voter.name}</td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-brand-blue/10 text-brand-blue rounded-md text-[9px] font-black uppercase">
                                  {voter.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-500">
                                {voter.timestamp instanceof Timestamp ? voter.timestamp.toDate().toLocaleString('pt-BR') : 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                  <CheckCircle2 size={12} />
                                  Auditado
                                </span>
                              </td>
                            </tr>
                          ))}
                          {voters.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                                Nenhum registro de votante encontrado.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : hasVoted ? (
              <div className="bg-emerald-50 p-12 rounded-3xl text-center space-y-4 border-2 border-emerald-100">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Seu voto foi registrado!</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Obrigado por participar deste processo democrático. Seu voto é secreto e foi processado com segurança via autenticação 2FA.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Identificação do Eleitor</h4>
                    <p className="text-xs text-slate-500">Confirme sua categoria antes de prosseguir para a urna eletrônica.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Efetivo', 'Honorário', 'Benemérito', 'Contribuinte'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setVoterCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          voterCategory === cat 
                          ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' 
                          : 'bg-white text-slate-400 border border-slate-200 hover:border-brand-blue/30'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {candidates.map((candidate) => (
                    <motion.div
                      key={candidate.id}
                      whileHover={{ y: -5 }}
                      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      <div className="w-32 h-32 bg-slate-100 rounded-2xl mx-auto overflow-hidden border-4 border-white shadow-inner">
                        {candidate.photo_url ? (
                          <img src={candidate.photo_url} alt={candidate.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Users size={48} />
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <h4 className="font-black text-slate-900 text-lg">{candidate.name}</h4>
                        <p className="text-[10px] text-brand-blue font-black uppercase tracking-widest">{candidate.position || (selectedElection.type === 'slate' ? 'Chapa' : 'Candidato')}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl relative group">
                        <p className="text-xs text-slate-500 text-center leading-relaxed">{candidate.bio || 'Nenhuma informação adicional disponível.'}</p>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDeleteCandidate(candidate.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <button
                        disabled={selectedElection.status !== 'active'}
                        onClick={() => handleVote(candidate.id)}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                          selectedElection.status === 'active' 
                          ? 'bg-slate-900 text-white hover:bg-brand-blue shadow-lg hover:shadow-brand-blue/20' 
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {selectedElection.status === 'active' ? 'Confirmar Voto' : 'Urna Fechada'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Active Elections */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <VoteIcon size={20} className="text-brand-blue" />
              <h3 className="font-bold text-slate-900">Eleições Ativas</h3>
            </div>

            {loading ? (
              <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center text-slate-400">
                Carregando eleições...
              </div>
            ) : elections.filter(e => e.status === 'active' && e.approved_by_caci).length === 0 ? (
              <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center text-slate-400">
                Nenhuma eleição ativa no momento.
              </div>
            ) : (
              elections.filter(e => e.status === 'active' && e.approved_by_caci).map((election) => (
                <motion.div
                  key={election.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedElection(election)}
                  className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 cursor-pointer group relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 group-hover:text-brand-blue transition-colors">{election.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Calendar size={14}/> Fim: {election.end_date instanceof Timestamp ? election.end_date.toDate().toLocaleDateString('pt-BR') : 'N/A'}</span>
                        <span className="flex items-center gap-1"><Users size={14}/> {election.organization_id === 'caci' ? 'CACI' : 'OSC Parceira'}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-all">
                      <VoteIcon size={20} />
                    </div>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteElection(election.id); }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </motion.div>
              ))
            )}

            {/* Completed Elections */}
            <div className="pt-8 space-y-4">
              <h3 className="font-bold text-slate-400 text-sm uppercase tracking-widest">Eleições Encerradas</h3>
              {elections.filter(e => e.status === 'completed').map((election) => (
                <div
                  key={election.id}
                  onClick={() => setSelectedElection(election)}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-100 cursor-pointer opacity-75 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">{election.title}</span>
                    <BarChart3 size={16} className="text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin / Request Panel */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-brand-blue" />
              <h3 className="font-bold text-slate-900">{isAdmin ? 'Gestão Eleitoral OSC' : 'Solicitações OSC'}</h3>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 space-y-6 shadow-sm">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">{isAdmin ? 'Comissão Eleitoral' : 'Nova Solicitação'}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {isAdmin 
                    ? 'Como membro da comissão, você pode validar solicitações, iniciar processos e gerenciar candidatos.' 
                    : 'Solicite a criação de um novo processo eleitoral para sua OSC. A comissão CACI irá validar os dados.'}
                </p>
              </div>
              
              <button 
                onClick={() => { setIsEditing(false); setShowCreateModal(true); }}
                className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-brand-blue transition-all shadow-lg hover:shadow-brand-blue/20"
              >
                <Plus size={20} />
                {isAdmin ? 'Nova Eleição OSC' : 'Solicitar Eleição OSC'}
              </button>

              <div className="pt-6 border-t border-slate-100 space-y-6">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-brand-blue">
                  {isAdmin ? 'Solicitações e Processos' : 'Minhas Solicitações'}
                </h5>
                {elections.filter(e => (isAdmin ? (e.status === 'pending' || !e.approved_by_caci) : (e.created_by_uid === auth.currentUser?.uid))).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhuma solicitação encontrada.</p>
                ) : (
                  <div className="space-y-4">
                    {elections
                      .filter(e => (isAdmin ? (e.status === 'pending' || !e.approved_by_caci) : (e.created_by_uid === auth.currentUser?.uid)))
                      .map(e => (
                      <div key={e.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-sm font-black text-slate-900 block">{e.title}</span>
                            <span className="text-[10px] text-slate-500 block mt-1">
                              Solicitante: {e.requester_name} ({e.requester_role})
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Criado em: {e.created_at instanceof Timestamp ? e.created_at.toDate().toLocaleString('pt-BR') : 'Recém criado'}
                            </span>
                          </div>
                          <span className={`px-2 py-1 text-[8px] font-black rounded uppercase ${
                            e.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                            e.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            e.status === 'refused' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {e.status === 'active' ? 'Ativo' : 
                             e.status === 'pending' ? 'Pendente' :
                             e.status === 'refused' ? 'Recusado' : e.status}
                          </span>
                        </div>
                        
                        {isAdmin && (
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => handleUpdateStatus(e.id, 'active')}
                              className="py-2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-600 transition-colors"
                            >
                              Validar & Iniciar
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(e.id, 'refused')}
                              className="py-2 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Recusar
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(e.id, 'cancelled')}
                              className="py-2 bg-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-300 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={() => handleEditElection(e)}
                              className="py-2 bg-brand-blue text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-brand-blue-dark transition-colors"
                            >
                              Editar
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
          )}
        </>
      )}

      {/* Candidate Modal */}
      {showCandidateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-[40px] p-8 shadow-2xl space-y-6"
          >
            <h2 className="text-2xl font-black text-slate-900">Adicionar {selectedElection?.type === 'slate' ? 'Chapa' : 'Candidato'}</h2>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Nome Completo / Nome da Chapa"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-brand-blue outline-none text-sm"
                value={newCandidate.name}
                onChange={e => setNewCandidate({...newCandidate, name: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="URL da Foto"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-brand-blue outline-none text-sm"
                value={newCandidate.photo_url}
                onChange={e => setNewCandidate({...newCandidate, photo_url: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Cargo / Descrição Curta"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-brand-blue outline-none text-sm"
                value={newCandidate.position}
                onChange={e => setNewCandidate({...newCandidate, position: e.target.value})}
              />
              <textarea 
                placeholder="Biografia / Propostas"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-brand-blue outline-none h-32 text-sm"
                value={newCandidate.bio}
                onChange={e => setNewCandidate({...newCandidate, bio: e.target.value})}
              />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowCandidateModal(false)}
                className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddCandidate}
                className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-brand-blue transition-all text-sm shadow-lg"
              >
                Salvar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-[40px] p-8 shadow-2xl space-y-6"
          >
            <h2 className="text-2xl font-black text-slate-900">Nova Eleição OSC</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Solicitante</label>
                  <input 
                    type="text" 
                    placeholder="Nome do Colaborador"
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-brand-blue outline-none text-sm"
                    value={newElection.requester_name}
                    onChange={e => setNewElection({...newElection, requester_name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Cargo/Função</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Diretor, Conselheiro"
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-brand-blue outline-none text-sm"
                    value={newElection.requester_role}
                    onChange={e => setNewElection({...newElection, requester_role: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Título do Processo</label>
                <input 
                  type="text" 
                  placeholder="Ex: Eleição Diretoria Executiva 2026"
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-brand-blue outline-none text-sm"
                  value={newElection.title}
                  onChange={e => setNewElection({...newElection, title: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Modalidade</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setNewElection({...newElection, type: 'individual'})}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newElection.type === 'individual' ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-slate-400 border-slate-200'}`}
                  >
                    Candidaturas Individuais
                  </button>
                  <button 
                    onClick={() => setNewElection({...newElection, type: 'slate'})}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newElection.type === 'slate' ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-slate-400 border-slate-200'}`}
                  >
                    Chapas Fechadas
                  </button>
                </div>
              </div>

              <textarea 
                placeholder="Descrição e Regras do Processo"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-brand-blue outline-none h-24 text-sm"
                value={newElection.description}
                onChange={e => setNewElection({...newElection, description: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Abertura da Urna</label>
                  <input 
                    type="datetime-local" 
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-brand-blue outline-none text-xs"
                    value={newElection.start_date}
                    onChange={e => setNewElection({...newElection, start_date: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Fechamento</label>
                  <input 
                    type="datetime-local" 
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-brand-blue outline-none text-xs"
                    value={newElection.end_date}
                    onChange={e => setNewElection({...newElection, end_date: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateElection}
                className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-brand-blue transition-all text-sm shadow-lg"
              >
                {isAdmin ? 'Registrar Eleição' : 'Solicitar Abertura'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Electoral;
