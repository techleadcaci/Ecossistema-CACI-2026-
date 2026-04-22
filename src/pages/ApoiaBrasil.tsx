import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Ticket, DollarSign, Users, Plus, CheckCircle2, 
  AlertCircle, ExternalLink, Info, ArrowRight, Smartphone, 
  Laptop, Speaker, Printer, Download, X, QrCode, AlertTriangle,
  Copy, Check, ShieldCheck, ChevronLeft
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { db, auth } from '../firebase';
import MFAChallenge from '../components/MFAChallenge';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, doc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

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

const RAFFLES_CONFIG = [
  {
    id: 'caixa-som',
    title: 'Rifa Caixa de Som Bluetooth',
    description: 'Concorra a uma potente caixa de som bluetooth e ajude nossos projetos.',
    price: 10,
    totalNumbers: 100,
    icon: <Speaker size={48} />,
    image: 'https://images.unsplash.com/photo-1608155613951-36906560968b?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'smartphone',
    title: 'Rifa Smartphone de Última Geração',
    description: 'Sua chance de ganhar um smartphone novo enquanto apoia a CACI.',
    price: 25,
    totalNumbers: 500,
    icon: <Smartphone size={48} />,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'notebook',
    title: 'Rifa Notebook para Estudos',
    description: 'Participe e concorra a um notebook de alta performance.',
    price: 50,
    totalNumbers: 500,
    icon: <Laptop size={48} />,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800',
  }
];

const CAMPAIGNS_CONFIG = [
  {
    id: 'lancamento-2026',
    title: 'Lançamento Ecossistema CACI 2026+',
    category: 'Crowdfunding',
    description: 'Campanha exclusiva de lançamento da plataforma digital ecossistema CACI 2026+',
    raised: 0,
    goal: 18000,
    images: [
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc48?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=800'
    ]
  },
  {
    id: 'educacao',
    title: 'Educação e Empregabilidade',
    category: 'Crowdfunding',
    description: 'Apoie nossos programas de capacitação profissional e inclusão educacional para jovens e adultos.',
    raised: 0,
    goal: 150000,
    images: [
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800'
    ]
  },
  {
    id: 'socioambiental',
    title: 'Projetos Socioambientais e Culturais',
    category: 'Crowdfunding',
    description: 'Apoie projetos socioculturais e a revitalização de nascentes e áreas verdes.',
    raised: 0,
    goal: 100000,
    images: [
      'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=800'
    ]
  },
  {
    id: 'saude',
    title: 'Saúde e Bem-estar (CACI Produtivamente)',
    category: 'Crowdfunding',
    description: 'Apoie a integração da saúde mental e ocupacional em nossas ações de resposta às crises ambientais.',
    raised: 0,
    goal: 120000,
    images: [
      'https://images.unsplash.com/photo-1505751172107-5739a00723a5?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800'
    ]
  },
  {
    id: 'cuidando',
    title: 'Cuidando de Quem Cuida',
    category: 'Crowdfunding',
    description: 'Apoie o resgate e a reabilitação de animais de rua em São Paulo.',
    raised: 0,
    goal: 80000,
    images: [
      'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800'
    ]
  },
  {
    id: 'horta',
    title: 'Horta Comunitária',
    category: 'Crowdfunding',
    description: 'Ajude a criar uma horta que alimentará mais de 50 famílias.',
    raised: 0,
    goal: 15000,
    images: [
      'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1530836361253-efad5cb2fe2e?auto=format&fit=crop&q=80&w=800'
    ]
  }
];

const CampaignCard = ({ campaign, onDonate }: { campaign: any, onDonate: (campaign: any) => void, key?: string }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % campaign.images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [campaign.images.length]);

  const progress = (campaign.raised / campaign.goal) * 100;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-[40px] overflow-hidden shadow-xl border border-slate-100 flex flex-col h-full"
    >
      <div className="h-48 relative overflow-hidden group">
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentImageIndex}
            src={campaign.images[currentImageIndex]} 
            alt={campaign.title} 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
        <div className="absolute top-4 left-4 px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
          {campaign.category}
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-1">
          {campaign.images.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all ${i === currentImageIndex ? 'w-4 bg-white' : 'w-1 bg-white/40'}`}
            />
          ))}
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 leading-tight">{campaign.title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{campaign.description}</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-brand-blue">
              <Users size={14} />
              <span className="text-xs font-black">{campaign.donorsCount || 0}</span>
            </div>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Apoiadores</span>
          </div>
        </div>
        
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-400">Arrecadado: <span className="text-brand-blue">R$ {campaign.raised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></span>
            <span className="text-slate-900">Meta: R$ {campaign.goal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              className="h-full bg-brand-blue"
            />
          </div>
        </div>

        <button 
          onClick={() => onDonate(campaign)}
          className="w-full py-3 bg-brand-blue text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-blue-dark transition-all shadow-lg shadow-brand-blue/20 active:scale-95"
        >
          Apoiar Agora
        </button>
      </div>
    </motion.div>
  );
};

const ApoiaBrasil = () => {
  const navigate = useNavigate();
  const componentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'campanhas' | 'ongs' | 'rifas'>('home');
  const [selectedRaffle, setSelectedRaffle] = useState<any>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  const [user, setUser] = useState<any>(auth.currentUser);
  const [copySuccess, setCopySuccess] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>(CAMPAIGNS_CONFIG);

  useEffect(() => {
    const q = query(collection(db, 'apoia_campaigns'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreCampaigns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        images: (doc.data() as any).images || [
          'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800'
        ]
      })) as any[];
      
      // If Firestore is empty, initialize with static config
      if (snapshot.empty) {
        CAMPAIGNS_CONFIG.forEach(async (staticCamp) => {
          try {
            await setDoc(doc(db, 'apoia_campaigns', staticCamp.id), {
              ...staticCamp,
              status: 'ativa',
              timestamp: serverTimestamp()
            });
          } catch (err) {
            console.error("Error initializing campaign:", err);
          }
        });
      }

      setCampaigns(firestoreCampaigns.length > 0 ? firestoreCampaigns : CAMPAIGNS_CONFIG);
    }, (err) => {
      console.error("Error fetching campaigns:", err);
    });
    
    return () => unsubscribe();
  }, []);

  const handleDonate = async (amount: number) => {
    if (!selectedCampaign) return;
    if (!auth.currentUser) {
      setError("Você precisa estar logado para doar. Por favor, faça login no topo da página.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const campaignRef = doc(db, 'apoia_campaigns', selectedCampaign.id);
      
      // Atomic update for raised and donorsCount
      await updateDoc(campaignRef, {
        raised: increment(amount),
        donorsCount: increment(1)
      });

      // Record the donation
      await addDoc(collection(db, 'campaign_donations'), {
        campaign_id: selectedCampaign.id,
        campaign_title: selectedCampaign.title,
        amount,
        user_id: auth.currentUser.uid,
        user_email: auth.currentUser.email,
        timestamp: serverTimestamp()
      });

      setSelectedCampaign(null);
      setShowPaymentOptions(false);
      alert('Doação realizada com sucesso! Obrigado pelo seu apoio.');
    } catch (err) {
      console.error("Error processing donation:", err);
      setError("Erro ao processar doação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: 'Comprovante-Apoia-Brasil',
  });

  const generatePixPayload = (amount: number) => {
    // Static PIX Payload for ONG CACI (CNPJ: 05.639.031/0001-00)
    const key = '05639031000100';
    const name = 'ONG CACI';
    const city = 'SAO PAULO';
    
    const amountStr = amount.toFixed(2);
    const amountPart = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
    
    const payload = `00020126360014BR.GOV.BCB.PIX0114${key}520400005303986${amountPart}5802BR59${name.length.toString().padStart(2, '0')}${name}60${city.length.toString().padStart(2, '0')}${city}62070503***6304`;
    
    // CRC16 CCITT calculation
    const crc16 = (data: string) => {
      let crc = 0xFFFF;
      for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
          if ((crc & 0x8000) !== 0) {
            crc = (crc << 1) ^ 0x1021;
          } else {
            crc <<= 1;
          }
        }
      }
      return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    };
    
    return payload + crc16(payload);
  };

  const PAYPAL_URL = 'https://www.paypal.com/fundraiser/charity/4445197';
  const PIX_KEY = '05.639.031/0001-00';

  const handleBuyRaffle = (raffle: any) => {
    setSelectedRaffle(raffle);
    setSelectedNumbers([]);
    setShowReceipt(false);
    setError(null);
  };

  const handleOSCRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      cnpj: formData.get('cnpj'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      description: formData.get('description'),
      timestamp: serverTimestamp(),
      status: 'pending_verification'
    };
    setRegistrationData(data);
    setShowMFA(true);
  };

  const onMFAVerify = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'osc_registrations'), registrationData);
      setMfaVerified(true);
      setShowMFA(false);
      setShowRegistrationSuccess(true);
    } catch (err) {
      console.error("Error registering OSC:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      setSelectedNumbers([...selectedNumbers, num]);
    }
  };

  const confirmPurchase = async () => {
    if (selectedNumbers.length === 0) return;
    
    if (!auth.currentUser) {
      setError("Você precisa estar logado para realizar uma reserva. Por favor, faça login no topo da página.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const registrationId = Math.random().toString(36).substring(2, 10).toUpperCase();
      const ticketNumber = Math.floor(100000 + Math.random() * 900000);
      
      const purchaseData = {
        registration_id: registrationId,
        ticket_number: ticketNumber,
        raffle_id: selectedRaffle.id,
        raffle_title: selectedRaffle.title,
        numbers: selectedNumbers,
        total_value: selectedNumbers.length * selectedRaffle.price,
        user_id: auth.currentUser.uid,
        user_email: auth.currentUser.email || 'guest@caci.ong.br',
        timestamp: serverTimestamp(),
        status: 'pending_payment'
      };

      await addDoc(collection(db, 'raffle_purchases'), purchaseData);
      
      setReceiptData(purchaseData);
      setShowReceipt(true);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'raffle_purchases');
      } catch (e: any) {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const renderCampanhas = () => (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-slate-900">Campanhas de Crowdfunding</h2>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto">
          Conheça nossos projetos e ajude a transformar realidades através do apoio coletivo.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {campaigns.map((campaign) => (
          <CampaignCard 
            key={campaign.id} 
            campaign={campaign} 
            onDonate={(c) => setSelectedCampaign(c)}
          />
        ))}
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative h-[500px] rounded-[48px] overflow-hidden bg-brand-emerald">
        <img 
          src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1920" 
          alt="Children smiling" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-emerald/85 via-brand-emerald/40 to-transparent"></div>
        <div className="relative z-10 h-full flex flex-col justify-center px-12 max-w-2xl space-y-8">
          <h1 className="text-5xl font-black text-white leading-tight">
            Apoia Brasil: <span className="text-brand-blue">Juntos, transformamos vidas.</span>
          </h1>
          <p className="text-xl text-slate-300 font-medium">
            A sua plataforma para apoiar causas nobres e participar de rifas solidárias. Conectando doadores a ONGs brasileiras com transparência e segurança.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('campanhas')}
              className="px-8 py-4 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-blue-dark transition-all"
            >
              Ver Campanhas
            </button>
            <button 
              onClick={() => setActiveTab('ongs')}
              className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
            >
              Sou uma ONG
            </button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black text-slate-900">Como Funciona</h2>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto">Apoiar uma causa nunca foi tão fácil.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'ONGs se Cadastram',
              desc: 'Organizações verificadas criam perfis e lançam suas campanhas de crowdfunding ou rifas.'
            },
            {
              step: '2',
              title: 'Você Doa',
              desc: 'Navegue pelas campanhas, escolha uma causa e doe com segurança ou compre bilhetes de rifa.'
            },
            {
              step: '3',
              title: 'Vidas são Transformadas',
              desc: 'Acompanhe o progresso da campanha e veja o impacto real da sua contribuição na comunidade.'
            }
          ].map((item) => (
            <div key={item.step} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl space-y-4 relative group hover:border-brand-blue/30 transition-all">
              <div className="w-12 h-12 bg-brand-blue text-white rounded-2xl flex items-center justify-center text-xl font-black">
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rifas do Bem Preview */}
      <section className="bg-brand-blue/5 p-12 rounded-[48px] space-y-12">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-900">Rifas do Bem</h2>
            <p className="text-slate-500 font-medium">Participe de nossas rifas solidárias, concorra a prêmios incríveis e ajude a CACI a transformar vidas.</p>
          </div>
          <button 
            onClick={() => setActiveTab('rifas')}
            className="flex items-center gap-2 text-brand-blue font-black uppercase tracking-widest text-sm hover:underline"
          >
            Ver todas as Rifas <ArrowRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {RAFFLES_CONFIG.map((raffle) => (
            <motion.div 
              key={raffle.id}
              whileHover={{ y: -10 }}
              className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-slate-100"
            >
              <div className="h-48 bg-slate-200 relative">
                <img src={raffle.image} alt={raffle.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 px-4 py-2 bg-brand-blue text-white rounded-full text-xs font-black uppercase tracking-widest">
                  R$ {raffle.price},00
                </div>
              </div>
              <div className="p-8 space-y-4">
                <h3 className="text-xl font-bold text-slate-900">{raffle.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2">{raffle.description}</p>
                <button 
                  onClick={() => handleBuyRaffle(raffle)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all"
                >
                  Comprar Rifa
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-16 border-t border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-slate-900">Apoia Brasil</h3>
            <p className="text-slate-500 text-sm">© 2026 Apoia Brasil. Todos os direitos reservados.</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Contato</h4>
            <div className="space-y-2 text-sm text-slate-500">
              <p>contato@caci.ong.br</p>
              <p>(11) 94060-3881</p>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Certificações</h4>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 w-fit">
              <Info size={16} className="text-brand-blue" />
              <span className="text-xs font-bold text-slate-600">Selo Mapa as OSC's</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

  const [donationAmount, setDonationAmount] = useState<number>(50);

  const renderDonationModal = () => (
    <AnimatePresence>
      {selectedCampaign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCampaign(null)}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative z-10 bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden p-8 space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">Apoiar Campanha</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{selectedCampaign.title}</p>
              </div>
              <button 
                onClick={() => setSelectedCampaign(null)}
                className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor da Doação (R$)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDonationAmount(amt)}
                      className={`py-3 rounded-xl font-black text-xs transition-all ${
                        donationAmount === amt 
                          ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' 
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      R$ {amt}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">R$</span>
                  <input 
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    placeholder="Outro valor"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-slate-600 font-medium text-center">Escolha sua forma de contribuição:</p>
                
                <button 
                  onClick={() => handleDonate(donationAmount)}
                  disabled={loading || donationAmount <= 0}
                  className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-blue-dark transition-all shadow-lg shadow-brand-blue/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? 'Processando...' : 'Confirmar Doação'}
                  {!loading && <Heart size={16} />}
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-400 tracking-widest bg-white px-4">Ou use links externos</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => window.open(PAYPAL_URL, '_blank')}
                    className="p-4 bg-[#0070ba] text-white rounded-2xl flex flex-col items-center gap-2 group hover:scale-[1.02] transition-all"
                  >
                    <DollarSign size={20} />
                    <span className="font-black uppercase tracking-widest text-[10px]">PayPal</span>
                  </button>

                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(PIX_KEY);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                    className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col items-center gap-2 group hover:scale-[1.02] transition-all"
                  >
                    <QrCode size={20} />
                    <span className="font-black uppercase tracking-widest text-[10px]">{copySuccess ? 'Copiado!' : 'PIX (CNPJ)'}</span>
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center italic leading-relaxed">
              Sua doação é processada com segurança e direcionada integralmente para o projeto escolhido.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderRaffleModal = () => (
    <AnimatePresence>
      {selectedRaffle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedRaffle(null)}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative z-10 bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-blue text-white rounded-2xl flex items-center justify-center">
                  {selectedRaffle.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedRaffle.title}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Selecione seus números da sorte</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRaffle(null)}
                className="w-10 h-10 bg-white rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold"
                >
                  <AlertCircle size={18} />
                  {error}
                </motion.div>
              )}

              {!showReceipt ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {Array.from({ length: selectedRaffle.totalNumbers }).map((_, i) => {
                      const num = i + 1;
                      const isSelected = selectedNumbers.includes(num);
                      return (
                        <button
                          key={num}
                          onClick={() => toggleNumber(num)}
                          className={`aspect-square rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                            isSelected 
                              ? 'bg-brand-blue text-white shadow-lg scale-110 z-10' 
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'
                          }`}
                        >
                          {num.toString().padStart(selectedRaffle.totalNumbers > 100 ? 3 : 2, '0')}
                        </button>
                      );
                    })}
                  </div>
                  
                    <div className="bg-slate-900 p-8 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="space-y-1 text-center sm:text-left">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total a Pagar</p>
                        <h4 className="text-3xl font-black">R$ {selectedNumbers.length * selectedRaffle.price},00</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                          {selectedNumbers.length} número(s) selecionado(s)
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <button 
                          onClick={confirmPurchase}
                          disabled={selectedNumbers.length === 0 || loading}
                          className={`px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${
                            selectedNumbers.length > 0 && !loading
                              ? 'bg-brand-blue text-white hover:bg-brand-blue-dark shadow-xl'
                              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          {loading ? 'Processando...' : 'Pagar com PIX'}
                        </button>
                        <button 
                          onClick={() => window.open(PAYPAL_URL, '_blank')}
                          disabled={selectedNumbers.length === 0}
                          className={`px-12 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-white/20 hover:bg-white/10 ${
                            selectedNumbers.length > 0 ? 'text-white' : 'text-slate-600 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          Pagar com PayPal
                        </button>
                      </div>
                    </div>
                </div>
              ) : (
                <div className="max-w-md mx-auto space-y-8 py-4">
                  <div ref={receiptRef} className="bg-white border-2 border-dashed border-slate-200 p-8 rounded-3xl space-y-6 text-center relative overflow-hidden print:border-none print:shadow-none">
                    <div className="absolute top-0 left-0 w-full h-2 bg-brand-blue print:hidden"></div>
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={32} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-slate-900">Comprovante de Reserva</h4>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Protocolo: {receiptData.registration_id}</p>
                    </div>

                    <div className="space-y-4 py-6 border-y border-slate-100">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold uppercase">Bilhete Nº</span>
                        <span className="text-slate-900 font-black">#{receiptData.ticket_number}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold uppercase">Números</span>
                        <span className="text-brand-blue font-black">{receiptData.numbers.map((n: number) => n.toString().padStart(2, '0')).join(', ')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold uppercase">Valor Total</span>
                        <span className="text-slate-900 font-black">R$ {receiptData.total_value},00</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Escaneie para Pagar via PIX</p>
                      <div className="w-48 h-48 bg-white rounded-2xl border border-slate-100 mx-auto flex items-center justify-center p-4 shadow-sm">
                        <QRCodeSVG 
                          value={generatePixPayload(receiptData.total_value)} 
                          size={160}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-1">
                        <p className="font-black text-slate-700">ONG CACI - 05.639.031/0001-00</p>
                        <p>B. do Brasil Ag: 1194-0 C/C: 338796-8</p>
                        <p>Cora SDC Ag: 0001 C/C: 1429639-8</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 print:hidden">
                      <button 
                        onClick={() => handlePrint()}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                      >
                        <Printer size={14} /> Imprimir
                      </button>
                      <button 
                        onClick={() => handlePrint()}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                      >
                        <Download size={14} /> Salvar PDF
                      </button>
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-slate-400 leading-relaxed italic">
                    Sua reserva expira em 30 minutos. Após o pagamento, o comprovante oficial será enviado para seu e-mail vinculado.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const handlePrintReport = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Relatorio-Apoia-Brasil',
  });

  return (
    <div ref={componentRef} className="space-y-8 pb-12">
      {/* Header / Nav */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[32px] shadow-xl border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-blue text-white rounded-2xl flex items-center justify-center">
            <Heart size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Apoia Brasil</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-blue">Impacto Social Digital</p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            {[
              { id: 'home', label: 'Início' },
              { id: 'campanhas', label: 'Campanhas' },
              { id: 'ongs', label: 'Para ONGs' },
              { id: 'rifas', label: 'Rifas do Bem' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-slate-100 mx-2 hidden sm:block"></div>

          <button 
            onClick={() => handlePrintReport()}
            className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2"
          >
            <Printer size={14} /> Relatório
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-black text-slate-900 leading-none">{user.displayName || 'Usuário'}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Conectado</p>
              </div>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                title="Sair da Conta"
              >
                <X size={14} />
                Sair
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="px-6 py-2 rounded-xl bg-brand-blue text-white text-xs font-black uppercase tracking-widest hover:bg-brand-blue-dark transition-all shadow-lg shadow-brand-blue/20"
            >
              Entrar
            </button>
          )}
        </nav>
      </div>

      {/* Content based on active tab */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {activeTab === 'home' && renderHome()}
        {activeTab === 'campanhas' && renderCampanhas()}
        {activeTab === 'rifas' && (
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black text-slate-900">Rifas do Bem</h2>
              <p className="text-slate-500 font-medium max-w-2xl mx-auto">
                Escolha uma das nossas rifas ativas e concorra a prêmios incríveis. Todo o valor arrecadado é revertido para os projetos da ONG CACI.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {RAFFLES_CONFIG.map((raffle) => (
                <motion.div 
                  key={raffle.id}
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-[40px] overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
                >
                  <div className="h-64 relative">
                    <img src={raffle.image} alt={raffle.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/30">
                        {raffle.icon}
                      </div>
                      <div className="px-4 py-2 bg-brand-blue text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                        R$ {raffle.price},00
                      </div>
                    </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900">{raffle.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{raffle.description}</p>
                    </div>
                    <div className="pt-6 border-t border-slate-50 mt-auto space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-400 uppercase tracking-widest">Disponibilidade</span>
                        <span className="text-brand-blue">{raffle.totalNumbers} Números</span>
                      </div>
                      <button 
                        onClick={() => handleBuyRaffle(raffle)}
                        className="w-full py-5 bg-slate-900 text-white rounded-[20px] font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                      >
                        Comprar Rifa
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'ongs' && (
          <div className="max-w-4xl mx-auto">
            {showRegistrationSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-xl text-center space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
                  <CheckCircle2 size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-slate-900">Cadastro Enviado!</h3>
                  <p className="text-slate-500 font-medium">Sua solicitação foi recebida e passará por uma análise técnica. Entraremos em contato em breve.</p>
                </div>
                <button 
                  onClick={() => {
                    setShowRegistrationSuccess(false);
                    setActiveTab('home');
                  }}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  Voltar ao Início
                </button>
              </motion.div>
            ) : (
              <div className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-xl space-y-12">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-black text-slate-900">Cadastro de OSC</h2>
                  <p className="text-slate-500 font-medium max-w-2xl mx-auto">
                    Junte-se ao Apoia Brasil e amplie o impacto da sua organização. 
                    <br />
                    <span className="text-brand-blue font-bold text-xs uppercase tracking-widest mt-2 block">
                      <ShieldCheck size={14} className="inline mr-1" /> Verificação em 2 Fatores Obrigatória
                    </span>
                  </p>
                </div>

                <form onSubmit={handleOSCRegistration} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome da Organização</label>
                    <input 
                      required
                      name="name"
                      type="text" 
                      placeholder="Ex: Instituto Transformar"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-brand-blue outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">CNPJ</label>
                    <input 
                      required
                      name="cnpj"
                      type="text" 
                      placeholder="00.000.000/0001-00"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-brand-blue outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail Institucional</label>
                    <input 
                      required
                      name="email"
                      type="email" 
                      placeholder="contato@ong.org.br"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-brand-blue outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Telefone / WhatsApp</label>
                    <input 
                      required
                      name="phone"
                      type="tel" 
                      placeholder="(00) 00000-0000"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-brand-blue outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Breve Descrição da Causa</label>
                    <textarea 
                      required
                      name="description"
                      rows={4}
                      placeholder="Conte-nos um pouco sobre o trabalho da sua organização..."
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-brand-blue outline-none transition-all font-medium resize-none"
                    />
                  </div>
                  <div className="md:col-span-2 pt-4">
                    <button 
                      type="submit"
                      className="w-full py-5 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-blue-dark transition-all shadow-xl shadow-brand-blue/20"
                    >
                      Iniciar Cadastro e Verificar 2FA
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* MFA Modal */}
      {showMFA && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-md">
            <MFAChallenge 
              onVerify={onMFAVerify} 
              userEmail={registrationData?.email || 'ONG'} 
            />
            <button 
              onClick={() => setShowMFA(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Raffle Purchase Modal */}
      {renderRaffleModal()}
      {/* Donation Modal for Campaigns */}
      {renderDonationModal()}
    </div>
  );
};

export default ApoiaBrasil;
