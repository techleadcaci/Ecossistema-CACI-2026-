import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp, collection, getDocs, addDoc, increment } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Entities from './modules/Entities';
import Programs from './modules/Programs';
import Products from './modules/Products';
import Assets from './modules/Assets';
import Campaigns from './modules/Campaigns';
import Leads from './modules/Leads';
import Revenue from './modules/Revenue';
import Partners from './modules/Partners';
import Users from './modules/Users';
import Registrations from './modules/Registrations';
import Diagnostics from './modules/Diagnostics';
import Evaluations from './modules/Evaluations';
import Reports from './modules/Reports';
import Audit from './modules/Audit';
import RH from './modules/RH';
import Electoral from './modules/Electoral';
import ESGMaturity from './modules/ESGMaturity';
import DigitalMaturity from './modules/DigitalMaturity';
import PersonalityID from './modules/PersonalityID';
import AdminConsole from './modules/AdminConsole';
import InstitutionalDiagnostic from './modules/InstitutionalDiagnostic';
import ImprovementPanels from './modules/ImprovementPanels';
import ExecConsole from './modules/ExecConsole';
import GovConsole from './modules/GovConsole';
import SocioambientalConsole from './modules/SocioambientalConsole';
import DefesaConsole from './modules/DefesaConsole';
import EducacaoConsole from './modules/EducacaoConsole';
import ProjetosConsole from './modules/ProjetosConsole';
import SocialSaudeConsole from './modules/SocialSaudeConsole';
import AdmFinConsole from './modules/AdmFinConsole';
import MktConsole from './modules/MktConsole';
import RHConsole from './modules/RHConsole';
import TIConsole from './modules/TIConsole';
import Governance from './Governance';
import Login from './Login';
import Register from './Register';
import MFAChallenge from '../components/MFAChallenge';
import CACIiaChat from '../components/AI/CACIiaChat';

const IntranetApp = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [mfaVerified, setMfaVerified] = useState(() => {
    return sessionStorage.getItem('caci_mfa_verified') === 'true';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024);
  const location = useLocation();
  const [sessionTime, setSessionTime] = useState(0);
  const [inactivityTime, setInactivityTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseTime, setPauseTime] = useState(0);

  // Session limits in seconds
  const MAX_SESSION_MATRIZ = 3 * 60 * 60; // 3 hours
  const MAX_SESSION_OTHERS = 4 * 60 * 60; // 4 hours
  const INACTIVITY_LIMIT = 5 * 60; // 5 minutes
  const MAX_PAUSE = 15 * 60; // 15 minutes

  const isMatriz = profile?.area?.toLowerCase() === 'matriz' || user?.email?.toLowerCase() === 'ti@caci.ong.br';
  const sessionLimit = isMatriz ? MAX_SESSION_MATRIZ : MAX_SESSION_OTHERS;

  const handleLogout = useCallback(async (reason: string, extraTime: number = 0) => {
    if (!user) return;
    
    try {
      // Add extra time to bank of hours if applicable
      if (extraTime > 0) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { 
          bank_of_hours: increment(extraTime / 60) // Store in minutes
        }, { merge: true });
      }

      // Log the logout action
      await addDoc(collection(db, 'time_logs'), {
        user_id: user.uid,
        type: 'saida_automatica',
        reason,
        timestamp: serverTimestamp(),
        session_duration: sessionTime
      });

      await signOut(auth);
      sessionStorage.removeItem('caci_mfa_verified');
      window.location.href = '/intranet';
    } catch (err) {
      console.error('Error during auto-logout:', err);
    }
  }, [user, sessionTime]);

  // Inactivity tracking
  useEffect(() => {
    if (!user || isPaused) return;

    const handleActivity = () => setInactivityTime(0);
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    const timer = setInterval(() => {
      setInactivityTime(prev => prev + 1);
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(timer);
    };
  }, [user, isPaused]);

  // Pause tracking
  useEffect(() => {
    if (!isPaused) return;

    const timer = setInterval(() => {
      setPauseTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused]);

  // Session logic checks
  useEffect(() => {
    if (!user) return;

    // Auto logout for inactivity
    if (inactivityTime >= INACTIVITY_LIMIT) {
      handleLogout('Inatividade', INACTIVITY_LIMIT);
    }

    // Auto logout for session limit
    if (sessionTime >= sessionLimit) {
      handleLogout('Tempo limite de sessão excedido');
    }

    // Auto resume after pause limit + 1 min
    if (isPaused && pauseTime >= MAX_PAUSE + 60) {
      setIsPaused(false);
      setPauseTime(0);
      // Discount excess time (1 min)
      const discountTime = async () => {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { 
          bank_of_hours: increment(-1) 
        }, { merge: true });
      };
      discountTime();
    }
  }, [inactivityTime, sessionTime, pauseTime, isPaused, user, sessionLimit, handleLogout]);

  useEffect(() => {
    if (user?.email?.toLowerCase() === 'ti@caci.ong.br') {
      setMfaVerified(true);
    }
  }, [user]);

  useEffect(() => {
    if (mfaVerified) {
      sessionStorage.setItem('caci_mfa_verified', 'true');
    }
  }, [mfaVerified]);

  useEffect(() => {
    setIsSidebarCollapsed(true);
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      const updateActivity = async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          const dataToSet: any = { 
            last_active: serverTimestamp(),
            email: user.email,
            name: user.displayName || profile?.name || 'Usuário',
            uid: user.uid
          };

          // If profile is null, it means the user document doesn't exist yet
          // We must provide all required fields to satisfy Firestore rules
          if (!profile) {
            dataToSet.created_at = serverTimestamp();
            dataToSet.status = 'Ativo';
            dataToSet.user_type = 'interno';
            dataToSet.id_ccgu = 'pendente_configuracao';
            dataToSet.id_cfrh = 'pendente_configuracao';
          } else {
            // Ensure existing profiles have these fields if they were created before
            if (!profile.id_ccgu) dataToSet.id_ccgu = 'pendente_configuracao';
            if (!profile.id_cfrh) dataToSet.id_cfrh = 'pendente_configuracao';
            if (!profile.status) dataToSet.status = 'Ativo';
            if (!profile.user_type) dataToSet.user_type = 'interno';
            if (!profile.created_at) dataToSet.created_at = serverTimestamp();
          }

          // Force correct role based on email for privileged accounts
          const email = user.email?.toLowerCase();
          if (email === 'ti@caci.ong.br') dataToSet.role = 'superadmin';
          else if (email === 'diretoria@caci.ong.br') {
            dataToSet.role = 'diretoria';
            dataToSet.name = 'Diretoria - CACI Presidência';
          }
          else if (email === 'governanca@caci.ong.br') dataToSet.role = 'governanca';
          else if (email === 'projetos@caci.ong.br') dataToSet.role = 'projetos';
          else if (email === 'rh@caci.ong.br') dataToSet.role = 'rh';
          else if (!profile) dataToSet.role = 'user';

          await setDoc(userRef, dataToSet, { merge: true });
          console.log('User activity updated successfully');
        } catch (err) {
          console.error('Error updating activity:', err);
        }
      };

      const seedInitialData = async () => {
        try {
          // Seed Improvement Actions
          const improvementsSnap = await getDocs(collection(db, 'improvement_actions'));
          if (improvementsSnap.empty) {
            const actions = [
              { title: 'Implementar Governança de Dados', category: 'Governança', priority: 'Alta', status: 'Em Andamento', responsible: 'TI / Diretoria', deadline: '2026-06-30', description: 'Estabelecer políticas de acesso e segurança.', created_at: serverTimestamp(), created_by: user.uid },
              { title: 'Revisão do Plano Estratégico 2026', category: 'Estratégia', priority: 'Crítica', status: 'Pendente', responsible: 'Diretoria Executiva', deadline: '2026-04-15', description: 'Atualizar objetivos estratégicos.', created_at: serverTimestamp(), created_by: user.uid },
              { title: 'Campanha Apoia Brasil', category: 'Financeiro', priority: 'Média', status: 'Concluída', responsible: 'Comunicação', deadline: '2026-03-20', description: 'Lançamento do crowdfunding.', created_at: serverTimestamp(), created_by: user.uid }
            ];
            for (const action of actions) {
              await addDoc(collection(db, 'improvement_actions'), action);
            }
          }

          // Seed Leads
          const leadsSnap = await getDocs(collection(db, 'leads'));
          if (leadsSnap.empty) {
            await addDoc(collection(db, 'leads'), {
              name: 'João Silva',
              email: 'joao@exemplo.com',
              phone: '(11) 99999-9999',
              status: 'Novo',
              source: 'whatsapp',
              created_at: serverTimestamp(),
              created_by: user.uid
            });
          }

          // Seed Revenue
          const revenueSnap = await getDocs(collection(db, 'revenue'));
          if (revenueSnap.empty) {
            await addDoc(collection(db, 'revenue'), {
              product: 'Consultoria IMI',
              value: 1500,
              origin: 'Venda Direta',
              partner: 'OSC Exemplo',
              date: new Date().toISOString().split('T')[0],
              created_at: serverTimestamp(),
              created_by: user.uid
            });
          }

          // Seed Governance Logs
          const logsSnap = await getDocs(collection(db, 'governance_logs'));
          if (logsSnap.empty) {
            const initialLogs = [
              { action: 'Atualização de diretrizes de governança institucional', module: 'Geral', timestamp: serverTimestamp(), user_id: user.uid },
              { action: 'Revisão de parcerias estratégicas Q1 2026', module: 'Parcerias', timestamp: serverTimestamp(), user_id: user.uid },
              { action: 'Atualização de Configuração do Site: Hero Section (v3)', module: 'CommandCenter', timestamp: serverTimestamp(), user_id: user.uid }
            ];
            for (const log of initialLogs) {
              await addDoc(collection(db, 'governance_logs'), log);
            }
          }

          // Seed Campaigns (Ensure 6 campaigns)
          const campaignsSnap = await getDocs(collection(db, 'apoia_campaigns'));
          const existingTitles = campaignsSnap.docs.map(doc => doc.data().title);
          
          const requiredCampaigns = [
            { title: 'Campanha Apoia Brasil', goal: 50000, raised: 45000, status: 'ativa', created_at: serverTimestamp(), created_by: user.uid },
            { title: 'Fundo de Emergência CACI', goal: 20000, raised: 12000, status: 'ativa', created_at: serverTimestamp(), created_by: user.uid },
            { title: 'Projeto Educação Digital', goal: 30000, raised: 5000, status: 'ativa', created_at: serverTimestamp(), created_by: user.uid },
            { title: 'Sustentabilidade OSC 2026', goal: 100000, raised: 85000, status: 'ativa', created_at: serverTimestamp(), created_by: user.uid },
            { title: 'Reforma Sede Institucional', goal: 150000, raised: 20000, status: 'ativa', created_at: serverTimestamp(), created_by: user.uid },
            { title: 'Financiamento do Ecossistema', goal: 250000, raised: 0, status: 'ativa', created_at: serverTimestamp(), created_by: user.uid }
          ];

          for (const campaign of requiredCampaigns) {
            if (!existingTitles.includes(campaign.title)) {
              await addDoc(collection(db, 'apoia_campaigns'), campaign);
            }
          }

          // Seed Institutional Codes (Valdomiro Santana Jardim)
          const cfrhSnap = await getDocs(collection(db, 'cfrh_codes'));
          if (cfrhSnap.empty) {
            const initialCFRH = [
              {
                id_cfrh: '0001-DIR-2026-P',
                area: 'Diretoria',
                role: 'Diretoria Executiva',
                instrument: 'PTI',
                instrument_code: 'PTI-001',
                type: 'P',
                creation_year: 2026,
                status: 'Ativo',
                id_digital: 'valdomiro.diretoria@caci.ong.br',
                created_at: serverTimestamp(),
                validator_id: user.uid
              },
              {
                id_cfrh: '0002-TI-2026-P',
                area: 'TI',
                role: 'Gestão de TI',
                instrument: 'PTI',
                instrument_code: 'PTI-001',
                type: 'P',
                creation_year: 2026,
                status: 'Ativo',
                id_digital: 'valdomiro.ti@caci.ong.br',
                created_at: serverTimestamp(),
                validator_id: user.uid
              }
            ];
            for (const code of initialCFRH) {
              await addDoc(collection(db, 'cfrh_codes'), code);
            }
          }

          const ccguSnap = await getDocs(collection(db, 'ccgu_codes'));
          if (ccguSnap.empty) {
            await addDoc(collection(db, 'ccgu_codes'), {
              id_ccgu: 'CCGU-2026-F-0001',
              person_name: 'Valdomiro Santana Jardim',
              link_type: 'F',
              first_link_date: '2026-01-01',
              id_cfrh: '0001-DIR-2026-P',
              status: 'Ativo',
              history: 'Fundador e Diretor Executivo',
              created_at: serverTimestamp()
            });
          }

          const identitySnap = await getDocs(collection(db, 'institutional_identities'));
          if (identitySnap.empty) {
            await addDoc(collection(db, 'institutional_identities'), {
              id_cfrh: '0001-DIR-2026-P',
              id_digital: 'valdomiro.diretoria@caci.ong.br',
              corporate_email: 'diretoria@caci.ong.br',
              whatsapp: '5511999999999',
              platform: 'Google Workspace',
              account_type: 'Superadmin',
              criticality: 'Crítica',
              instrument: 'PTI',
              area: 'Diretoria',
              project: 'CACI Geral',
              role: 'Diretor Executivo',
              start_date: '2026-01-01',
              is_admin: true,
              has_sensitive_data: true,
              external_sharing: true,
              redundancy: true,
              timestamp: serverTimestamp(),
              email: 'diretoria@caci.ong.br'
            });
          }
        } catch (err) {
          console.error('Error seeding initial data:', err);
        }
      };

      updateActivity();
      seedInitialData();
      const interval = setInterval(updateActivity, 5 * 60 * 1000); // Every 5 mins
      return () => clearInterval(interval);
    }
  }, [user, profile]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  // Allow access to Register page even if not logged in
  if (!user && location.pathname === '/intranet/register') {
    return <Register />;
  }

  if (!user) {
    return <Login />;
  }

  // MFA logic - simplified for now, could be restricted to admins/superadmins
  const isSuperAdminBypass = user?.email?.toLowerCase() === 'ti@caci.ong.br';

  if (!mfaVerified && !isSuperAdminBypass) {
    return <MFAChallenge onVerify={() => setMfaVerified(true)} userEmail={user.email || ''} />;
  }

  return (
    <div className="flex h-screen bg-sequential-0 overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Session Status Bar */}
        {user && (
          <div className="bg-white border-b border-slate-100 px-6 py-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Sessão Ativa: {Math.floor(sessionTime / 3600)}h {Math.floor((sessionTime % 3600) / 60)}m {sessionTime % 60}s
              </div>
              <div className="text-slate-400">
                Limite: {Math.floor(sessionLimit / 3600)}h
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isPaused ? (
                <div className="flex items-center gap-2 text-amber-600">
                  <span>Pausado: {Math.floor(pauseTime / 60)}m {pauseTime % 60}s</span>
                  <button 
                    onClick={() => { setIsPaused(false); setPauseTime(0); }}
                    className="bg-amber-100 px-2 py-1 rounded hover:bg-amber-200 transition-colors"
                  >
                    Retomar
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsPaused(true)}
                  className="text-slate-400 hover:text-brand-blue transition-colors"
                >
                  Pausar Sessão
                </button>
              )}
              <div className="text-slate-400">
                Inatividade: {Math.floor(inactivityTime / 60)}m {inactivityTime % 60}s
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 transition-all duration-300 custom-scrollbar">
          <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin" element={<AdminConsole />} />
          <Route path="/admin/executivo" element={<ExecConsole />} />
          <Route path="/admin/governanca" element={<GovConsole />} />
          <Route path="/admin/socioambiental" element={<SocioambientalConsole />} />
          <Route path="/admin/defesa" element={<DefesaConsole />} />
          <Route path="/admin/educacao" element={<EducacaoConsole />} />
          <Route path="/admin/projetos" element={<ProjetosConsole />} />
          <Route path="/admin/social-saude" element={<SocialSaudeConsole />} />
          <Route path="/admin/adm-financeiro" element={<AdmFinConsole />} />
          <Route path="/admin/marketing" element={<MktConsole />} />
          <Route path="/admin/rh" element={<RHConsole />} />
          <Route path="/admin/ti" element={<TIConsole />} />
          <Route path="/melhorias" element={<ImprovementPanels />} />
          <Route path="/diagnostico-institucional" element={<InstitutionalDiagnostic />} />
          <Route path="/usuarios" element={<Users />} />
          <Route path="/cadastros" element={<Registrations />} />
          <Route path="/diagnosticos" element={<Diagnostics />} />
          <Route path="/avaliacoes" element={<Evaluations />} />
          <Route path="/relatorios" element={<Reports />} />
          <Route path="/identidades" element={<Entities />} />
          <Route path="/programas" element={<Programs />} />
          <Route path="/produtos" element={<Products />} />
          <Route path="/ativos" element={<Assets />} />
          <Route path="/campanhas" element={<Campaigns />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/receita" element={<Revenue />} />
          <Route path="/parcerias" element={<Partners />} />
          <Route path="/auditoria" element={<Audit />} />
          <Route path="/ponto" element={<RH />} />
          <Route path="/eleitoral" element={<Electoral />} />
          <Route path="/esg" element={<ESGMaturity />} />
          <Route path="/digital" element={<DigitalMaturity />} />
          <Route path="/personality" element={<PersonalityID />} />
          <Route path="/governanca" element={<Governance />} />
          <Route path="/register" element={<Navigate to="/intranet" replace />} />
          <Route path="*" element={<Navigate to="/intranet" replace />} />
        </Routes>
      </main>
    </div>
    <CACIiaChat 
        agentType="interno" 
        organizationId="caci_staff" 
        initialMessage="Olá! Sou a CACIia, assistente interna da CACI. Como posso ajudar com a gestão da rede, análise de dados ou suporte administrativo hoje?"
      />
    </div>
  );
};

export default IntranetApp;
