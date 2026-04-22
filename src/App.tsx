/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useReactToPrint } from 'react-to-print';
import { 
  Menu, X, ChevronRight, Heart, BookOpen, Users, UserPlus,
  Leaf, Info, Mail, Phone, MapPin, ExternalLink, 
  ArrowRight, Award, ShieldCheck, Globe, GraduationCap,
  Calendar, MessageSquare, Download, Lock,
  BarChart3, Facebook, Instagram, Youtube, Linkedin, ChevronUp,
  LayoutDashboard, ClipboardCheck, Building2, Search, FileText, Home as HomeIcon,
  RefreshCw, Zap, Palette, Music, TrendingUp, QrCode, Ticket, DollarSign, Printer,
  Star
} from 'lucide-react';
import { db, auth } from './firebase';
import { 
  collection, 
  getDocs, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  limit,
  addDoc,
  doc
} from 'firebase/firestore';
import IntranetApp from './Intranet/IntranetApp';
import EcossistemaLayout from './pages/Ecossistema/EcossistemaLayout';
import EcossistemaHome from './pages/Ecossistema/Home';
import ProtocoloAdesao from './pages/Ecossistema/OSCRegistration';
import Diagnosis from './pages/Ecossistema/Diagnosis';
import Dashboard from './pages/Ecossistema/Dashboard';
import ERPDashboard from './pages/Ecossistema/ERPDashboard';
import TermsOfUse from './pages/Ecossistema/TermsOfUse';
import Result from './pages/Ecossistema/Result';
import Recommendation from './pages/Ecossistema/Recommendation';
import StrategicPartnerships from './pages/Ecossistema/StrategicPartnerships';
import TwoFactorAuth from './pages/Ecossistema/TwoFactorAuth';
import StrategicDashboard from './pages/Ecossistema/StrategicDashboard';
import PlatformEvaluations from './pages/Ecossistema/PlatformEvaluations';
import Benchmarking from './pages/Ecossistema/Benchmarking';
import EvolutionJourney from './pages/Ecossistema/EvolutionJourney';
import ApoiaBrasil from './pages/ApoiaBrasil';
import CommandCenter from './pages/CommandCenter';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedERP from './components/ProtectedERP';
import CACIiaChat from './components/AI/CACIiaChat';
import Ticker from './components/Ticker';
import BeneficiaryArea from './components/BeneficiaryArea';
import { initializeFounder } from './services/ecossistemaService';

// --- Types ---
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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Components ---

export const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}: any) => {
  const variants: any = {
    primary: 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20 hover:bg-brand-blue-dark active:translate-y-0',
    emerald: 'bg-brand-emerald text-white shadow-lg shadow-brand-emerald/20 hover:bg-brand-emerald-dark active:translate-y-0',
    outline: 'border-2 border-slate-200 text-slate-700 hover:border-brand-blue hover:text-brand-blue bg-white',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    white: 'bg-white text-brand-blue shadow-xl hover:bg-slate-50 active:translate-y-0',
    gold: 'bg-brand-gold text-slate-900 shadow-lg shadow-brand-gold/20 hover:bg-brand-gold-dark active:translate-y-0',
  };

  return (
    <motion.button 
      whileHover={{ y: -5, scale: 1.02, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-black text-sm uppercase tracking-wider transition-all duration-300 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

const Card = ({ children, className = '', padding = true }: any) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden ${padding ? 'p-6' : ''} ${className}`}>
    {children}
  </div>
);

const HubCardCarousel = ({ cardIndex, title }: { cardIndex: number, title: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = Array.from({ length: 6 }).map((_, i) => `https://picsum.photos/seed/hub-card-${cardIndex}-${i}/800/600`);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000 + (cardIndex * 800)); // Staggered start
    return () => clearInterval(timer);
  }, [images.length, cardIndex]);

  return (
    <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-700">
      <AnimatePresence>
        <motion.img
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          src={images[currentIndex]}
          alt={`${title} - Imagem ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 px-4 z-20">
        {images.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 rounded-full transition-all duration-500 ${
              idx === currentIndex ? 'w-4 bg-white' : 'w-1 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const Section = ({ id, children, className = '', title, subtitle, dark = false, index = 0 }: any) => (
  <section id={id} className={`py-20 sm:py-24 ${dark ? 'bg-slate-900 text-white' : `bg-sequential-${index % 3} text-slate-900`} ${className}`}>
    <div className="container-custom">
      {(title || subtitle) && (
        <div className="mb-12 max-w-3xl">
          {title && (
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tighter mb-4"
            >
              {title}
            </motion.h2>
          )}
          {subtitle && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className={`text-lg leading-relaxed italic ${dark ? 'text-slate-400' : 'text-slate-600'}`}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      )}
      {children}
    </div>
  </section>
);

const Modal = ({ isOpen, onClose, title, children }: any) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100"
          >
            <header className="flex items-center justify-between px-10 py-8 border-b border-slate-100 bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
                <div className="h-1 w-12 bg-brand-blue rounded-full" />
              </div>
              <button 
                onClick={onClose}
                className="p-3 rounded-2xl hover:bg-slate-100 text-slate-500 transition-all hover:rotate-90"
              >
                <X size={24} />
              </button>
            </header>
            <div className="p-10 overflow-y-auto custom-scrollbar">
              {children}
            </div>
            <footer className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button variant="primary" onClick={onClose} className="px-10">Fechar Janela</Button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const EvaluationModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [ratings, setRatings] = useState({
    performance: 0,
    visual: 0,
    navigation: 0,
    access: 0,
    information: 0
  });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const criteria = [
    { id: 'performance', label: 'Desempenho' },
    { id: 'visual', label: 'Layout/Visual' },
    { id: 'navigation', label: 'Navegabilidade/Navegação' },
    { id: 'access', label: 'Facilidade de acesso' },
    { id: 'information', label: 'Facilidade de encontrar informações' },
  ];

  const handleSubmit = async () => {
    if (Object.values(ratings).some(r => r === 0)) {
      alert('Por favor, avalie todos os critérios.');
      return;
    }
    setIsSubmitting(true);
    const path = 'platform_evaluations';
    try {
      await addDoc(collection(db, path), {
        ...ratings,
        comment,
        userEmail: auth.currentUser?.email || 'Anônimo',
        userId: auth.currentUser?.uid || null,
        timestamp: new Date(),
      });
      // Limpa os dados imediatamente após o envio
      setRatings({ performance: 0, visual: 0, navigation: 0, access: 0, information: 0 });
      setComment('');
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      try {
        handleFirestoreError(error, OperationType.WRITE, path);
      } catch (err: any) {
        // O erro já foi logado no handleFirestoreError
        alert('Erro ao enviar avaliação. Por favor, verifique sua conexão ou tente novamente mais tarde.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Avaliar o Ecossistema CACI">
      {submitted ? (
        <div className="text-center py-10">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} />
          </div>
          <h4 className="text-2xl font-black text-slate-900 mb-2">Obrigado pela sua avaliação!</h4>
          <p className="text-slate-600 mb-8">Sua opinião é fundamental para o aprimoramento contínuo da nossa plataforma.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" onClick={() => setSubmitted(false)} className="px-8">Realizar Nova Avaliação</Button>
            <Button variant="outline" onClick={onClose} className="px-8">Fechar</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <p className="text-slate-600 italic">
            Sua avaliação nos ajuda a construir uma plataforma cada vez melhor. Por favor, atribua uma nota de 1 a 5 para cada um dos aspectos abaixo:
          </p>
          
          <div className="space-y-6">
            {criteria.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-700">{item.label}</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatings(prev => ({ ...prev, [item.id]: star }))}
                      className={`p-1 transition-all ${ratings[item.id as keyof typeof ratings] >= star ? 'text-amber-400 scale-110' : 'text-slate-300 hover:text-amber-200'}`}
                    >
                      <Star size={28} fill={ratings[item.id as keyof typeof ratings] >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <label className="block font-bold text-slate-700 uppercase tracking-widest text-xs">
              Outros aspectos e funcionalidades (Opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência..."
              className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all min-h-[120px] resize-none"
            />
          </div>

          <Button 
            variant="primary" 
            className="w-full py-5 text-lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
        </div>
      )}
    </Modal>
  );
};

const Counter = ({ target, duration = 2000, suffix = '', prefix = '', padZeros = false, className = "font-black text-brand-purple text-4xl sm:text-5xl" }: any) => {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          
          // User requested a 20ms "rega" (delay/rule) before starting
          setTimeout(() => {
            let start = 0;
            const end = parseInt(target.toString().replace(/[^0-9]/g, '')) || 0;
            if (start === end) {
              setCount(end);
              return;
            }

            const intervalMs = 20; // Exact 20ms interval per step
            
            let timer = setInterval(() => {
              start += Math.ceil(end / 100); // Speed up for larger numbers
              if (start >= end) {
                setCount(end);
                clearInterval(timer);
              } else {
                setCount(start);
              }
            }, intervalMs);
          }, 20);
        }
      },
      { threshold: 0.1 }
    );

    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  const displayValue = padZeros ? count.toString().padStart(2, '0') : count.toLocaleString('pt-BR');

  return (
    <span ref={nodeRef} className={className}>
      {prefix}{displayValue}{suffix}
    </span>
  );
};

// --- Main App ---

export default function App() {
  useEffect(() => {
    initializeFounder();
  }, []);

  return (
    <ErrorBoundary>
      <Ticker />
      <Routes>
        <Route path="/intranet/*" element={<IntranetApp />} />
        <Route path="/apoia-brasil/*" element={<ApoiaBrasil />} />
        
        {/* Ecossistema CACI Routes */}
        <Route path="/ecossistema" element={<EcossistemaLayout />}>
          <Route index element={<EcossistemaHome />} />
          <Route path="adesao" element={<ProtocoloAdesao />} />
          <Route path="cadastro/osc" element={<ProtocoloAdesao />} />
          <Route path="cadastro/profissional" element={<ProtocoloAdesao />} />
          <Route path="cadastro/especialista" element={<ProtocoloAdesao />} />
          <Route path="diagnostico" element={<Diagnosis />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/erp" element={<ProtectedERP><ERPDashboard /></ProtectedERP>} />
          <Route path="termos" element={<TermsOfUse />} />
          <Route path="resultado/:diagnosticId" element={<Result />} />
          <Route path="recomendacao/:diagnosticId" element={<Recommendation />} />
          <Route path="benchmarking" element={<Benchmarking />} />
          <Route path="jornada" element={<EvolutionJourney />} />
          <Route path="parcerias" element={<StrategicPartnerships />} />
          <Route path="2fa" element={<TwoFactorAuth />} />
          <Route path="dashboard-estrategico" element={<StrategicDashboard />} />
          <Route path="command-center" element={<ProtectedERP><CommandCenter /></ProtectedERP>} />
          <Route path="avaliacoes" element={<PlatformEvaluations />} />
        </Route>

        <Route path="/*" element={<PublicSite />} />
      </Routes>
    </ErrorBoundary>
  );
}

function PublicSite() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('edu');
  const [bannerVisible, setBannerVisible] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Apresentacao-Institucional-CACI',
  });
  
  // Carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [ouvidoriaModalOpen, setOuvidoriaModalOpen] = useState(false);
  const [beneficiaryModalOpen, setBeneficiaryModalOpen] = useState(false);
  const heroImages = [
    'input_file_0.png',
    'input_file_1.png',
    'input_file_2.png',
    'input_file_3.png',
    'input_file_4.png',
    'input_file_5.png',
  ];

  // Hub Carousel state
  const [hubImageIndex, setHubImageIndex] = useState(0);
  const hubImages = [
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200',
  ];

  // Modal states
  const [hubModalOpen, setHubModalOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [irModalOpen, setIrModalOpen] = useState(false);
  const [quemSomosModalOpen, setQuemSomosModalOpen] = useState(false);
  const [activeQuemSomosTab, setActiveQuemSomosTab] = useState(0);
  const [activeIRTab, setActiveIRTab] = useState(0);
  const [impostoDevido, setImpostoDevido] = useState('');
  const [resultadoCalculo, setResultadoCalculo] = useState<number | null>(null);
  const [historiaModalOpen, setHistoriaModalOpen] = useState(false);
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [fundingProposalsModalOpen, setFundingProposalsModalOpen] = useState(false);
  const [fundingProposals, setFundingProposals] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 45000); // 45 seconds

    return () => clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    if (hubModalOpen) {
      const timer = setInterval(() => {
        setHubImageIndex((prev) => (prev + 1) % hubImages.length);
      }, 6000); // 6 seconds
      return () => clearInterval(timer);
    } else {
      setHubImageIndex(0);
    }
  }, [hubModalOpen, hubImages.length]);

  const [impactStats, setImpactStats] = useState({
    anosLegado: 22,
    transparencia: 100,
    oscsRede: 0,
    participacao: 0,
    diagnosticos: 0,
    propostas: 0,
    totalEvaluations: 0,
    avgEvaluation: 0
  });

  const [apoiaStats, setApoiaStats] = useState({
    activeCampaigns: 5, // Baseline
    solidarityRaffles: 3, // Baseline
    generatedImpact: 0, // Baseline
    partnerONGs: 1, // Baseline (ONG CACI)
    winners: 0, // Baseline
  });

  useEffect(() => {
    const syncStats = async () => {
      try {
        const response = await fetch('/api/metrics/summary');
        if (!response.ok) return;
        const data = await response.json();
        
        setImpactStats(prev => ({
          ...prev,
          oscsRede: data.total_oscs || 0,
          participacao: data.total_oscs || 0,
          diagnosticos: (data.total_diags || 0) + (data.personality_count || 0),
          propostas: data.proposals_count || 0,
          totalEvaluations: data.evaluations_count || 0,
          avgEvaluation: data.avg_evaluation || 0
        }));

        setApoiaStats(prev => ({
          ...prev,
          partnerONGs: data.total_oscs || 1,
          generatedImpact: data.total_impact || 0,
          activeCampaigns: data.active_campaigns || 5,
          solidarityRaffles: data.active_raffles || 3,
          winners: data.winners_count || 0
        }));
      } catch (error) {
        console.error("SSOT Sync Error:", error);
      }
    };

    syncStats();
    const interval = setInterval(syncStats, 60000); // 1-minute heartbeat
    return () => clearInterval(interval);
  }, []);

  const calcularIR = () => {
    const valor = parseFloat((impostoDevido || '').replace(',', '.'));
    if (!isNaN(valor)) {
      setResultadoCalculo(valor * 0.06);
    }
  };

  const navLinks = [
    { name: 'Quem Somos', href: '#quem-somos' },
    { name: 'Apoia Brasil', href: '/apoia-brasil' },
    { name: 'Programas', href: '#programas' },
    { name: 'Usuário/Beneficiário', href: '#usuario-beneficiario' },
    { name: 'Imposto de Renda', href: '#ir' },
    { name: 'Transparência', href: '#transparencia' },
    { name: 'Ouvidoria', isModal: true, onClick: () => setOuvidoriaModalOpen(true) },
    { name: 'Nossa História', isModal: true, onClick: () => setHistoriaModalOpen(true) },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Utility Top Bar */}
      <div className="bg-slate-900 text-white py-2 px-6 text-[11px] font-bold uppercase tracking-[0.15em]">
        <div className="container-custom flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity cursor-default">
              <Globe size={12} />
              PT-BR
            </span>
            <span className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity cursor-default">
              <ShieldCheck size={12} />
              Transparência 100%
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              to="/intranet" 
              className="flex items-center gap-2 text-brand-gold hover:text-white transition-colors group"
              id="intranet-top-link"
            >
              <Lock size={12} className="group-hover:scale-110 transition-transform" />
              <span>Acesso Intranet</span>
              <span className="bg-brand-gold text-slate-900 text-[8px] px-1.5 py-0.5 rounded-full font-black ml-1">2FA</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-2xl border-b border-slate-100">
        <div className="container-custom py-4 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden group-hover:shadow-md transition-all">
              <img src="https://ais-pre-qvipanm3ysdp4ln6k5eqfh-308119493736.us-west2.run.app/Logo_CACI_2026+.SVG.png" alt="Logo CACI" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-display font-black tracking-tighter text-slate-900 leading-none">CACI</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Casa de Apoio ao Cidadão</p>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link: any) => (
              link.isModal ? (
                <button 
                  key={link.name} 
                  onClick={link.onClick}
                  className="px-4 py-2 rounded-full text-[12px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-blue hover:bg-slate-50 transition-all cursor-pointer"
                >
                  {link.name}
                </button>
              ) : (
                <a 
                  key={link.name} 
                  href={link.href}
                  className="px-4 py-2 rounded-full text-[12px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-blue hover:bg-slate-50 transition-all"
                >
                  {link.name}
                </a>
              )
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">SSOT Ativo: Cloud Run</span>
            </div>
            <Link 
              to="/intranet" 
              className="hidden lg:flex items-center gap-2 px-6 py-3 rounded-full text-[12px] font-black uppercase tracking-widest text-slate-900 border-2 border-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-lg shadow-slate-900/10"
              id="intranet-header-link"
            >
              <Lock size={14} />
              Intranet
              <span className="bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded-full group-hover:bg-white group-hover:text-slate-900 transition-colors">2FA</span>
            </Link>
            <Button 
              variant="primary" 
              className="hidden sm:flex px-10 py-3 text-sm shadow-2xl shadow-brand-blue/30" 
              id="start-button-main"
              onClick={() => navigate('/ecossistema')}
            >
              Iniciar
            </Button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-3 rounded-xl bg-slate-50 text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-30 bg-white pt-24 px-6 lg:hidden"
          >
            <nav className="flex flex-col gap-6">
              {navLinks.map((link: any) => (
                link.isModal ? (
                  <button 
                    key={link.name} 
                    onClick={() => { link.onClick(); setIsMenuOpen(false); }}
                    className="text-3xl font-display font-black text-slate-900 hover:text-brand-blue transition-colors text-left"
                  >
                    {link.name}
                  </button>
                ) : (
                  <a 
                    key={link.name} 
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-3xl font-display font-black text-slate-900 hover:text-brand-blue transition-colors"
                  >
                    {link.name}
                  </a>
                )
              ))}
              <hr className="border-slate-100" />
              <Link 
                to="/intranet" 
                onClick={() => setIsMenuOpen(false)}
                className="text-2xl font-bold text-brand-blue flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Lock size={24} />
                  Intranet
                </div>
                <span className="bg-brand-gold text-slate-900 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">2FA Obrigatório</span>
              </Link>
              <Button variant="primary" className="w-full py-5 text-xl mt-4">Iniciar</Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* Hero Section - Redesigned for International Standard */}
        <section className="relative min-h-[95vh] flex items-center overflow-hidden bg-sequential-0">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-sequential-1 skew-x-[-12deg] translate-x-24 hidden lg:block" />
          
          <div className="container-custom relative z-10 py-24">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.2,
                      delayChildren: 0.3
                    }
                  }
                }}
              >
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brand-blue/5 text-brand-blue text-[11px] font-black uppercase tracking-[0.2em] mb-10 border border-brand-blue/10"
                >
                  <Award size={14} />
                  Excelência em Impacto Social
                </motion.div>
                
                <div className="overflow-hidden mb-8">
                  <motion.h2 
                    variants={{
                      hidden: { y: "100%" },
                      visible: { y: 0, transition: { duration: 2, ease: [0.16, 1, 0.3, 1] } }
                    }}
                    className="text-5xl sm:text-6xl lg:text-7xl font-display font-black tracking-tighter text-slate-900 leading-tight"
                  >
                    O Futuro <motion.span 
                      initial={{ color: "#0f172a" }}
                      animate={{ color: "#6A1B9A" }}
                      transition={{ delay: 2.5, duration: 2 }}
                      className="relative inline-block"
                    >
                      Acontece
                      <motion.span 
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 3.5, duration: 1.5 }}
                        className="absolute -bottom-2 left-0 right-0 h-2 bg-[#6A1B9A]/20 origin-left rounded-full"
                      />
                    </motion.span> Aqui.
                  </motion.h2>
                </div>
                
                <motion.p 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                  }}
                  className="text-lg text-slate-600 mb-10 leading-relaxed max-w-xl font-medium italic"
                >
                  A CACI articula redes de cuidado e promove justiça social desde 2003. 
                  Sua jornada de impacto começa aqui, conectando quem precisa a quem pode ajudar.
                </motion.p>
                
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                  }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Button 
                    variant="primary" 
                    className="px-12 py-6 text-base group shadow-2xl shadow-brand-blue/40 hover:scale-105 active:scale-95 transition-transform"
                    onClick={() => navigate('/ecossistema/diagnostico')}
                  >
                    Iniciar Jornada
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    variant="primary" 
                    className="px-12 py-6 text-base bg-brand-blue hover:bg-brand-blue/90 shadow-2xl shadow-brand-blue/20 hover:scale-105 active:scale-95 transition-transform"
                    onClick={() => setOuvidoriaModalOpen(true)}
                  >
                    Ouvidoria
                  </Button>
                  <Button 
                    variant="outline" 
                    className="px-12 py-6 text-base border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white hover:scale-105 active:scale-95 transition-all"
                    onClick={() => setHistoriaModalOpen(true)}
                  >
                    Nossa História
                  </Button>
                </motion.div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                {/* Carousel Container */}
                <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[60px] overflow-hidden shadow-[0_60px_100px_-20px_rgba(0,0,0,0.15)] border-[16px] border-white bg-slate-100">
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={currentImageIndex}
                      initial={{ opacity: 0, scale: 1.15 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                      src={heroImages[currentImageIndex]} 
                      alt={`Impacto CACI ${currentImageIndex + 1}`} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

                  {/* Carousel Controls */}
                  <div className="absolute bottom-12 left-12 right-12 flex items-center justify-between">
                    <div className="flex gap-3">
                      {heroImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`h-2 rounded-full transition-all duration-700 ${
                            idx === currentImageIndex ? 'w-12 bg-white' : 'w-3 bg-white/30 hover:bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-white/90 text-[11px] font-black tracking-[0.2em] uppercase">
                      {String(currentImageIndex + 1).padStart(2, '0')} / {String(heroImages.length).padStart(2, '0')}
                    </div>
                  </div>
                </div>

                {/* Floating Stats Card */}
                <motion.div 
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                  whileHover={{ scale: 1.05, x: -10 }}
                  onClick={() => window.open('https://www.paypal.com/fundraiser/charity/4445197', '_blank')}
                  className="absolute -bottom-12 -left-12 bg-white p-10 rounded-[40px] shadow-2xl border border-slate-50 max-w-[320px] hidden xl:block cursor-pointer group transition-all"
                >
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald group-hover:scale-110 transition-transform">
                      <Heart size={28} />
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900 group-hover:text-brand-emerald transition-colors">Doe Agora</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sua ajuda é vital</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed italic font-medium">
                    "O trabalho da CACI é um farol de esperança para milhares de famílias em situação de vulnerabilidade."
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Apoia Brasil Section - NEW */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="container-custom">
            <div className="bg-[#6A1B9A]/70 rounded-[60px] p-12 lg:p-20 relative overflow-hidden shadow-3xl">
              <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-blue/10 skew-x-[-15deg] translate-x-1/2" />
              <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/20 text-brand-gold text-[10px] font-black uppercase tracking-widest border border-brand-gold/10">
                    <Heart size={14} />
                    Ativo Institucional
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-display font-black text-white tracking-tighter leading-tight">
                    Apoia Brasil: <span className="text-brand-blue">Conectando Causas a Corações.</span>
                  </h2>
                  <p className="text-white/70 text-lg font-medium leading-relaxed">
                    Nossa plataforma de crowdfunding e rifas solidárias agora é pública. 
                    Apoie projetos verificados, participe de rifas e ajude a transformar realidades em todo o Brasil.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-4">
                    <Button 
                      variant="primary" 
                      className="px-10 py-5 text-sm group"
                      onClick={() => navigate('/apoia-brasil')}
                    >
                      Conhecer Plataforma
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <button 
                      onClick={() => navigate('/apoia-brasil')}
                      className="px-10 py-5 rounded-full text-sm font-black uppercase tracking-widest text-white border-2 border-white/20 hover:bg-white hover:text-slate-900 transition-all"
                    >
                      Sou uma ONG
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {[
                    { label: 'Campanhas Ativas', value: apoiaStats.activeCampaigns, icon: <Users size={24} />, suffix: '+' },
                    { label: 'Rifas Solidárias', value: apoiaStats.solidarityRaffles, icon: <Ticket size={24} />, suffix: '+' },
                    { label: 'Impacto Gerado', value: apoiaStats.generatedImpact, icon: <DollarSign size={24} />, prefix: 'R$ ', suffix: '+' },
                    { label: 'ONGs Parceiras', value: apoiaStats.partnerONGs, icon: <Heart size={24} />, suffix: '+' },
                    { label: 'Ganhadores Felizes', value: apoiaStats.winners, icon: <Award size={24} />, suffix: '+' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[32px] space-y-4 hover:bg-white/10 transition-all">
                      <div className="text-brand-blue">{stat.icon}</div>
                      <div>
                        <div className="text-2xl font-black text-white">
                          <Counter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} className="font-black text-white text-2xl" />
                        </div>
                        <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Impacto Institucional Section */}
        <Section id="impacto-institucional" title="Impacto Institucional" subtitle="Dados reais que orientam nossa estratégia e fortalecem o ecossistema social.">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { label: 'Anos de Legado', value: impactStats.anosLegado, suffix: '+', icon: Award, color: 'text-brand-blue', bg: 'bg-brand-blue/5', pad: true },
              { label: 'Transparência', value: impactStats.transparencia, suffix: '%', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', pad: true },
              { label: 'OSCs na Rede', value: impactStats.oscsRede, suffix: '+', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', pad: true },
              { label: 'Participação', value: impactStats.participacao, suffix: '+', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', pad: true },
              { label: 'Diagnósticos', value: impactStats.diagnosticos, suffix: '+', icon: ClipboardCheck, color: 'text-blue-600', bg: 'bg-blue-50', pad: true },
              { label: 'Propostas', value: impactStats.propostas, prefix: '+', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50', pad: true },
              { label: 'Total Avaliações', value: impactStats.totalEvaluations, suffix: '+', icon: Star, color: 'text-brand-gold', bg: 'bg-brand-gold/5', pad: true },
              { label: 'Média Geral', value: impactStats.avgEvaluation.toFixed(1), suffix: '/5', icon: Star, color: 'text-brand-blue', bg: 'bg-brand-blue/5', pad: false },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-center group"
              >
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  <stat.icon size={24} />
                </div>
                <div className="text-3xl font-display font-black text-slate-900 mb-2">
                  <Counter 
                    target={stat.value} 
                    suffix={stat.suffix} 
                    prefix={stat.prefix} 
                    padZeros={stat.pad}
                  />
                </div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">{stat.label}</div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-16 p-10 rounded-[50px] bg-[#6A1B9A] text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-black mb-4">Inteligência de Dados CACI</h3>
                <p className="text-purple-100 leading-relaxed italic">
                  "Transformamos dados reais em decisões automáticas. Nossa plataforma prioriza, segmenta e orienta a captação de recursos com base na maturidade real de cada organização, incluindo a própria CACI como usuária ativa do ecossistema."
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="px-6 py-4 rounded-3xl bg-white/5 border border-white/10 flex-1 min-w-[200px]">
                  <div className="text-[10px] font-black text-brand-gold uppercase tracking-widest mb-2">Priorização</div>
                  <div className="text-sm font-bold">Automática por Maturidade</div>
                </div>
                <div className="px-6 py-4 rounded-3xl bg-white/5 border border-white/10 flex-1 min-w-[200px]">
                  <div className="text-[10px] font-black text-brand-emerald uppercase tracking-widest mb-2">Segmentação</div>
                  <div className="text-sm font-bold">Estratégica por Impacto</div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Quem Somos - Redesigned Bento Grid */}
        <Section 
          id="quem-somos" 
          index={1}
          title={<>Compromisso com a <span className="text-brand-emerald">Vida</span> e a Cidadania.</>}
          subtitle="Plataforma institucional voltada ao diagnóstico e desenvolvimento de OSCs, baseada em responsabilidade social e impacto auditável."
        >
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="p-10 rounded-[40px] bg-brand-blue text-white shadow-2xl shadow-brand-blue/20 flex flex-col justify-between">
                <div>
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-display font-black mb-4">2003</div>
                  <div className="text-sm font-black uppercase tracking-widest text-white/70">Ano de Fundação</div>
                </div>
                <p className="mt-6 text-white font-medium leading-relaxed">
                  Nascemos da necessidade de criar pontes sólidas entre a vulnerabilidade e a dignidade humana.
                </p>
              </div>
              <div className="p-10 rounded-[40px] bg-[#6A1B9A] text-white shadow-2xl shadow-purple-900/20 flex flex-col justify-between">
                <div>
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-display font-black mb-4">OSC</div>
                  <div className="text-sm font-black uppercase tracking-widest text-white/70">Natureza Jurídica</div>
                </div>
                <p className="mt-6 text-purple-200 font-medium leading-relaxed">
                  Organização da Sociedade Civil dedicada ao fortalecimento das políticas públicas.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Missão', iconColor: 'text-brand-blue', icon: <Award size={18} />, text: 'Promover assistência social direta, acesso a direitos e melhoria de vida por acolhimento, formação e articulação em redes.' },
                { title: 'Visão', iconColor: 'text-brand-emerald', icon: <Globe size={18} />, text: 'Ser referência nacional em inovação social e fortalecimento da cidadania, orientando paz, democracia e participação cidadã.' },
                { title: 'Valores', iconColor: 'text-brand-gold-dark', icon: <ShieldCheck size={18} />, text: 'Dignidade, empatia, ética, humanidade, resiliência, solidariedade, compromisso, sustentabilidade e participação cidadã.' },
                { title: 'História', iconColor: 'text-slate-900', icon: <Calendar size={18} />, text: 'Mais de duas décadas de atuação ininterrupta, construindo pontes entre a vulnerabilidade e a oportunidade.' },
                { title: 'Propostas à Financiadores', iconColor: 'text-brand-blue', icon: <FileText size={18} />, text: 'Acesse as últimas propostas de financiamento e projetos submetidos pela CACI.' },
              ].map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => {
                    if (item.title === 'Propostas à Financiadores') {
                      setFundingProposalsModalOpen(true);
                    } else {
                      setActiveQuemSomosTab(idx);
                      setQuemSomosModalOpen(true);
                    }
                  }}
                  className="px-8 py-5 rounded-[40px] font-black text-[10px] uppercase tracking-widest text-left transition-all flex items-center justify-between group border bg-white border-slate-200 text-slate-500 hover:border-brand-blue hover:text-brand-blue hover:shadow-xl hover:shadow-slate-200/50"
                >
                  <span className="flex items-center gap-3">
                    <div className={`${item.iconColor}`}>
                      {item.icon}
                    </div>
                    {item.title}
                  </span>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Atalhos - Redesigned for Premium Feel */}
        <section className="py-24 bg-sequential-2">
          <div className="container-custom">
            <div className="grid sm:grid-cols-2 gap-8">
              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all flex flex-col items-center text-center gap-6 group cursor-pointer"
                onClick={() => setHubModalOpen(true)}
              >
                <div className="w-20 h-20 rounded-3xl bg-brand-blue/5 flex items-center justify-center text-brand-blue group-hover:scale-110 transition-transform shadow-inner">
                  <BookOpen size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Hub de Conhecimento</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Acesse matérias, orientações de saúde e guias de cidadania.</p>
                </div>
                <div className="mt-auto flex items-center gap-2 text-[10px] font-black text-brand-blue uppercase tracking-widest">
                  <span>Acessar Hub</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all flex flex-col items-center text-center gap-6 group cursor-pointer"
                onClick={() => {
                  const irSection = document.getElementById('ir');
                  if (irSection) irSection.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div className="w-20 h-20 rounded-3xl bg-brand-gold/5 flex items-center justify-center text-brand-gold-dark group-hover:scale-110 transition-transform shadow-inner">
                  <Heart size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Destinação do IR</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Transforme seu imposto em impacto social sem custos.</p>
                </div>
                <div className="mt-auto flex items-center gap-2 text-[10px] font-black text-brand-gold-dark uppercase tracking-widest">
                  <span>Saiba Mais</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Programas - Redesigned for International Standard */}
        <Section 
          id="programas" 
          index={0}
          title={<>Programas que <span className="text-brand-gold">Inspiram</span> Mudança.</>}
          subtitle="Conheça as áreas de atuação da CACI e os programas que promovem inclusão, sustentabilidade e desenvolvimento humano."
        >
          <div className="flex flex-col gap-12 items-start">
            <div className="w-full flex flex-row flex-wrap gap-4 mb-8">
              {[
                { id: 'edu', label: 'Educação & Empregabilidade', icon: <GraduationCap size={18} /> },
                { id: 'socio', label: 'Socioambiental & Cultural', icon: <Leaf size={18} /> },
                { id: 'apoio', label: 'Como Apoiar', icon: <Heart size={18} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-8 py-5 rounded-[40px] font-black text-[10px] uppercase tracking-widest text-left transition-all flex items-center justify-between group border flex-1 min-w-[280px] ${
                    activeTab === tab.id 
                      ? 'bg-brand-blue border-brand-blue text-white shadow-xl shadow-brand-blue/20' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-brand-blue hover:text-brand-blue'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {tab.icon}
                    {tab.label}
                  </span>
                  <ChevronRight size={14} className={`transition-transform ${activeTab === tab.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
              ))}
            </div>
            
            <div className="w-full">
              <AnimatePresence>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-[40px] p-8 sm:p-12 border border-slate-200 shadow-xl shadow-slate-200/50 min-h-[500px]"
                >
                  {activeTab === 'edu' && (
                    <div className="space-y-10">
                      <div className="max-w-2xl">
                        <h3 className="text-2xl font-black text-slate-900 mb-4">Educação & Empregabilidade</h3>
                        <p className="text-slate-600 text-sm leading-relaxed font-medium">
                          Focamos na integração prática, formação e tutoria para preparar jovens e adultos para o mundo do trabalho.
                        </p>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        {[
                          { title: 'Programa de Estágio', desc: 'Integração prática com formação e tutoria.', icon: <BookOpen size={20} /> },
                          { title: 'Programa Jovem Aprendiz', desc: 'Primeiras experiências no mundo do trabalho.', icon: <Users size={20} /> },
                          { title: 'Serviço Voluntário', desc: 'Participe com suas habilidades.', icon: <Heart size={20} /> },
                          { title: 'CACI Produtivamente', desc: 'Acesso via Intranet.', icon: <FileText size={20} />, intranet: true },
                          { title: 'Gestão de Carreira', desc: 'Acesso via Intranet.', icon: <BarChart3 size={20} />, intranet: true },
                        ].map((item, i) => (
                          <div key={i} className="p-6 rounded-[40px] bg-slate-50 border border-slate-100 hover:border-brand-blue transition-all group">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-blue group-hover:scale-110 transition-transform">
                                {item.icon}
                              </div>
                              <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest">{item.title}</h4>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed mb-4">{item.desc}</p>
                            <button 
                              onClick={() => navigate('/intranet')}
                              className="text-[10px] font-black text-brand-blue uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
                            >
                              {item.intranet ? 'Abrir Intranet' : 'Ver detalhes'}
                              {item.intranet && <span className="bg-brand-blue/10 text-brand-blue text-[8px] px-1.5 py-0.5 rounded-full">2FA</span>}
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'socio' && (
                    <div className="space-y-10">
                      <div className="max-w-2xl">
                        <h3 className="text-2xl font-black text-slate-900 mb-4">Socioambiental & Cultural</h3>
                        <p className="text-slate-600 text-sm leading-relaxed font-medium">
                          Projetos voltados à identidade, pertencimento, sustentabilidade e fortalecimento da gestão social.
                        </p>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        {[
                          { title: 'Clube de Leitura', desc: 'Leitura como ponte para cidadania.', icon: <BookOpen size={20} /> },
                          { title: 'Cultura e Arte Afro', desc: 'Identidade e pertencimento.', icon: <Award size={20} /> },
                          { title: 'De ONG para ONG', desc: 'Troca de práticas e fortalecimento da gestão.', icon: <RefreshCw size={20} /> },
                          { title: 'Educação Inclusiva', desc: 'Planos de inclusão, formações e consultorias.', icon: <GraduationCap size={20} />, location: 'SJC' },
                          { title: 'Luz na Comunidade', desc: 'Infraestrutura e bem-estar local.', icon: <Zap size={20} /> },
                          { title: 'Recanto das Artes', desc: 'Economia criativa e inclusão produtiva.', icon: <Palette size={20} /> },
                          { title: 'Revitalização de Nascentes', desc: 'Recuperação e educação ambiental.', icon: <Leaf size={20} /> },
                        ].map((item, i) => (
                          <div key={i} className="p-6 rounded-[40px] bg-slate-50 border border-slate-100 hover:border-brand-emerald transition-all group">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-emerald group-hover:scale-110 transition-transform">
                                {item.icon}
                              </div>
                              <div>
                                <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest">{item.title}</h4>
                                {item.location && <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">— {item.location}</span>}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed mb-4">{item.desc}</p>
                            <button className="text-[10px] font-black text-brand-emerald uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                              Ver detalhes
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'apoio' && (
                    <div className="space-y-10">
                      <div className="max-w-2xl">
                        <h3 className="text-2xl font-black text-slate-900 mb-4">Como Apoiar</h3>
                        <p className="text-slate-600 text-sm leading-relaxed font-medium">
                          Sua ajuda é fundamental para mantermos nossos projetos ativos. Escolha a melhor forma de contribuir.
                        </p>
                      </div>
                      
                      <div className="grid sm:grid-cols-3 gap-6">
                        <div className="p-8 rounded-[40px] bg-brand-blue/5 border border-brand-blue/10 flex flex-col items-center text-center">
                          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-brand-blue mb-6">
                            <Heart size={28} />
                          </div>
                          <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-4">Doação Financeira</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed mb-6">Contribua diretamente através do PayPal para apoiar nossas causas urgentes.</p>
                          <a 
                            href="https://www.paypal.com/fundraiser/charity/4445197" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue-dark transition-all shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2"
                          >
                            PayPal
                            <ExternalLink size={14} />
                          </a>
                        </div>

                        <div className="p-8 rounded-[40px] bg-slate-900 text-white flex flex-col items-center text-center">
                          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-6">
                            <QrCode size={28} />
                          </div>
                          <h4 className="font-black uppercase text-[10px] tracking-widest mb-4">Doação via PIX</h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed mb-6">Use nossa chave CNPJ para doações instantâneas e seguras.</p>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText('05.639.031/0001-00');
                              alert('Chave PIX copiada!');
                            }}
                            className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-lg flex items-center justify-center gap-2"
                          >
                            Copiar Chave PIX
                          </button>
                        </div>

                        <div className="p-8 rounded-[40px] bg-brand-emerald/5 border border-brand-emerald/10 flex flex-col items-center text-center">
                          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-brand-emerald mb-6">
                            <ShieldCheck size={28} />
                          </div>
                          <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-4">Seja um Doador</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed mb-6">Destine parte do seu Imposto de Renda para a CACI sem custos adicionais.</p>
                          <button 
                            onClick={() => {
                              setActiveIRTab(0);
                              setIrModalOpen(true);
                            }}
                            className="w-full py-4 bg-brand-emerald text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-emerald-dark transition-all shadow-lg shadow-brand-emerald/20 flex items-center justify-center gap-2"
                          >
                            Saiba como Destinar
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Section>

        {/* Área do Usuário/Beneficiário */}
        <Section 
          id="usuario-beneficiario" 
          index={1}
          title={<>Área do <span className="text-brand-blue">Usuário</span> e Beneficiário.</>}
          subtitle="Acesse os formulários de interesse e cadastro institucional. A CACI promove a inclusão e o fortalecimento da cidadania através de seus programas sociais."
        >
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Button 
              variant="primary" 
              className="px-16 py-8 text-lg rounded-[40px] shadow-2xl shadow-brand-blue/30 hover:scale-105 transition-transform flex items-center gap-4"
              onClick={() => setBeneficiaryModalOpen(true)}
            >
              <UserPlus size={24} />
              Acessar Formulários de Cadastro
            </Button>
            <Button 
              variant="gold" 
              className="px-16 py-8 text-lg rounded-[40px] shadow-2xl shadow-brand-gold/20 hover:scale-105 transition-transform flex items-center gap-4"
              onClick={() => setEvaluationModalOpen(true)}
            >
              <Star size={24} />
              AVALIAR O ECOSSISTEMA CACI
            </Button>
          </div>
        </Section>

        {/* Transparência */}
        <Section 
          id="transparencia" 
          index={2}
          title={<>Transparência e <span className="text-brand-blue">Integridade</span>.</>}
          subtitle="A CACI preza pela clareza em todas as suas ações. Aqui você encontra nossos relatórios de atividades, certificações e documentos institucionais."
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Relatório Anual 2024', type: 'PDF • 4.2MB', icon: <FileText size={18} /> },
                { title: 'Estatuto Social', type: 'PDF • 1.1MB', icon: <ShieldCheck size={18} /> },
                { title: 'Certificações', type: 'PDF • 0.8MB', icon: <Award size={18} /> },
                { title: 'Balanço Patrimonial', type: 'PDF • 2.5MB', icon: <BarChart3 size={18} /> },
              ].map((doc, i) => (
                <button 
                  key={i}
                  className="px-8 py-5 rounded-[40px] font-black text-[10px] uppercase tracking-widest text-left transition-all flex items-center justify-between group border bg-white border-slate-200 text-slate-500 hover:border-brand-blue hover:text-brand-blue hover:shadow-xl hover:shadow-slate-200/50"
                >
                <span className="flex items-center gap-3">
                  <div className="text-brand-blue">
                    {doc.icon}
                  </div>
                  {doc.title}
                </span>
                <Download size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            ))}
          </div>
        </Section>

        {/* Destinação do Imposto de Renda Section */}
        <Section 
          id="ir" 
          index={2}
          title={<>Destinação do <span className="text-brand-emerald">Imposto de Renda</span>.</>}
          subtitle="Transforme seu imposto em impacto social sem custos adicionais. Escolha onde seu investimento será aplicado."
        >
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'O que é?', icon: <BookOpen size={18} /> },
                { label: 'Quem pode?', icon: <Users size={18} /> },
                { label: 'Pessoa Física (PF)', icon: <ShieldCheck size={18} /> },
                { label: 'Pessoa Jurídica (PJ)', icon: <ShieldCheck size={18} /> },
                { label: 'Passo a Passo', icon: <ChevronRight size={18} /> },
                { label: 'Por que CACI?', icon: <Heart size={18} /> },
              ].map((tab, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveIRTab(i);
                    setIrModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 p-6 rounded-[40px] font-black text-[10px] uppercase tracking-widest transition-all duration-300 border bg-white text-slate-500 border-slate-200 hover:border-brand-blue hover:text-brand-blue hover:shadow-xl hover:shadow-slate-200/50"
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Parcerias Estratégicas Section */}
        <Section 
          id="parcerias-estrategicas" 
          index={3}
          title={<>Parcerias <span className="text-brand-blue">Estratégicas</span>.</>}
          subtitle={<i>Fortalecendo nossa rede através de colaborações sólidas e tecnológicas.</i>}
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {[
                { 
                  name: 'MLabs', 
                  url: 'https://accounts.mlabs.io/accounts/sign_in?access_token=true', 
                  since: '2024',
                  logo: 'https://www.mlabs.com.br/wp-content/uploads/2021/05/logo-mlabs-colorido.png'
                },
                { 
                  name: 'J.Nobre', 
                  url: 'https://www.facebook.com/j.nobre.com.br', 
                  since: '2014',
                  logo: 'https://picsum.photos/seed/jnobre/200/200'
                },
                { 
                  name: 'Google Workspace', 
                  url: 'https://www.google.com/intl/pt-BR/nonprofits/offerings/workspace/', 
                  since: '2021',
                  logo: 'https://www.gstatic.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png'
                },
                { 
                  name: 'Microsoft', 
                  url: 'https://www.microsoft.com/pt-br/nonprofits/offers-for-nonprofits', 
                  since: '2021',
                  logo: 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31'
                },
                { 
                  name: 'TechSoupBrasil', 
                  url: 'https://www.techsoupbrasil.org.br/', 
                  since: '2021',
                  logo: 'https://www.techsoupbrasil.org.br/sites/default/files/techsoup_brasil_logo.png'
                },
              ].map((partner, i) => (
                <a
                  key={i}
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-4 p-8 rounded-[40px] transition-all duration-300 border bg-white border-slate-100 hover:border-brand-blue hover:shadow-2xl group"
                >
                  <div className="w-24 h-24 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all">
                    <img 
                      src={partner.logo} 
                      alt={partner.name} 
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-1">{partner.name}</p>
                    <p className="text-[9px] text-slate-400 italic">Desde {partner.since}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </Section>

      </main>

      {/* Footer - Redesigned for International Standard */}
        <footer className="bg-[#6A1B9A] text-white pt-16 pb-16">
          <div className="container-custom">
            <div className="grid lg:grid-cols-12 gap-10 mb-12">
              <div className="lg:col-span-5">
                <div className="flex items-center gap-5 mb-10">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
                    <img src="https://ais-pre-qvipanm3ysdp4ln6k5eqfh-308119493736.us-west2.run.app/Logo_CACI_2026+.SVG.png" alt="Logo CACI" className="w-full h-full object-contain p-1.5" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-display font-black tracking-tighter leading-none">CACI<span className="text-brand-gold">.</span></h1>
                    <p className="text-[9px] font-black text-purple-200 uppercase tracking-[0.3em] mt-1">Casa de Apoio ao Cidadão</p>
                  </div>
                </div>
                <p className="text-purple-100 text-lg leading-relaxed max-w-md mb-12 font-medium italic">
                  CACI Promovendo inclusão, capacitação e dignidade humana desde 2003 através de governança integrada e gestão responsável.
                </p>
                <div className="flex gap-4">
                  {[
                    { icon: Facebook, label: 'Facebook', href: 'https://www.facebook.com/cacicasadeapoioaocidado/' },
                    { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/cacibr_casadeapoioaocidado/' },
                    { icon: Music, label: 'TikTok', href: 'https://www.tiktok.com/@caci.cidadao' },
                    { icon: Youtube, label: 'YouTube', href: 'https://www.youtube.com/@caci-casadeapoioaocidado6764/' },
                    { icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/company/caci-casa-de-apoio-ao-cidadao/' }
                  ].map((social, i) => (
                    <a 
                      key={social.label} 
                      href={social.href} 
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-brand-blue hover:scale-110 transition-all border border-white/5"
                    >
                      <social.icon size={18} />
                    </a>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Plataforma</h4>
                <ul className="space-y-2 text-slate-300 font-black text-[10px] uppercase tracking-widest">
                  {navLinks.map(link => (
                    <li key={link.name}>
                      <a href={link.href} className="hover:text-brand-blue transition-colors flex items-center gap-2 group">
                        <div className="w-1 h-1 rounded-full bg-brand-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-5">
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-8">Conecte-se</h4>
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <Mail size={20} className="text-brand-blue mt-1" />
                      <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">E-mail</div>
                        <a href="mailto:contato@caci.ong.br" className="text-sm font-black hover:text-brand-blue transition-colors">contato@caci.ong.br</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Phone size={20} className="text-brand-blue mt-1" />
                      <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">WhatsApp</div>
                        <a 
                          href="https://wa.me/5511940603881" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-black hover:text-brand-blue transition-colors"
                        >
                          (11) 94060-3881
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <MapPin size={20} className="text-brand-blue mt-1" />
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Sede Administrativa</div>
                      <div className="text-sm font-black leading-relaxed">
                        São Paulo, SP - Brasil
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-6 rounded-[24px] bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Acesso Restrito</div>
                    <div className="text-sm font-black text-brand-gold">Portal do Colaborador</div>
                  </div>
                  <Link to="/intranet">
                    <Button variant="white" className="px-6 py-3 text-[10px] flex items-center gap-2">
                      <Lock size={14} />
                      Acessar Intranet
                      <span className="bg-brand-blue/10 text-brand-blue text-[8px] px-1.5 py-0.5 rounded-full">2FA</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <p className="text-purple-200 text-[11px] font-black uppercase tracking-widest text-center md:text-left">
                  © 2003 - {new Date().getFullYear()} CACI - Casa de Apoio ao Cidadão. <br className="sm:hidden" />
                  CNPJ: 05.639.031/0001-00 • Todos os direitos reservados.
                </p>
                <a 
                  href="https://mapaosc.ipea.gov.br/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="opacity-50 hover:opacity-100 transition-opacity"
                >
                  <img src="https://mapaosc.ipea.gov.br/images/selo-mapa-osc.png" alt="Selo Mapa das OSCs" className="h-8" referrerPolicy="no-referrer" />
                </a>
              </div>
              <div className="flex gap-10 text-slate-500 text-[11px] font-black uppercase tracking-widest">
                <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                <a href="#" className="hover:text-white transition-colors">Termos</a>
                <a href="#" className="hover:text-white transition-colors">Cookies</a>
              </div>
            </div>
          </div>
        </footer>

        {/* Back to Top */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: window.scrollY > 500 ? 1 : 0, scale: window.scrollY > 500 ? 1 : 0 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-10 right-10 w-16 h-16 bg-brand-blue text-white rounded-2xl shadow-2xl shadow-brand-blue/40 flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all"
        >
          <ChevronUp size={32} />
        </motion.button>

      {/* Modals */}
      <Modal 
        isOpen={hubModalOpen} 
        onClose={() => setHubModalOpen(false)} 
        title="Hub de Conhecimento — CACI"
      >
        <div className="space-y-16">
          {/* Image Carousel - New Section */}
          <section>
            <div className="relative aspect-video rounded-[40px] overflow-hidden shadow-2xl border-[8px] border-white bg-slate-100">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={hubImageIndex}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  src={hubImages[hubImageIndex]} 
                  alt={`Hub de Conhecimento ${hubImageIndex + 1}`} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

              {/* Carousel Controls */}
              <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
                <div className="flex gap-2">
                  {hubImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setHubImageIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        idx === hubImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-white/90 text-[10px] font-black tracking-[0.2em] uppercase">
                  {String(hubImageIndex + 1).padStart(2, '0')} / {String(hubImages.length).padStart(2, '0')}
                </div>
              </div>
            </div>
          </section>

          {/* Telefones Úteis e Links */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Phone size={24} className="text-brand-blue" />
              <h4 className="text-xl font-black text-slate-900">Telefones Úteis e Links Oficiais</h4>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { num: '190', label: 'Polícia Militar' },
                { num: '181', label: 'Disque Denúncia' },
                { num: '196', label: 'Saúde / Vigilância' },
              ].map((tel, i) => (
                <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                  <div className="text-2xl font-black text-brand-blue mb-1">{tel.num}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tel.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { name: 'Ministério da Saúde', url: 'https://www.gov.br/saude/pt-br' },
                { name: 'Ministério da Justiça', url: 'https://www.gov.br/mj/pt-br' },
                { name: 'Secretaria de Assistência Social', url: 'https://www.prefeitura.sp.gov.br/cidade/secretarias/assistencia_social/' },
                { name: 'Governo Federal', url: 'https://www.gov.br/pt-br' }
              ].map((link, i) => (
                <a 
                  key={i} 
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </section>

          {/* Hub de Conteúdo */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <BookOpen size={24} className="text-brand-blue" />
              <h4 className="text-xl font-black text-slate-900">Hub de Conteúdo — Matérias e Entrevistas</h4>
            </div>
            <div className="grid sm:grid-cols-2 gap-8">
              {[
                { title: 'CACI: Duas Décadas de Transformação Social', author: 'Valdomiro Santana Jardim', text: 'A Casa de Apoio ao Cidadão (CACI) nasceu em abril de 2003, fruto da experiência prévia de seu fundador...' },
                { title: 'Da Seleção de Editais ao Impacto Social: O Modelo CACI', author: 'Valdomiro Santana Jardim', text: 'Com uma ampla rede de contatos, a CACI recebe constantemente indicações de editais. A técnica desenvolvida envolve filtragem estratégica...' },
                { title: 'Transparência e Sustentabilidade: Os Pilares da CACI', author: 'Valdomiro Santana Jardim', text: 'Para a CACI, transparência não é apenas obrigação legal, mas um valor institucional. O site oficial é uma vitrine para prestação de contas...' },
                { title: 'Gestão Estratégica e Parcerias de Valor', author: 'Secretário da CACI', text: 'A gestão eficiente é um dos pilares para que a CACI continue entregando impacto social. O papel da secretaria envolve visão estratégica e operacional.' },
                { title: 'CACI e o Fortalecimento do Terceiro Setor', author: 'Secretário da CACI', text: 'Como a CACI atua como um hub de fortalecimento para outras OSCs, compartilhando conhecimento e metodologias de gestão.' },
                { title: 'Educação Inclusiva: Transformando a Realidade Escolar', author: 'Enfermeira', text: 'Relato sobre a implementação de projetos de educação inclusiva em São José dos Campos e os desafios superados.' },
                { title: 'Formação de Educadores: O Eixo Central da Inclusão', author: 'Enfermeira', text: 'A importância da capacitação contínua para profissionais que atuam na ponta do atendimento inclusivo.' },
                { title: 'Educação Inclusiva em Números: Resultados e Impactos', author: 'Equipe CACI', text: '21 escolas municipais atendidas, 222 profissionais capacitados, 365 estudantes acompanhados e 200 horas de formação.', hasMap: true },
              ].map((item, i) => (
                <Card 
                  key={i} 
                  padding={false} 
                  className="flex flex-col group cursor-pointer"
                  onClick={() => item.hasMap && setMapModalOpen(true)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <HubCardCarousel cardIndex={i} title={item.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none" />
                    {item.hasMap && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-brand-emerald text-white text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 shadow-lg z-30">
                        <MapPin size={10} />
                        Mapa Disponível
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h4 className="font-black text-slate-900 mb-2 leading-tight">{item.title}</h4>
                    <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-4">Entrevistado: {item.author}</p>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{item.text}</p>
                    {item.hasMap && (
                      <div className="mt-6 pt-6 border-t border-slate-100">
                        <Button 
                          variant="emerald" 
                          className="w-full py-3 text-[10px]"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            setMapModalOpen(true);
                          }}
                        >
                          <MapPin size={14} />
                          Ver Mapa de Impacto
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-10 p-8 rounded-[40px] bg-slate-900 text-white">
              <div className="flex items-center gap-4 mb-4">
                <Calendar size={24} className="text-brand-gold" />
                <h5 className="text-lg font-black">📅 Grade Completa de Conteúdo (Jan/2023 a Ago/2025)</h5>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">Lista de pautas jornalísticas e informativas conforme line-up institucional da ONG CACI.</p>
            </div>
          </section>

          {/* Utilidade Pública - Saúde */}
          <section className="p-10 rounded-[50px] bg-brand-emerald/5 border border-brand-emerald/10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-brand-emerald text-white flex items-center justify-center shadow-lg shadow-brand-emerald/20">
                <Heart size={24} />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">Saúde Pública — Orientações de Saúde</h4>
                <p className="text-sm text-slate-500 font-medium">Gripes, Resfriados e SARS no Brasil: Um Panorama Completo</p>
              </div>
            </div>

            <div className="space-y-10">
              <div className="grid sm:grid-cols-3 gap-6">
                {[
                  { title: 'Resfriado Comum', desc: 'Causado por rinovírus, afeta vias aéreas superiores (nariz/garganta). Sintomas leves.', color: 'border-brand-blue' },
                  { title: 'Gripe (Influenza)', desc: 'Causada por vírus Influenza A e B. Afeta vias aéreas superiores e inferiores. Pode ser grave.', color: 'border-brand-emerald' },
                  { title: 'SARS (Síndrome Respiratória Aguda Grave)', desc: 'Manifestação grave de infecções respiratórias (ex: COVID-19 grave). Exige suporte intensivo.', color: 'border-red-500' },
                ].map((item, i) => (
                  <div key={i} className={`p-6 rounded-3xl bg-white border-l-4 ${item.color} shadow-sm`}>
                    <h5 className="font-black text-slate-900 mb-2">{item.title}</h5>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-bottom border-slate-200">
                      <th className="p-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Sintoma</th>
                      <th className="p-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Resfriado</th>
                      <th className="p-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Gripe</th>
                      <th className="p-4 font-black uppercase text-[10px] tracking-widest text-slate-400">SARS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { s: 'Febre', r: 'Rara ou baixa', g: 'Comum, alta (>38°C)', sa: 'Alta, súbita, persistente' },
                      { s: 'Tosse', r: 'Leve a moderada', g: 'Seca, persistente', sa: 'Seca, intensa, progressiva' },
                      { s: 'Coriza', r: 'Comum', g: 'Menos comum', sa: 'Rara ou leve' },
                      { s: 'Fadiga', r: 'Leve', g: 'Comum, intensa', sa: 'Intensa, exaustão' },
                      { s: 'Dificuldade Respiratória', r: 'Ausente', g: 'Rara', sa: 'Comum e progressiva' },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td className="p-4 font-bold text-slate-900">{row.s}</td>
                        <td className="p-4 text-slate-500">{row.r}</td>
                        <td className="p-4 text-slate-500">{row.g}</td>
                        <td className="p-4 text-red-600 font-bold">{row.sa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-8 rounded-[32px] bg-red-50 border border-red-100">
                <h5 className="text-red-900 font-black mb-4 flex items-center gap-2">
                  <ShieldCheck size={20} />
                  Periculosidade da Automedicação
                </h5>
                <p className="text-red-800 text-sm leading-relaxed">
                  A automedicação é extremamente perigosa. Ela mascara a gravidade real da doença, contribui para a resistência a antibióticos e pode causar toxicidade. <strong>NÃO use antibióticos para vírus.</strong> Procure sempre um profissional de saúde!
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h5 className="font-black text-slate-900 uppercase text-xs tracking-widest">Recomendações CACI</h5>
                  <ul className="space-y-3">
                    {['Não se automedique', 'Vacine-se contra Gripe e COVID', 'Lave as mãos frequentemente', 'Busque auxílio profissional se os sintomas piorarem'].map((rec, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col justify-center">
                  <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest mb-2">Atenção</p>
                  <p className="text-xs text-slate-400 leading-relaxed italic">Este conteúdo tem caráter informativo. Para casos emergenciais, entre em contato direto com os órgãos oficiais de segurança ou saúde.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Cidadania e Prevenção */}
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="p-10 rounded-[50px] bg-brand-blue/5 border border-brand-blue/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-lg shadow-brand-blue/20">
                  <Users size={24} />
                </div>
                <h4 className="text-xl font-black text-slate-900">Cidadania: Direitos e Deveres</h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">Guia sobre acesso a documentos básicos, assistência jurídica gratuita e direitos sociais fundamentais.</p>
              <Button variant="outline" className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white">Acessar Guia</Button>
            </div>

            <div className="p-10 rounded-[50px] bg-brand-gold/5 border border-brand-gold/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-gold text-white flex items-center justify-center shadow-lg shadow-brand-gold/20">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="text-xl font-black text-slate-900">Prevenção: Combate à Violência</h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">Canais de denúncia para violência doméstica, proteção à criança e apoio psicossocial imediato.</p>
              <Button variant="outline" className="w-full border-brand-gold-dark text-brand-gold-dark hover:bg-brand-gold-dark hover:text-white">Ver Canais</Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={quemSomosModalOpen} 
        onClose={() => setQuemSomosModalOpen(false)} 
        title="Sobre a CACI"
      >
        <div className="space-y-8">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { title: 'Missão', icon: <Award size={16} /> },
              { title: 'Visão', icon: <Globe size={16} /> },
              { title: 'Valores', icon: <ShieldCheck size={16} /> },
              { title: 'História', icon: <Calendar size={16} /> },
            ].map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveQuemSomosTab(idx)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeQuemSomosTab === idx 
                    ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                {tab.title}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeQuemSomosTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-50 rounded-[32px] p-8 border border-slate-100"
            >
              <h3 className="text-xl font-black text-slate-900 mb-4">
                {[
                  'Nossa Missão',
                  'Nossa Visão',
                  'Nossos Valores',
                  'Nossa História'
                ][activeQuemSomosTab]}
              </h3>
              <p className="text-slate-600 leading-relaxed font-medium italic">
                {[
                  'Promover assistência social direta, acesso a direitos e melhoria de vida por acolhimento, formação e articulação em redes.',
                  'Ser referência nacional em inovação social e fortalecimento da cidadania, orientando paz, democracia e participação cidadã.',
                  'Dignidade, empatia, ética, humanidade, resiliência, solidariedade, compromisso, sustentabilidade e participação cidadã.',
                  'Mais de duas décadas de atuação ininterrupta, construindo pontes entre a vulnerabilidade e a oportunidade. Fundada em 2003, a CACI tem sido um farol de esperança e transformação social.'
                ][activeQuemSomosTab]}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </Modal>

      <Modal 
        isOpen={irModalOpen} 
        onClose={() => setIrModalOpen(false)} 
        title="Destinação do Imposto de Renda — CACI"
      >
        <div className="space-y-12">
          {/* Tabs inside Modal */}
          <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl">
            {[
              'O que é?', 'Quem pode?', 'Pessoa Física (PF)', 'Pessoa Jurídica (PJ)', 'Passo a Passo', 'Por que CACI?'
            ].map((tab, i) => (
              <button
                key={i}
                onClick={() => setActiveIRTab(i)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeIRTab === i ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {activeIRTab === 0 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl font-black text-slate-900">Transforme seu IR em Impacto Social</h3>
                <p className="text-slate-600 leading-relaxed">
                  Transforme parte do seu Imposto de Renda em impacto social com a CACI. A destinação com benefício fiscal é feita aos Fundos (ex.: Fundo da Criança e do Adolescente). A CACI recebe os recursos por meio do Fundo, conforme regras do conselho competente.
                </p>
                <div className="p-8 rounded-[32px] bg-brand-blue/5 border border-brand-blue/10 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-brand-blue text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand-blue/20">
                    <ShieldCheck size={32} />
                  </div>
                  <p className="text-brand-blue-dark font-bold text-sm leading-relaxed">
                    Este mecanismo permite que você decida onde uma parte do seu imposto será aplicada, sem gastar um centavo a mais do que já deve.
                  </p>
                </div>
              </div>
            )}

            {activeIRTab === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl font-black text-slate-900">Quem pode realizar a destinação?</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="p-8 rounded-[40px] bg-slate-50 border border-slate-100">
                    <h4 className="font-black text-slate-900 mb-4 uppercase text-xs tracking-widest text-brand-blue">Pessoa Física na Declaração (3%)</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">Faça a destinação diretamente no programa da Receita (aba Criança e Adolescente) durante o período de entrega da declaração.</p>
                  </div>
                  <div className="p-8 rounded-[40px] bg-slate-50 border border-slate-100">
                    <h4 className="font-black text-slate-900 mb-4 uppercase text-xs tracking-widest text-brand-blue">Pessoa Física no Ano-base (6%)</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">Solicite boletos durante o ano. Pagamentos devem ser feitos até o último dia útil do ano-base.</p>
                  </div>
                </div>
                <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 flex items-center gap-4">
                  <ClipboardCheck className="text-amber-600" />
                  <p className="text-amber-900 text-xs font-bold">Comprovantes: Guarde DARF, boletos e recibos para sua declaração anual.</p>
                </div>
              </div>
            )}

            {activeIRTab === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl font-black text-slate-900">1) Declaração do Imposto de Renda (3% — Pessoa Física)</h3>
                <div className="space-y-4">
                  {[
                    'Preencha a declaração (formulário completo).',
                    'Fichas → Doações Diretamente na Declaração → Criança e Adolescente → Novo.',
                    'Fundo padrão CACI: SP / São Paulo.',
                    'Use o “Valor disponível para doação” (até 3%).',
                    'Imprima e pague o DARF no prazo.',
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                      <p className="text-sm text-slate-600 font-medium">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl bg-brand-emerald/5 border border-brand-emerald/10">
                    <h5 className="font-black text-brand-emerald-dark text-xs uppercase tracking-widest mb-2">Imposto a pagar</h5>
                    <p className="text-sm text-slate-600">O valor destinado reduz o total do imposto devido.</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-brand-blue/5 border border-brand-blue/10">
                    <h5 className="font-black text-brand-blue-dark text-xs uppercase tracking-widest mb-2">IR a restituir</h5>
                    <p className="text-sm text-slate-600">O valor destinado é somado à sua restituição.</p>
                  </div>
                </div>
              </div>
            )}

            {activeIRTab === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl font-black text-slate-900">Pessoa Jurídica (PJ)</h3>
                <p className="text-slate-600 leading-relaxed">
                  Empresas tributadas pelo <strong>Lucro Real</strong> podem destinar até 1% do seu imposto de renda devido para o Fundo da Criança e do Adolescente, apoiando diretamente os projetos da CACI.
                </p>
                <div className="p-8 rounded-[40px] bg-slate-900 text-white">
                  <h4 className="font-black text-brand-gold uppercase text-xs tracking-widest mb-6">Benefícios para a Empresa</h4>
                  <ul className="space-y-4">
                    {[
                      'Abatimento de 100% do valor destinado (até o limite de 1% do IR devido).',
                      'Fortalecimento da marca através de responsabilidade social.',
                      'Impacto direto na comunidade onde a empresa está inserida.',
                      'Transparência total na aplicação dos recursos.'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-4 text-sm font-medium text-slate-300">
                        <div className="w-2 h-2 rounded-full bg-brand-gold" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeIRTab === 4 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-900">2) Ano-base (6% — Pessoa Física)</h3>
                  <p className="text-slate-600 leading-relaxed">Para quem declara por deduções legais: solicite boletos e pague até o último dia útil do ano-base.</p>
                </div>

                {/* Calculator */}
                <div className="p-10 rounded-[40px] bg-slate-50 border border-slate-100">
                  <h4 className="font-black text-slate-900 mb-8 uppercase text-xs tracking-widest flex items-center gap-2">
                    <BarChart3 size={18} className="text-brand-blue" />
                    Simulador de Destinação (6%)
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-8 items-end">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Imposto devido (R$)</label>
                      <input 
                        type="text" 
                        value={impostoDevido}
                        onChange={(e) => setImpostoDevido(e.target.value)}
                        className="w-full px-8 py-5 rounded-3xl bg-white border border-slate-200 focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all font-black text-xl" 
                        placeholder="Ex: 12000" 
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={calcularIR} className="flex-1 py-5">Calcular</Button>
                      <Button variant="outline" onClick={() => { setImpostoDevido(''); setResultadoCalculo(null); }} className="py-5">Limpar</Button>
                    </div>
                  </div>
                  {resultadoCalculo !== null && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-8 p-8 rounded-3xl bg-brand-blue text-white shadow-xl shadow-brand-blue/20"
                    >
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Valor sugerido para destinação</div>
                      <div className="text-4xl font-black">R$ {resultadoCalculo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <p className="mt-4 text-xs text-brand-blue-light font-medium">Este valor pode ser pago em um único boleto ou parcelado até o fim do ano-base.</p>
                    </motion.div>
                  )}
                </div>

                {/* Form */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shadow-inner">
                      <ClipboardCheck size={24} />
                    </div>
                    <h4 className="text-xl font-black text-slate-900">Solicitar boleto de destinação/doação</h4>
                  </div>
                  
                  <form className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome completo*</label>
                      <input type="text" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF*</label>
                      <input type="text" required placeholder="000.000.000-00" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail*</label>
                      <input type="email" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Celular*</label>
                      <input type="tel" required placeholder="(11) 9XXXX-XXXX" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor total (R$)*</label>
                      <input type="text" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qtd. de boletos</label>
                      <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-medium text-sm appearance-none">
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">UF/Município do Fundo*</label>
                      <input type="text" defaultValue="SP / São Paulo (padrão CACI)" disabled className="w-full px-6 py-4 rounded-2xl bg-slate-200 border border-slate-300 text-slate-500 font-medium text-sm cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vencimento do primeiro boleto*</label>
                      <input type="date" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="sm:col-span-2 grid sm:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CEP*</label>
                        <input type="text" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-medium text-sm" />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rua*</label>
                        <input type="text" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-medium text-sm" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-6 sm:col-span-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número*</label>
                        <input type="text" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-medium text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Complemento</label>
                        <input type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-medium text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bairro*</label>
                        <input type="text" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-medium text-sm" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6 sm:col-span-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade*</label>
                        <input type="text" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-medium text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">UF*</label>
                        <input type="text" defaultValue="SP" disabled className="w-full px-6 py-4 rounded-2xl bg-slate-200 border border-slate-300 text-slate-500 font-medium text-sm cursor-not-allowed" />
                      </div>
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Como soube?</label>
                      <input type="text" placeholder="Ex: Indicação, Redes sociais, Site" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="sm:col-span-2 flex items-start gap-3 py-4">
                      <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue" />
                      <label className="text-xs text-slate-500 font-medium leading-relaxed">Concordo com os Termos de Uso e a Política de Privacidade (LGPD).*</label>
                    </div>
                    <div className="sm:col-span-2 flex flex-col sm:flex-row gap-4">
                      <Button type="submit" className="flex-1 py-6">Solicitar boleto</Button>
                      <Button variant="outline" className="flex-1 py-6 border-brand-gold-dark text-brand-gold-dark hover:bg-brand-gold-dark hover:text-white">Preciso de ajuda</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeIRTab === 5 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl font-black text-slate-900">Por que escolher a CACI?</h3>
                <p className="text-slate-600 leading-relaxed">
                  Ao destinar para os fundos onde a CACI atua, você garante que esses recursos cheguem a projetos rigorosamente selecionados e fiscalizados, gerando impacto real na vida de milhares de pessoas.
                </p>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="p-8 rounded-[40px] bg-brand-emerald/5 border border-brand-emerald/10">
                    <div className="w-12 h-12 rounded-2xl bg-brand-emerald text-white flex items-center justify-center mb-6 shadow-lg shadow-brand-emerald/20">
                      <Award size={24} />
                    </div>
                    <h4 className="font-black text-slate-900 mb-2">20 Anos de História</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Duas décadas de compromisso ininterrupto com o desenvolvimento social e a inclusão.</p>
                  </div>
                  <div className="p-8 rounded-[40px] bg-brand-blue/5 border border-brand-blue/10">
                    <div className="w-12 h-12 rounded-2xl bg-brand-blue text-white flex items-center justify-center mb-6 shadow-lg shadow-brand-blue/20">
                      <ShieldCheck size={24} />
                    </div>
                    <h4 className="font-black text-slate-900 mb-2">Transparência Auditável</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Prestação de contas rigorosa e acompanhamento direto da aplicação dos recursos.</p>
                  </div>
                </div>
                <div className="p-10 rounded-[50px] bg-slate-900 text-white text-center">
                  <Heart className="text-brand-gold mx-auto mb-6" size={48} />
                  <h4 className="text-2xl font-black mb-4">Seu imposto transforma vidas.</h4>
                  <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">Junte-se a nós nesta jornada de transformação social através da destinação consciente.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={mapModalOpen} 
        onClose={() => setMapModalOpen(false)} 
        title="Mapa de Impacto — Educação Inclusiva"
      >
        <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
          <iframe 
            src="https://www.google.com/maps/d/embed?mid=1V-SIqmoOVpsKc7rf2qR_w1VbYciv2SY" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa de Impacto Educação Inclusiva"
          ></iframe>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fonte: Equipe CACI / Google My Maps</p>
          <a 
            href="https://www.google.com/maps/d/edit?mid=1V-SIqmoOVpsKc7rf2qR_w1VbYciv2SY&usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline flex items-center gap-1"
          >
            Abrir no Google Maps
            <ExternalLink size={12} />
          </a>
        </div>
      </Modal>

      <Modal 
        isOpen={fundingProposalsModalOpen} 
        onClose={() => setFundingProposalsModalOpen(false)} 
        title="Propostas à Financiadores — Transparência CACI"
      >
        <div className="space-y-8">
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
            <h4 className="text-lg font-black text-slate-900 mb-2">Compromisso com a Captação Ética</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Apresentamos aqui as propostas submetidas pela ONG CACI a diversos financiadores e parceiros, 
              reafirmando nosso compromisso com a transparência e a busca por recursos para impacto social.
            </p>
          </div>

          <div className="grid gap-6">
            {fundingProposals.length > 0 ? fundingProposals.map((proposal) => (
              <div key={proposal.id} className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">{proposal.osc_name}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submetido em: {proposal.submission_date}</span>
                    </div>
                    <h5 className="text-xl font-black text-slate-900 group-hover:text-brand-blue transition-colors">{proposal.title}</h5>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    proposal.status === 'aprovado' ? 'bg-emerald-100 text-emerald-600' :
                    proposal.status === 'em análise' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {proposal.status}
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 italic">
                  {proposal.summary}
                </p>
                {proposal.document_url && (
                  <a 
                    href={proposal.document_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline"
                  >
                    <Download size={14} />
                    Baixar Proposta Completa (PDF)
                  </a>
                )}
              </div>
            )) : (
              <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhuma proposta registrada publicamente no momento.</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={historiaModalOpen} 
        onClose={() => setHistoriaModalOpen(false)} 
        title="Nossa História - Apresentação Institucional"
      >
        <div className="space-y-8" ref={printRef}>
          <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-2xl no-print">
            <video 
              src="input_file_6.mp4" 
              controls 
              className="w-full h-full object-contain"
              poster="input_file_0.png"
            >
              Seu navegador não suporta vídeos.
            </video>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Apresentação Institucional</h4>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">7 Páginas</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                  <img 
                    src={`input_file_${idx}.png`} 
                    alt={`Página ${idx + 1}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xs italic">
                Página 7...
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 no-print">
            <a 
              href="input_file_6.mp4" 
              download 
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-blue-dark transition-all shadow-lg shadow-brand-blue/20"
            >
              <Download size={18} />
              Baixar Vídeo
            </a>
            <Button 
              variant="outline"
              onClick={() => handlePrint()}
              className="flex-1 py-4 rounded-2xl"
            >
              <Printer size={18} />
              Imprimir Apresentação
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ouvidoria Modal */}
      <AnimatePresence>
        {ouvidoriaModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOuvidoriaModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 sm:p-12">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-black text-slate-900">Ouvidoria CACI</h3>
                      <p className="text-sm text-slate-500">Canal oficial de escuta e transparência</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setOuvidoriaModalOpen(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <p className="text-slate-600 leading-relaxed">
                    A Ouvidoria da CACI é um espaço de diálogo aberto com a comunidade, parceiros e beneficiários. 
                    Sua manifestação é fundamental para o aprimoramento constante de nossa governança e impacto social.
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                      <h4 className="font-black text-[10px] uppercase tracking-widest text-brand-blue mb-2">E-mail Direto</h4>
                      <p className="text-slate-900 font-bold">ouvidoria@caci.ong.br</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                      <h4 className="font-black text-[10px] uppercase tracking-widest text-brand-blue mb-2">Prazo de Resposta</h4>
                      <p className="text-slate-900 font-bold">Até 10 dias úteis</p>
                    </div>
                  </div>

                  <form className="space-y-4 pt-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Nome Completo</label>
                        <input type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-brand-blue transition-all" placeholder="Seu nome" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">E-mail</label>
                        <input type="email" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-brand-blue transition-all" placeholder="seu@email.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Mensagem / Relato</label>
                      <textarea rows={4} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-brand-blue transition-all resize-none" placeholder="Descreva sua manifestação..." />
                    </div>
                    <Button variant="primary" className="w-full py-5 rounded-2xl shadow-xl shadow-brand-blue/20">Enviar Manifestação</Button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Beneficiary Area Modal */}
      <AnimatePresence>
        {beneficiaryModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBeneficiaryModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 sm:p-10 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-black text-slate-900">Área do Usuário e Beneficiário</h3>
                    <p className="text-sm text-slate-500">Formulários de interesse e cadastro institucional</p>
                  </div>
                </div>
                <button 
                  onClick={() => setBeneficiaryModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 sm:p-10 custom-scrollbar">
                <BeneficiaryArea />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <EvaluationModal 
        isOpen={evaluationModalOpen} 
        onClose={() => setEvaluationModalOpen(false)} 
      />

      <CACIiaChat 
        agentType="institucional" 
        organizationId="caci_institucional" 
        initialMessage="Olá! Sou a CACIia, assistente institucional da CACI. Como posso te ajudar a navegar na plataforma ou tirar dúvidas sobre nossos programas?"
      />
    </div>
  );
}

const ProgramCard = ({ title, text, img, action }: any) => (
  <Card padding={false} className="flex flex-col h-full">
    <div className="h-48 overflow-hidden">
      <img 
        src={`https://picsum.photos/seed/caci-${img}/800/600`} 
        alt={title} 
        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
        referrerPolicy="no-referrer"
      />
    </div>
    <div className="p-6 flex flex-col flex-1">
      <h3 className="heading-sm mb-3">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed flex-1">{text}</p>
      {action}
    </div>
  </Card>
);
