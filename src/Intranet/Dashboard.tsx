import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, limit, orderBy, addDoc, updateDoc, doc, deleteDoc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { 
  Users, Megaphone, UserPlus, DollarSign, 
  TrendingUp, ArrowUpRight, ArrowDownRight, ArrowRight,
  Activity, Calendar, Clock, Handshake, Sparkles,
  ShieldCheck, Globe, Star, Printer, X, FileText, Edit2,
  ChevronRight, BarChart3, MessageSquare, Award
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { formatBRDateTime, formatBRDate } from '../services/maintenanceService';
import { DashboardSkeleton } from '../components/Skeleton';

const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    leads: 0,
    campaigns: 0,
    revenue: 0,
    partners: 0,
    users: 0,
    diagnostics: 0,
    registrations: 0,
    evaluations: 0,
  });
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [raffles, setRaffles] = useState<any[]>([]);
  const [fundingProposals, setFundingProposals] = useState<any[]>([]);
  const [externalRevenues, setExternalRevenues] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [editingProposal, setEditingProposal] = useState<any>(null);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [showRaffleForm, setShowRaffleForm] = useState(false);
  const [editingRaffle, setEditingRaffle] = useState<any>(null);
  const [showExternalRevenueForm, setShowExternalRevenueForm] = useState(false);
  const [editingExternalRevenue, setEditingExternalRevenue] = useState<any>(null);
  const [raffleWinner, setRaffleWinner] = useState<any>(null);
  const [raffleNameForDraw, setRaffleNameForDraw] = useState('');
  const [drawRangeStart, setDrawRangeStart] = useState<number>(1);
  const [drawRangeEnd, setDrawRangeEnd] = useState<number>(100);
  const [raffleAmountRaised, setRaffleAmountRaised] = useState<number>(0);
  const [raffleParticipants, setRaffleParticipants] = useState<number>(0);
  const [raffleDrawLogs, setRaffleDrawLogs] = useState<any[]>([]);

  const evaluationsRef = useRef<HTMLDivElement>(null);
  const campaignsRef = useRef<HTMLDivElement>(null);
  const rafflesRef = useRef<HTMLDivElement>(null);
  const proposalsRef = useRef<HTMLDivElement>(null);
  const externalRevenueRef = useRef<HTMLDivElement>(null);

  const handlePrintEvaluations = useReactToPrint({
    contentRef: evaluationsRef,
    documentTitle: 'Relatorio-Avaliacoes-CACI',
  });

  const handlePrintCampaigns = useReactToPrint({
    contentRef: campaignsRef,
    documentTitle: 'Relatorio-Campanhas-CACI',
  });

  const handlePrintRaffles = useReactToPrint({
    contentRef: rafflesRef,
    documentTitle: 'Relatorio-Rifas-CACI',
  });

  const handlePrintProposals = useReactToPrint({
    contentRef: proposalsRef,
    documentTitle: 'Relatorio-Propostas-Financiadores-CACI',
  });

  const handlePrintExternalRevenue = useReactToPrint({
    contentRef: externalRevenueRef,
    documentTitle: 'Relatorio-Receitas-Externas-CACI',
  });

  const handleResetCampaigns = async () => {
    if (window.confirm('Deseja zerar todos os contadores das campanhas? Esta ação não pode ser desfeita.')) {
      try {
        for (const campaign of campaigns) {
          const updateData: any = {
            amount_raised: 0,
            donors_count: 0,
            adjustment_date: new Date().toISOString().split('T')[0],
            status: campaign.status || 'Ativa',
          };
          if (!campaign.created_at) updateData.created_at = new Date();
          if (!campaign.created_by) updateData.created_by = profile?.uid || 'system';
          await updateDoc(doc(db, 'apoia_campaigns', campaign.id), updateData);
        }
        alert('Contadores zerados com sucesso!');
      } catch (error) {
        console.error('Erro ao zerar campanhas:', error);
        alert('Erro ao zerar campanhas. Verifique as permissões.');
      }
    }
  };

  const handleResetRaffles = async () => {
    if (window.confirm('Deseja zerar todos os contadores das rifas? Esta ação não pode ser desfeita.')) {
      try {
        for (const raffle of raffles) {
          const updateData: any = {
            amount_raised: 0,
            donors_count: 0,
            adjustment_date: new Date().toISOString().split('T')[0],
            status: raffle.status || 'Ativa',
          };
          if (!raffle.created_at) updateData.created_at = new Date();
          if (!raffle.created_by) updateData.created_by = profile?.uid || 'system';
          await updateDoc(doc(db, 'solidarity_raffles', raffle.id), updateData);
        }

        // Clear raffle draw logs to reset the total counters
        for (const log of raffleDrawLogs) {
          await deleteDoc(doc(db, 'raffle_draw_logs', log.id));
        }

        alert('Contadores das rifas zerados com sucesso!');
      } catch (error) {
        console.error('Erro ao zerar rifas:', error);
        alert('Erro ao zerar rifas. Verifique as permissões.');
      }
    }
  };

  const handleDrawRaffle = async () => {
    if (!raffleNameForDraw) {
      alert('Por favor, insira o nome da rifa para o sorteio.');
      return;
    }

    if (drawRangeStart >= drawRangeEnd) {
      alert('O início do intervalo deve ser menor que o fim.');
      return;
    }

    if (raffleAmountRaised <= 0 || raffleParticipants <= 0) {
      alert('Por favor, insira o valor arrecadado e o número de participantes.');
      return;
    }
    
    // Simulate a draw within the specified range
    const winnerNumber = Math.floor(Math.random() * (drawRangeEnd - drawRangeStart + 1)) + drawRangeStart;
    
    const drawData = {
      raffleTitle: raffleNameForDraw,
      number: winnerNumber,
      timestamp: new Date(),
      range: `${drawRangeStart} a ${drawRangeEnd}`,
      amount_raised: raffleAmountRaised,
      participants_count: raffleParticipants,
      created_by: profile?.uid || 'system',
      created_by_name: profile?.displayName || profile?.email || 'Colaborador'
    };

    try {
      await addDoc(collection(db, 'raffle_draw_logs'), drawData);
      setRaffleWinner(drawData);
      // Reset fields after draw
      setRaffleAmountRaised(0);
      setRaffleParticipants(0);
    } catch (error) {
      console.error('Erro ao registrar sorteio:', error);
      alert('Erro ao registrar sorteio no sistema.');
    }
  };

  useEffect(() => {
    // Real-time stats
    const unsubLeads = onSnapshot(collection(db, 'leads'), (snap) => {
      setStats(prev => ({ ...prev, leads: snap.size }));
    });
    const unsubCampaigns = onSnapshot(collection(db, 'apoia_campaigns'), (snap) => {
      setStats(prev => ({ ...prev, campaigns: snap.size }));
      setCampaigns(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubRaffles = onSnapshot(collection(db, 'solidarity_raffles'), (snap) => {
      setRaffles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubEvaluations = onSnapshot(collection(db, 'platform_evaluations'), (snap) => {
      setEvaluations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setStats(prev => ({ ...prev, evaluations: snap.size }));
    });
    const unsubPartners = onSnapshot(collection(db, 'partners'), (snap) => {
      setStats(prev => ({ ...prev, partners: snap.size }));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, users: snap.size }));
    });
    const unsubDiagnostics = onSnapshot(collection(db, 'diagnostics'), (snap) => {
      setStats(prev => ({ ...prev, diagnostics: snap.size }));
    });
    const unsubRegistrations = onSnapshot(collection(db, 'osc_registrations'), (snap) => {
      setStats(prev => ({ ...prev, registrations: snap.size }));
    });
    const unsubFundingProposals = onSnapshot(collection(db, 'funding_proposals'), (snap) => {
      setFundingProposals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubExternalRevenues = onSnapshot(collection(db, 'external_revenues'), (snap) => {
      setExternalRevenues(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubRaffleLogs = onSnapshot(collection(db, 'raffle_draw_logs'), (snap) => {
      setRaffleDrawLogs(snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        timestamp: (doc.data() as any).timestamp?.toDate() || new Date()
      })).sort((a: any, b: any) => b.timestamp - a.timestamp));
    });

    // Recent activities (Audit & Governance Logs)
    const qAudit = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(10));
    const qGov = query(collection(db, 'governance_logs'), orderBy('timestamp', 'desc'), limit(10));

    const unsubAudit = onSnapshot(qAudit, (snapAudit) => {
      const auditLogs = snapAudit.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'audit' }));
      const unsubGov = onSnapshot(qGov, (snapGov) => {
        const govLogs = snapGov.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'gov' }));
        const combined = [...auditLogs, ...govLogs]
          .sort((a: any, b: any) => {
            const timeA = a.timestamp?.toMillis?.() || a.timestamp?.seconds * 1000 || 0;
            const timeB = b.timestamp?.toMillis?.() || b.timestamp?.seconds * 1000 || 0;
            return timeB - timeA;
          })
          .slice(0, 8);
        setRecentActivities(combined);
        setLoading(false);
      });
      return unsubGov;
    });

    return () => {
      unsubLeads();
      unsubCampaigns();
      unsubRaffles();
      unsubEvaluations();
      unsubPartners();
      unsubUsers();
      unsubDiagnostics();
      unsubRegistrations();
      unsubFundingProposals();
      unsubExternalRevenues();
      unsubRaffleLogs();
      unsubAudit();
    };
  }, []);

  useEffect(() => {
    const checkScheduledReset = async () => {
      // Only superadmin or diretoria can trigger the auto-reset check
      if (!profile || (profile.role !== 'superadmin' && profile.role !== 'diretoria')) return;

      const today = new Date();
      const resetDate = new Date('2026-05-05');
      
      // If today is on or after the reset date
      if (today >= resetDate) {
        const settingsRef = doc(db, 'system_settings', 'global_resets');
        try {
          const settingsSnap = await getDoc(settingsRef);
          const lastReset = settingsSnap.exists() ? settingsSnap.data().last_scheduled_reset : null;
          
          // If the reset for this specific date hasn't been recorded yet
          if (lastReset !== '2026-05-05') {
            console.log('Iniciando reset programado de 05/05/2026...');
            
            // Reset Campaigns
            const campaignsSnap = await getDocs(collection(db, 'apoia_campaigns'));
            for (const campaignDoc of campaignsSnap.docs) {
              await updateDoc(campaignDoc.ref, {
                amount_raised: 0,
                donors_count: 0,
                adjustment_date: '2026-05-05',
                updated_at: new Date()
              });
            }

            // Reset Raffles
            const rafflesSnap = await getDocs(collection(db, 'solidarity_raffles'));
            for (const raffleDoc of rafflesSnap.docs) {
              await updateDoc(raffleDoc.ref, {
                amount_raised: 0,
                donors_count: 0,
                adjustment_date: '2026-05-05',
                updated_at: new Date()
              });
            }

            // Clear logs
            const logsSnap = await getDocs(collection(db, 'raffle_draw_logs'));
            for (const logDoc of logsSnap.docs) {
              await deleteDoc(logDoc.ref);
            }

            // Mark as done in system settings
            await setDoc(settingsRef, {
              last_scheduled_reset: '2026-05-05',
              updated_at: new Date()
            }, { merge: true });

            alert('Reset programado (05/05/2026) executado com sucesso!');
          }
        } catch (error) {
          console.error('Erro ao verificar reset programado:', error);
        }
      }
    };

    checkScheduledReset();
  }, [profile]);

  // Calculate Revenue dynamically
  useEffect(() => {
    const campaignRevenue = campaigns.reduce((acc, curr) => acc + (curr.amount_raised || 0), 0);
    const raffleRevenue = raffleDrawLogs.reduce((acc, curr) => acc + (curr.amount_raised || 0), 0);
    const proposalRevenue = fundingProposals
      .filter(p => p.status === 'aprovado')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const externalRevenue = externalRevenues.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    
    setStats(prev => ({ ...prev, revenue: campaignRevenue + raffleRevenue + proposalRevenue + externalRevenue }));
  }, [campaigns, raffleDrawLogs, fundingProposals, externalRevenues]);

  const handleSaveExternalRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    // Generate automatic receipt number if new entry
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const autoReceipt = `REC-${new Date().getFullYear()}-${timestamp}${random}`;

    const data: any = {
      source_name: formData.get('source_name') as string,
      amount: Number(formData.get('amount')),
      category: formData.get('category') as string,
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      responsible_name: profile?.name || profile?.email || 'Colaborador',
      updated_at: new Date(),
    };

    try {
      if (editingExternalRevenue) {
        await updateDoc(doc(db, 'external_revenues', editingExternalRevenue.id), data);
      } else {
        await addDoc(collection(db, 'external_revenues'), {
          ...data,
          receipt_number: autoReceipt,
          created_at: new Date(),
          created_by: profile?.uid
        });
      }
      setShowExternalRevenueForm(false);
      setEditingExternalRevenue(null);
    } catch (error) {
      console.error('Erro ao salvar receita externa:', error);
      alert('Erro ao salvar receita externa.');
    }
  };

  const handleDeleteExternalRevenue = async (id: string) => {
    if (window.confirm('Deseja realmente excluir este lançamento? Esta ação não pode ser desfeita.')) {
      try {
        await deleteDoc(doc(db, 'external_revenues', id));
        alert('Lançamento excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir receita externa:', error);
        alert('Erro ao excluir lançamento. Verifique as permissões.');
      }
    }
  };

  const data = [
    { name: 'Jan', value: 4000 },
    { name: 'Fev', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Abr', value: 2780 },
    { name: 'Mai', value: 1890 },
    { name: 'Jun', value: 2390 },
  ];

  const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
          <Icon className={color?.replace('bg-', 'text-') || ''} size={24} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <h3 className="text-3xl font-bold text-slate-900">
          {typeof value === 'number' && label.includes('Receita') 
            ? `R$ ${value.toLocaleString('pt-BR')}` 
            : value}
        </h3>
      </div>
    </div>
  );

  const allowedDepartments = [
    'Diretoria e conselhos',
    'Gerência de Projetos e Captação',
    'TI/Dados',
    'Comunicação e Marketing'
  ];

  const hasAccess = profile?.role === 'superadmin' || 
                    profile?.role === 'diretoria' ||
                    profile?.role === 'externo' ||
                    (profile?.role === 'admin' && allowedDepartments.includes(profile.department || ''));

  const isInternal = profile?.role === 'superadmin' || 
                     profile?.role === 'diretoria' ||
                     (profile?.role === 'admin' && allowedDepartments.includes(profile.department || ''));

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center text-brand-blue">
            <Sparkles size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Olá, {profile?.name?.split(' ')[0] || 'Bem-vindo'}!
            </h1>
            <p className="text-slate-500 font-medium">
              {profile?.role === 'superadmin' 
                ? 'Acesso total ao Ecossistema CACI' 
                : profile?.role === 'admin' 
                  ? `Gestão do Departamento: ${profile.department || 'Geral'}`
                  : 'Visão geral do ecossistema CACI'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm self-start sm:self-center">
          <Calendar size={18} className="text-brand-blue" />
          <span className="text-sm font-bold text-slate-700">{formatBRDate(new Date())}</span>
        </div>
      </header>

      {/* Quick Navigation / Summary */}
      {hasAccess && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.button 
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => evaluationsRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="p-8 bg-white rounded-[40px] border-2 border-slate-100 shadow-sm hover:shadow-2xl hover:border-brand-gold/40 transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
              <Star size={120} className="text-brand-gold" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-brand-gold/10 rounded-2xl group-hover:bg-brand-gold group-hover:text-white transition-colors">
                  <Star className="text-brand-gold group-hover:text-white" size={28} />
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-gold/10 transition-colors">
                  <ArrowRight size={20} className="text-slate-300 group-hover:text-brand-gold group-hover:translate-x-1 transition-all" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Avaliações</h4>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Gestão de Feedback & NPS</p>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <span className="px-3 py-1 bg-brand-gold/10 text-brand-gold text-[10px] font-black rounded-full uppercase">
                  {stats.evaluations} Registros
                </span>
                <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '70%' }}
                    className="h-full bg-brand-gold"
                  />
                </div>
              </div>
            </div>
          </motion.button>
          
          <motion.button 
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => campaignsRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="p-8 bg-white rounded-[40px] border-2 border-slate-100 shadow-sm hover:shadow-2xl hover:border-brand-blue/40 transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
              <Megaphone size={120} className="text-brand-blue" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-brand-blue/10 rounded-2xl group-hover:bg-brand-blue group-hover:text-white transition-colors">
                  <Megaphone className="text-brand-blue group-hover:text-white" size={28} />
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-blue/10 transition-colors">
                  <ArrowRight size={20} className="text-slate-300 group-hover:text-brand-blue group-hover:translate-x-1 transition-all" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Campanhas</h4>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Apoia Brasil & Rifas</p>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue text-[10px] font-black rounded-full uppercase">
                  {stats.campaigns} Ativas
                </span>
                <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '45%' }}
                    className="h-full bg-brand-blue"
                  />
                </div>
              </div>
            </div>
          </motion.button>

          <motion.button 
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => proposalsRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="p-8 bg-white rounded-[40px] border-2 border-slate-100 shadow-sm hover:shadow-2xl hover:border-brand-emerald/40 transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
              <FileText size={120} className="text-brand-emerald" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-brand-emerald/10 rounded-2xl group-hover:bg-brand-emerald group-hover:text-white transition-colors">
                  <FileText className="text-brand-emerald group-hover:text-white" size={28} />
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-emerald/10 transition-colors">
                  <ArrowRight size={20} className="text-slate-300 group-hover:text-brand-emerald group-hover:translate-x-1 transition-all" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Propostas</h4>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Financiadores & Editais</p>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <span className="px-3 py-1 bg-brand-emerald/10 text-brand-emerald text-[10px] font-black rounded-full uppercase">
                  {fundingProposals.length} Submissões
                </span>
                <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '60%' }}
                    className="h-full bg-brand-emerald"
                  />
                </div>
              </div>
            </div>
          </motion.button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          icon={UserPlus} 
          label="Cadastros OSC" 
          value={stats.registrations} 
          trend={15} 
          color="bg-brand-blue" 
        />
        <StatCard 
          icon={ShieldCheck} 
          label="Diagnósticos" 
          value={stats.diagnostics} 
          color="bg-brand-emerald" 
        />
        <StatCard 
          icon={Megaphone} 
          label="Campanhas" 
          value={stats.campaigns} 
          color="bg-indigo-500" 
        />
        <StatCard 
          icon={Star} 
          label="Avaliações" 
          value={stats.evaluations} 
          color="bg-brand-gold" 
        />
        <StatCard 
          icon={DollarSign} 
          label="Receita Total" 
          value={stats.revenue} 
          color="bg-amber-500" 
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Evaluations Section (Visible to external users too) */}
          {hasAccess && (
            <div ref={evaluationsRef} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8 print:p-0 print:border-none">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Star size={20} className="text-brand-gold" />
                    Avaliações do Ecossistema
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Feedback Consolidado da Plataforma
                  </p>
                </div>
                {/* Export button removed as requested for external users/security */}
              </div>

              {/* Prominent Stats for Evaluations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-brand-gold/5 rounded-3xl border border-brand-gold/10 flex items-center gap-4">
                      <div className="p-3 bg-brand-gold text-white rounded-2xl">
                        <MessageSquare size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Avaliações</p>
                        <p className="text-2xl font-black text-slate-900">{evaluations.length}</p>
                      </div>
                    </div>
                    <div className="p-6 bg-brand-gold/5 rounded-3xl border border-brand-gold/10 flex items-center gap-4">
                      <div className="p-3 bg-brand-gold text-white rounded-2xl">
                        <Star size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Média Geral</p>
                        <p className="text-2xl font-black text-slate-900">
                          {(evaluations.reduce((acc, curr) => acc + (curr.performance + curr.visual + curr.navigation + curr.access + curr.information) / 5, 0) / (evaluations.length || 1)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-48 w-full bg-slate-50 rounded-3xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Métricas de Satisfação</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Perf', value: evaluations.reduce((acc, curr) => acc + curr.performance, 0) / (evaluations.length || 1) },
                        { name: 'Vis', value: evaluations.reduce((acc, curr) => acc + curr.visual, 0) / (evaluations.length || 1) },
                        { name: 'Nav', value: evaluations.reduce((acc, curr) => acc + curr.navigation, 0) / (evaluations.length || 1) },
                        { name: 'Acc', value: evaluations.reduce((acc, curr) => acc + curr.access, 0) / (evaluations.length || 1) },
                        { name: 'Info', value: evaluations.reduce((acc, curr) => acc + curr.information, 0) / (evaluations.length || 1) },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
                        <YAxis hide domain={[0, 5]} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="value" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Últimos Feedbacks</p>
                  <div className="space-y-3">
                    {evaluations.slice(0, 3).map((evalItem) => (
                      <div key={evalItem.id} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-black text-slate-900">{evalItem.userEmail?.split('@')[0] || 'Anônimo'}</span>
                          <div className="flex items-center gap-1">
                            <Star size={10} className="fill-brand-gold text-brand-gold" />
                            <span className="text-[10px] font-black text-slate-900">
                              {((evalItem.performance + evalItem.visual + evalItem.navigation + evalItem.access + evalItem.information) / 5).toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 italic line-clamp-2">{evalItem.comment || 'Sem comentário'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Média</th>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Comentário</th>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {evaluations.slice(0, 5).map((evalItem) => {
                      const avg = (evalItem.performance + evalItem.visual + evalItem.navigation + evalItem.access + evalItem.information) / 5;
                      return (
                        <tr key={evalItem.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-4 text-xs font-bold text-slate-600">
                            {evalItem.timestamp?.toDate().toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-black text-slate-900">{avg.toFixed(1)}</span>
                              <Star size={10} className="fill-brand-gold text-brand-gold" />
                            </div>
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-500 italic max-w-xs truncate">
                            {evalItem.comment || '-'}
                          </td>
                          <td className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase">
                            {evalItem.userEmail || 'Anônimo'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Campaigns Section (Visible only to internal users) */}
          {isInternal && (
            <div ref={campaignsRef} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8 print:p-0 print:border-none">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Megaphone size={20} className="text-brand-blue" />
                    Campanhas Apoia Brasil
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Gestão de Crowdfunding e Rifas | <span className="text-brand-blue">Reinicio em 05/05/2026</span>
                  </p>
                </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditingCampaign(null);
                        setShowCampaignForm(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue-dark transition-all"
                    >
                      Nova Campanha
                    </button>
                    <button 
                      onClick={handleResetCampaigns}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all"
                    >
                      Zerar Contadores
                    </button>
                    <button 
                      onClick={() => handlePrintCampaigns()}
                      className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue-dark transition-all shadow-lg shadow-brand-blue/20 group"
                    >
                      <Printer size={16} className="group-hover:scale-110 transition-transform" /> 
                      <span>Gerar Relatório Estratégico</span>
                    </button>
                  </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 relative group">
                    <button 
                      onClick={() => {
                        setEditingCampaign(campaign);
                        setShowCampaignForm(true);
                      }}
                      className="absolute top-4 right-4 p-2 bg-white rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all text-brand-blue hover:scale-110"
                    >
                      <Edit2 size={14} />
                    </button>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{campaign.title}</h4>
                        <p className="text-[8px] text-slate-400 font-bold uppercase">Início: {campaign.start_date || '-'} | Ajuste: {campaign.adjustment_date || '-'}</p>
                      </div>
                      <div className="flex items-center gap-1 text-brand-blue">
                        <Users size={12} />
                        <span className="text-xs font-black">{campaign.donors_count || 0}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                        <span>R$ {campaign.amount_raised?.toLocaleString('pt-BR')}</span>
                        <span>Meta R$ {campaign.goal?.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-blue" 
                          style={{ width: `${Math.min(((campaign.amount_raised || 0) / (campaign.goal || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculadora Automática Campanhas */}
              <div className="pt-6 border-t border-slate-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Arrecadado</p>
                    <p className="text-lg font-black text-brand-blue">R$ {campaigns.reduce((acc, curr) => acc + (curr.amount_raised || 0), 0).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Doadores</p>
                    <p className="text-lg font-black text-slate-900">{campaigns.reduce((acc, curr) => acc + (curr.donors_count || 0), 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Raffles Section (Visible only to internal users) */}
          {isInternal && (
            <div ref={rafflesRef} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8 print:p-0 print:border-none">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Sparkles size={20} className="text-brand-gold" />
                    Rifas Solidárias
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Gestão de Sorteios e Arrecadação Extra
                  </p>
                </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditingRaffle(null);
                        setShowRaffleForm(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-gold-dark transition-all"
                    >
                      Nova Rifa
                    </button>
                    <button 
                      onClick={handleResetRaffles}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all"
                    >
                      Zerar Contadores
                    </button>
                    <button 
                      onClick={() => handlePrintRaffles()}
                      className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue-dark transition-all shadow-lg shadow-brand-blue/20 group"
                    >
                      <Printer size={16} className="group-hover:scale-110 transition-transform" /> 
                      <span>Gerar Relatório Estratégico</span>
                    </button>
                  </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {raffles.map((raffle) => (
                  <div key={raffle.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 relative group">
                    <button 
                      onClick={() => {
                        setEditingRaffle(raffle);
                        setShowRaffleForm(true);
                      }}
                      className="absolute top-4 right-4 p-2 bg-white rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all text-brand-blue hover:scale-110"
                    >
                      <Edit2 size={14} />
                    </button>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{raffle.title}</h4>
                        <p className="text-[8px] text-slate-400 font-bold uppercase">Início: {raffle.start_date || '-'} | Ajuste: {raffle.adjustment_date || '-'}</p>
                      </div>
                      <div className="flex items-center gap-1 text-brand-gold">
                        <Users size={12} />
                        <span className="text-xs font-black">{raffle.donors_count || 0}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                        <span>R$ {raffle.amount_raised?.toLocaleString('pt-BR')}</span>
                        <span>Meta R$ {raffle.goal?.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-gold" 
                          style={{ width: `${Math.min(((raffle.amount_raised || 0) / (raffle.goal || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sorteador Automático */}
              <div className="p-8 bg-brand-blue/5 rounded-[32px] border border-brand-blue/10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-blue text-white rounded-2xl">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Sorteador Automático</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Realize o sorteio de forma aleatória e segura</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome da Rifa</label>
                    <input 
                      type="text" 
                      placeholder="Identificação da Rifa..."
                      value={raffleNameForDraw}
                      onChange={(e) => setRaffleNameForDraw(e.target.value)}
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Início</label>
                    <input 
                      type="number" 
                      value={drawRangeStart}
                      onChange={(e) => setDrawRangeStart(Number(e.target.value))}
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fim</label>
                    <input 
                      type="number" 
                      value={drawRangeEnd}
                      onChange={(e) => setDrawRangeEnd(Number(e.target.value))}
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                  </div>
                  <div className="w-40">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor Arrecadado (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={raffleAmountRaised}
                      onChange={(e) => setRaffleAmountRaised(Number(e.target.value))}
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Participantes</label>
                    <input 
                      type="number" 
                      value={raffleParticipants}
                      onChange={(e) => setRaffleParticipants(Number(e.target.value))}
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={handleDrawRaffle}
                      className="px-8 py-4 bg-brand-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue-dark transition-all shadow-lg shadow-brand-blue/20"
                    >
                      Sortear Agora
                    </button>
                  </div>
                </div>

                {raffleWinner && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-white rounded-3xl border-2 border-brand-gold shadow-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold">
                        <Award size={32} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencedor Sorteado</p>
                        <h5 className="text-xl font-black text-slate-900">{raffleWinner.raffleTitle}</h5>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <p className="text-sm font-bold text-brand-gold">Número: #{raffleWinner.number}</p>
                          <p className="text-[10px] font-bold text-slate-500">Intervalo: {raffleWinner.range}</p>
                          <p className="text-[10px] font-bold text-slate-500">
                            Data: {raffleWinner.timestamp.toLocaleDateString('pt-BR')} - {raffleWinner.timestamp.toLocaleTimeString('pt-BR')}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500">Colaborador: {raffleWinner.created_by_name}</p>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setRaffleWinner(null)}
                      className="p-2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={20} />
                    </button>
                  </motion.div>
                )}

                {/* Histórico de Sorteios */}
                <div className="pt-4 space-y-4">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico de Sorteios Realizados</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="py-2 px-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Data/Hora</th>
                          <th className="py-2 px-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Rifa</th>
                          <th className="py-2 px-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Número</th>
                          <th className="py-2 px-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Arrecadado</th>
                          <th className="py-2 px-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Participantes</th>
                          <th className="py-2 px-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {raffleDrawLogs.slice(0, 5).map((log) => (
                          <tr key={log.id} className="text-[10px]">
                            <td className="py-2 px-2 text-slate-500">{log.timestamp.toLocaleString('pt-BR')}</td>
                            <td className="py-2 px-2 font-bold text-slate-900">{log.raffleTitle}</td>
                            <td className="py-2 px-2 font-black text-brand-gold">#{log.number}</td>
                            <td className="py-2 px-2 text-emerald-600 font-bold">R$ {log.amount_raised?.toLocaleString('pt-BR')}</td>
                            <td className="py-2 px-2 text-slate-600">{log.participants_count}</td>
                            <td className="py-2 px-2 text-slate-400">{log.created_by_name}</td>
                          </tr>
                        ))}
                        {raffleDrawLogs.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-slate-400 italic">Nenhum sorteio registrado.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Arrecadado Rifas</p>
                    <p className="text-lg font-black text-brand-gold">R$ {raffleDrawLogs.reduce((acc, curr) => acc + (curr.amount_raised || 0), 0).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Participantes</p>
                    <p className="text-lg font-black text-slate-900">{raffleDrawLogs.reduce((acc, curr) => acc + (curr.participants_count || 0), 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Funding Proposals Section (Visible only to internal users) */}
          {isInternal && (
            <div ref={proposalsRef} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8 print:p-0 print:border-none">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <FileText size={20} className="text-brand-blue" />
                    Propostas à Financiadores
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Gestão de Projetos e Captação de Recursos
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingProposal(null);
                      setShowProposalForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue-dark transition-all"
                  >
                    Nova Proposta
                  </button>
                  <button 
                    onClick={() => handlePrintProposals()}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue-dark transition-all shadow-lg shadow-brand-blue/20 group"
                  >
                    <Printer size={16} className="group-hover:scale-110 transition-transform" /> 
                    <span>Gerar Relatório Estratégico</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">OSC Proponente</th>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Título / Resumo</th>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Submissão</th>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {fundingProposals.map((proposal) => (
                      <tr key={proposal.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 text-xs font-bold text-slate-900">{proposal.osc_name}</td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="text-xs font-black text-slate-900">{proposal.title}</div>
                            <div className="text-[10px] text-slate-500 italic max-w-xs truncate">{proposal.summary}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs font-bold text-slate-600">{proposal.submission_date}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            proposal.status === 'aprovado' ? 'bg-emerald-100 text-emerald-600' :
                            proposal.status === 'em_analise' ? 'bg-amber-100 text-amber-600' : 
                            proposal.status === 'em_ajuste' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {proposal.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button 
                            onClick={() => {
                              setEditingProposal(proposal);
                              setShowProposalForm(true);
                            }}
                            className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {fundingProposals.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400 italic text-xs">Nenhuma proposta registrada.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Calculadora Automática Propostas */}
              <div className="pt-6 border-t border-slate-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Propostas</p>
                    <p className="text-lg font-black text-slate-900">{fundingProposals.length}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Aprovadas</p>
                    <p className="text-lg font-black text-emerald-600">{fundingProposals.filter(p => p.status === 'aprovado').length}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Aprovado</p>
                    <p className="text-lg font-black text-emerald-600">R$ {fundingProposals.filter(p => p.status === 'aprovado').reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Em Análise</p>
                    <p className="text-lg font-black text-amber-600">{fundingProposals.filter(p => p.status === 'em_analise').length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* External Revenue Section (Visible only to internal users) */}
          {isInternal && (
            <div ref={externalRevenueRef} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8 print:p-0 print:border-none">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <DollarSign size={20} className="text-brand-gold" />
                    Receitas Externas e Rendimentos
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Programas Sociais, Investimentos e Outras Fontes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingExternalRevenue(null);
                      setShowExternalRevenueForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-gold-dark transition-all"
                  >
                    Nova Receita
                  </button>
                  <button 
                    onClick={() => handlePrintExternalRevenue()}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-gold text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-gold-dark transition-all shadow-lg shadow-brand-gold/20 group"
                  >
                    <Printer size={16} className="group-hover:scale-110 transition-transform" /> 
                    <span>Gerar Relatório Financeiro</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data/Hora</th>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fonte / Origem</th>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recibo</th>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável</th>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {externalRevenues.sort((a: any, b: any) => {
                      const dateA = a.created_at?.toMillis?.() || 0;
                      const dateB = b.created_at?.toMillis?.() || 0;
                      return dateB - dateA;
                    }).map((rev) => (
                      <tr key={rev.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 text-[10px] font-bold text-slate-500">
                          {rev.created_at ? formatBRDateTime(rev.created_at) : rev.date}
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="text-xs font-black text-slate-900">{rev.source_name}</div>
                            <div className="text-[10px] text-slate-500 italic max-w-xs truncate">{rev.description}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                            {rev.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-[10px] font-mono text-slate-400">{rev.receipt_number || '-'}</td>
                        <td className="py-4 px-4 text-[10px] font-bold text-slate-600">{rev.responsible_name || '-'}</td>
                        <td className="py-4 px-4 text-xs font-black text-emerald-600">R$ {rev.amount?.toLocaleString('pt-BR')}</td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button 
                              onClick={() => {
                                setEditingExternalRevenue(rev);
                                setShowExternalRevenueForm(true);
                              }}
                              className="text-[10px] font-black text-brand-gold uppercase tracking-widest hover:underline"
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => handleDeleteExternalRevenue(rev.id)}
                              className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {externalRevenues.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400 italic text-xs">Nenhuma receita externa registrada.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Calculadora Automática Receitas Externas */}
              <div className="pt-6 border-t border-slate-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Lançamentos</p>
                    <p className="text-lg font-black text-slate-900">{externalRevenues.length}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Arrecadado</p>
                    <p className="text-lg font-black text-emerald-600">R$ {externalRevenues.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp size={20} className="text-brand-blue" />
                Desempenho de Conversão
              </h3>
              <select className="bg-slate-50 border-none rounded-xl text-sm font-bold px-4 py-2 focus:ring-2 focus:ring-brand-blue/20">
                <option>Últimos 6 meses</option>
                <option>Último ano</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0066FF" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#0066FF" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[40px] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-brand-blue/30 transition-all" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/20 text-brand-blue text-[10px] font-black uppercase tracking-widest">
                  <Sparkles size={14} />
                  Ecossistema CACI 2026+
                </div>
                <h3 className="text-2xl font-black tracking-tight">Integração Estratégica</h3>
                <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                  Acesse os modelos de parceria, diagnósticos institucionais e a rede de colaboração do ecossistema diretamente do seu painel.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <button 
                    onClick={() => window.location.href = '/intranet/parcerias'}
                    className="px-6 py-3 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-blue-dark transition-all flex items-center gap-2"
                  >
                    Modelos de Parceria (4)
                    <Handshake size={14} />
                  </button>
                  <button 
                    onClick={() => window.location.href = '/ecossistema'}
                    className="px-6 py-3 bg-white/10 text-white border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all"
                  >
                    Ver Ecossistema
                  </button>
                </div>
              </div>
              <div className="w-32 h-32 md:w-48 md:h-48 bg-white/5 rounded-[40px] flex items-center justify-center border border-white/10 rotate-3 group-hover:rotate-6 transition-transform">
                <Globe className="w-16 h-16 md:w-24 md:h-24 text-brand-blue/40" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity size={20} className="text-brand-emerald" />
            Atividades Recentes
          </h3>
          <div className="space-y-6">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 group cursor-pointer">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  activity.type === 'gov' ? 'bg-amber-50 text-amber-600' :
                  activity.action.includes('Criação') ? 'bg-emerald-50 text-emerald-600' : 
                  activity.action.includes('Exclusão') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {activity.type === 'gov' ? <ShieldCheck size={18} /> : <Activity size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {activity.action}
                    {activity.module && <span className="text-slate-400 font-normal ml-1">({activity.module})</span>}
                  </p>
                  <p className="text-xs text-slate-500 truncate">por {activity.user || activity.user_id || 'Sistema'}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                    {activity.timestamp ? formatBRDateTime(activity.timestamp) : 'Agora'}
                  </p>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="text-center text-slate-400 py-8 italic">Nenhuma atividade registrada.</p>
            )}
          </div>
          <button className="w-full mt-8 py-3 rounded-2xl border-2 border-slate-100 text-slate-600 font-bold hover:bg-slate-50 transition-all">
            Ver Log Completo
          </button>
        </div>
      </div>

      {/* Campaign Form Modal */}
      {showCampaignForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCampaignForm(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
            <header className="flex items-center justify-between px-10 py-8 border-b border-slate-100 bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingCampaign ? 'Ajustar Campanha' : 'Nova Campanha'}
                </h3>
                <div className="h-1 w-12 bg-brand-blue rounded-full" />
              </div>
              <button 
                onClick={() => setShowCampaignForm(false)}
                className="p-3 rounded-2xl hover:bg-slate-100 text-slate-500 transition-all"
              >
                <X size={24} />
              </button>
            </header>
            <form 
              className="p-10 overflow-y-auto space-y-6"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data: any = {
                  title: formData.get('title'),
                  start_date: formData.get('start_date'),
                  adjustment_date: formData.get('adjustment_date'),
                  amount_raised: Number(formData.get('amount_raised')),
                  goal: Number(formData.get('goal')),
                  donors_count: Number(formData.get('donors_count')),
                  status: formData.get('status'),
                  updated_at: new Date(),
                };

                try {
                  if (editingCampaign) {
                    // Ensure required fields exist for firestore rules validation
                    if (!editingCampaign.created_at) data.created_at = new Date();
                    if (!editingCampaign.created_by) data.created_by = profile?.uid || 'system';

                    await updateDoc(doc(db, 'apoia_campaigns', editingCampaign.id), data);
                  } else {
                    await addDoc(collection(db, 'apoia_campaigns'), {
                      ...data,
                      created_at: new Date(),
                      created_by: profile?.uid,
                    });
                  }
                  setShowCampaignForm(false);
                } catch (error) {
                  console.error('Error saving campaign:', error);
                  alert('Erro ao salvar campanha. Verifique se todos os campos estão preenchidos corretamente.');
                }
              }}
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título da Campanha</label>
                <input 
                  name="title" 
                  defaultValue={editingCampaign?.title} 
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-blue outline-none transition-all text-sm font-bold"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Início</label>
                  <input 
                    name="start_date" 
                    type="date"
                    defaultValue={editingCampaign?.start_date || new Date().toISOString().split('T')[0]} 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-blue outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data do Ajuste</label>
                  <input 
                    name="adjustment_date" 
                    type="date"
                    defaultValue={editingCampaign?.adjustment_date || new Date().toISOString().split('T')[0]} 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-blue outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Arrecadado (R$)</label>
                  <input 
                    name="amount_raised" 
                    type="number"
                    step="0.01"
                    defaultValue={editingCampaign?.amount_raised || 0} 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-blue outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta (R$)</label>
                  <input 
                    name="goal" 
                    type="number"
                    step="0.01"
                    defaultValue={editingCampaign?.goal || 0} 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-blue outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                  <select 
                    name="status" 
                    defaultValue={editingCampaign?.status || 'Ativa'}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-blue outline-none transition-all text-sm font-bold"
                  >
                    <option value="Planejamento">Planejamento</option>
                    <option value="Ativa">Ativa</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Ajuste">Ajuste</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doadores</label>
                  <input 
                    name="donors_count" 
                    type="number"
                    defaultValue={editingCampaign?.donors_count || 0} 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-blue outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowCampaignForm(false)}
                  className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-600 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 rounded-2xl bg-brand-blue text-white font-black uppercase tracking-widest text-[10px] hover:bg-brand-blue-dark transition-all shadow-lg shadow-brand-blue/20"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* External Revenue Form Modal */}
      {showExternalRevenueForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowExternalRevenueForm(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
            <header className="flex items-center justify-between px-10 py-8 border-b border-slate-100 bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingExternalRevenue ? 'Editar Receita' : 'Lançar Nova Receita Externa'}
                </h3>
                <div className="h-1 w-12 bg-brand-gold rounded-full" />
              </div>
              <button 
                onClick={() => setShowExternalRevenueForm(false)}
                className="p-3 rounded-2xl hover:bg-slate-100 text-slate-500 transition-all"
              >
                <X size={24} />
              </button>
            </header>

            <form 
              onSubmit={handleSaveExternalRevenue}
              className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fonte / Origem da Receita</label>
                <input 
                  name="source_name" 
                  placeholder="Ex: Fundo Municipal, Rendimento CDB, Venda de Camisetas..."
                  defaultValue={editingExternalRevenue?.source_name} 
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-gold outline-none transition-all text-sm font-bold"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor (R$)</label>
                  <input 
                    name="amount" 
                    type="number"
                    step="0.01"
                    defaultValue={editingExternalRevenue?.amount || 0} 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-gold outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</label>
                  <select 
                    name="category" 
                    defaultValue={editingExternalRevenue?.category || 'Programas Sociais'}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-gold outline-none transition-all text-sm font-bold"
                    required
                  >
                    <option value="Programas Sociais">Programas Sociais</option>
                    <option value="Investimentos">Investimentos</option>
                    <option value="Rendimentos Bancários">Rendimentos Bancários</option>
                    <option value="Venda de Produtos">Venda de Produtos</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data do Recebimento</label>
                <input 
                  name="date" 
                  type="date"
                  defaultValue={editingExternalRevenue?.date || new Date().toISOString().split('T')[0]} 
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-gold outline-none transition-all text-sm font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição / Observações</label>
                <textarea 
                  name="description" 
                  rows={3}
                  defaultValue={editingExternalRevenue?.description} 
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-gold outline-none transition-all text-sm font-bold resize-none"
                />
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowExternalRevenueForm(false)}
                  className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-600 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 rounded-2xl bg-brand-gold text-white font-black uppercase tracking-widest text-[10px] hover:bg-brand-gold-dark transition-all shadow-lg shadow-brand-gold/20"
                >
                  {editingExternalRevenue ? 'Salvar Alterações' : 'Lançar Receita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proposal Form Modal */}
      {showProposalForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowProposalForm(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
            <header className="flex items-center justify-between px-10 py-8 border-b border-slate-100 bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingProposal ? 'Editar Proposta' : 'Nova Proposta à Financiador'}
                </h3>
                <div className="h-1 w-12 bg-brand-blue rounded-full" />
              </div>
              <button 
                onClick={() => setShowProposalForm(false)}
                className="p-3 rounded-2xl hover:bg-slate-100 text-slate-500 transition-all"
              >
                <X size={24} />
              </button>
            </header>
            <form 
              className="p-10 overflow-y-auto space-y-6"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data: any = {
                  osc_name: formData.get('osc_name'),
                  title: formData.get('title'),
                  amount: Number(formData.get('amount')),
                  summary: formData.get('summary'),
                  submission_date: formData.get('submission_date'),
                  status: formData.get('status'),
                  document_url: formData.get('document_url'),
                  updated_at: new Date(),
                };

                try {
                  if (editingProposal) {
                    // Ensure required fields exist for firestore rules validation
                    if (!editingProposal.created_at) data.created_at = new Date();
                    if (!editingProposal.created_by) data.created_by = profile?.uid || 'system';
                    
                    await updateDoc(doc(db, 'funding_proposals', editingProposal.id), data);
                  } else {
                    await addDoc(collection(db, 'funding_proposals'), {
                      ...data,
                      created_at: new Date(),
                      created_by: profile?.uid,
                      created_by_name: profile?.name
                    });
                  }
                  setShowProposalForm(false);
                } catch (error) {
                  console.error('Error saving proposal:', error);
                  alert('Erro ao salvar proposta. Verifique as permissões.');
                }
              }}
            >
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OSC Proponente</label>
                  <input 
                    name="osc_name" 
                    defaultValue={editingProposal?.osc_name || 'ONG CACI - Casa de Apoio ao Cidadão'} 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-blue outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Submissão</label>
                  <input 
                    name="submission_date" 
                    type="date"
                    defaultValue={editingProposal?.submission_date || new Date().toISOString().split('T')[0]} 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-blue outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>
              </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título da Proposta</label>
                  <input 
                    name="title" 
                    defaultValue={editingProposal?.title} 
                    placeholder="Ex: Projeto Educação Inclusiva 2026"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-blue outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor da Proposta (R$)</label>
                  <input 
                    name="amount" 
                    type="number"
                    step="0.01"
                    defaultValue={editingProposal?.amount || 0} 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-blue outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo da Proposta</label>
                <textarea 
                  name="summary" 
                  defaultValue={editingProposal?.summary} 
                  placeholder="Breve descrição do projeto e objetivos..."
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-blue outline-none transition-all text-sm font-bold min-h-[100px] resize-none"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                  <select 
                    name="status" 
                    defaultValue={editingProposal?.status || 'em_analise'}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-blue outline-none transition-all text-sm font-bold"
                  >
                    <option value="em_analise">Em Análise</option>
                    <option value="aprovada">Aprovada</option>
                    <option value="reprovada">Reprovada</option>
                    <option value="em_ajuste">Em Ajuste</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link do Documento (PDF)</label>
                  <input 
                    name="document_url" 
                    type="url"
                    defaultValue={editingProposal?.document_url} 
                    placeholder="https://..."
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-blue outline-none transition-all text-sm font-bold"
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowProposalForm(false)}
                  className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-600 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 rounded-2xl bg-brand-blue text-white font-black uppercase tracking-widest text-[10px] hover:bg-brand-blue-dark transition-all shadow-lg shadow-brand-blue/20"
                >
                  {editingProposal ? 'Salvar Alterações' : 'Criar Proposta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Raffle Form Modal */}
      {showRaffleForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRaffleForm(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
            <header className="flex items-center justify-between px-10 py-8 border-b border-slate-100 bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingRaffle ? 'Ajustar Rifa' : 'Nova Rifa Solidária'}
                </h3>
                <div className="h-1 w-12 bg-brand-gold rounded-full" />
              </div>
              <button 
                onClick={() => setShowRaffleForm(false)}
                className="p-3 rounded-2xl hover:bg-slate-100 text-slate-500 transition-all"
              >
                <X size={24} />
              </button>
            </header>
            <form 
              className="p-10 overflow-y-auto space-y-6"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data: any = {
                  title: formData.get('title'),
                  start_date: formData.get('start_date'),
                  adjustment_date: formData.get('adjustment_date'),
                  amount_raised: Number(formData.get('amount_raised')),
                  goal: Number(formData.get('goal')),
                  donors_count: Number(formData.get('donors_count')),
                  status: formData.get('status'),
                  updated_at: new Date(),
                };

                try {
                  if (editingRaffle) {
                    if (!editingRaffle.created_at) data.created_at = new Date();
                    if (!editingRaffle.created_by) data.created_by = profile?.uid || 'system';
                    await updateDoc(doc(db, 'solidarity_raffles', editingRaffle.id), data);
                  } else {
                    await addDoc(collection(db, 'solidarity_raffles'), {
                      ...data,
                      created_at: new Date(),
                      created_by: profile?.uid,
                    });
                  }
                  setShowRaffleForm(false);
                } catch (error) {
                  console.error('Error saving raffle:', error);
                  alert('Erro ao salvar rifa. Verifique as permissões.');
                }
              }}
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título da Rifa</label>
                <input 
                  name="title" 
                  defaultValue={editingRaffle?.title} 
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-gold outline-none transition-all text-sm font-bold"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Início</label>
                  <input 
                    name="start_date" 
                    type="date"
                    defaultValue={editingRaffle?.start_date || new Date().toISOString().split('T')[0]} 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-gold outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data do Ajuste</label>
                  <input 
                    name="adjustment_date" 
                    type="date"
                    defaultValue={editingRaffle?.adjustment_date || new Date().toISOString().split('T')[0]} 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-gold outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Arrecadado (R$)</label>
                  <input 
                    name="amount_raised" 
                    type="number"
                    step="0.01"
                    defaultValue={editingRaffle?.amount_raised || 0} 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-gold outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta (R$)</label>
                  <input 
                    name="goal" 
                    type="number"
                    step="0.01"
                    defaultValue={editingRaffle?.goal || 0} 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-gold outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                  <select 
                    name="status" 
                    defaultValue={editingRaffle?.status || 'Ativa'}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-gold outline-none transition-all text-sm font-bold"
                  >
                    <option value="Planejamento">Planejamento</option>
                    <option value="Ativa">Ativa</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Ajuste">Ajuste</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Participantes</label>
                  <input 
                    name="donors_count" 
                    type="number"
                    defaultValue={editingRaffle?.donors_count || 0} 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-gold outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowRaffleForm(false)}
                  className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-600 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 rounded-2xl bg-brand-gold text-white font-black uppercase tracking-widest text-[10px] hover:bg-brand-gold-dark transition-all shadow-lg shadow-brand-gold/20"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
