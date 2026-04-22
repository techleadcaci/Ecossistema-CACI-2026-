import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Globe, 
  Target, 
  Users, 
  BarChart3, 
  Settings, 
  ArrowUpRight, 
  Search,
  Mail,
  Share2,
  Database,
  ShieldCheck,
  Plus,
  Loader2,
  Printer,
  BookOpen,
  Cpu,
  Network,
  CheckCircle2,
  FileText,
  TrendingUp,
  Shield
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { erpService, InstitutionalIdentity } from '../../services/erpService';
import * as ecossistemaService from '../../services/ecossistemaService';
import { runDiagnosticEngine } from '../../services/diagnosticEngine';
import { auth } from '../../firebase';
import { 
  ERPCampaign, 
  ERPAsset, 
  ERPMetrics, 
  Organization, 
  InstitutionalDiagnostic,
  OSCAssetUsage
} from '../../types';

const AnimatedCounter: React.FC<{ value: number, duration?: number, isPercentage?: boolean, isK?: boolean }> = ({ value, duration = 2, isPercentage = false, isK = false }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalMiliseconds = duration * 1000;
    const incrementTime = 50;
    const totalSteps = totalMiliseconds / incrementTime;
    const increment = (end - start) / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  const formatValue = (val: number) => {
    if (isPercentage) return val.toFixed(1) + '%';
    if (isK) return (val / 1000).toFixed(1) + 'k';
    return Math.floor(val).toString();
  };

  return <span>{formatValue(count)}</span>;
};

const CATALOG_DATA = [
  { name: 'E-book CACI – 3º Setor (1ª Edição)', type: 'Digital', value: 'R$ 79,90', status: 'Disponível', desc: 'Base histórica e fundamentos originais da metodologia CACI.' },
  { name: 'E-book CACI – 3º Setor (2ª Edição)', type: 'Digital', value: 'R$ 119,90', status: 'Disponível', desc: 'Guia definitivo atualizado com governança profissional e MROSC.' },
  { name: 'E-book CACI – Portas de Entrada', type: 'Digital', value: 'R$ 29,90', status: 'Lançamento', desc: 'Caminhos para o cidadão iniciar sua ação social.' },
  { name: 'Manual SIMPLIFICA (Digital)', type: 'Digital', value: 'R$ 119,90', status: 'Disponível', desc: 'Metodologia de automação institucional em 10 passos.' },
  { name: 'Ponto Eletrônico Digital Auditável', type: 'SaaS / Ativo', value: 'R$ 119,90', status: 'Ativo', desc: 'Gestão de presença e voluntariado com conformidade MROSC.' },
  { name: 'Sistema Eleitoral Blockchain', type: 'SaaS / Ativo', value: 'Sob Consulta', status: 'Ativo', desc: 'Urna digital criptografada para assembleias e conselhos de OSCs.' },
  { name: 'Personality ID Partner', type: 'Diagnóstico', value: 'R$ 499,90', status: 'Disponível', desc: 'Diagnóstico comportamental para lideranças do Terceiro Setor.' },
  { name: 'Comunidade CACI (Assinatura Anual)', type: 'Adesão', value: 'R$ 1.599,99', status: 'Disponível', desc: 'Networking estratégico, trilhas de formação e mentorias exclusivas.' },
  { name: 'Mentoria em Governança (Hora)', type: 'Serviço', value: 'Sob Consulta', status: 'Disponível', desc: 'Acompanhamento institucional direto com especialistas em dados.' },
  { name: 'Auditoria CACI-IMI', type: 'Acreditação', value: 'Sob Consulta', status: 'Ativo', desc: 'Selo de Maturidade Institucional baseado em 80 indicadores técnicos.' },
];

const ERPDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<ERPCampaign[]>([]);
  const [assets, setAssets] = useState<ERPAsset[]>([]);
  const [recommendedAssets, setRecommendedAssets] = useState<ERPAsset[]>([]);
  const [identities, setIdentities] = useState<InstitutionalIdentity[]>([]);
  const [metrics, setMetrics] = useState<ERPMetrics | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [diagnostic, setDiagnostic] = useState<InstitutionalDiagnostic | null>(null);
  const [oscAssets, setOscAssets] = useState<OSCAssetUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'development' | 'identities'>('development');
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [newCampaign, setNewCampaign] = useState({
    title: '',
    goal: '',
    budget: 0,
    start_date: ''
  });

  const handleCreateCampaign = async () => {
    if (!organization || !newCampaign.title) return;
    try {
      setSyncing(true);
      await erpService.createCampaign({
        organization_id: organization.id,
        title: newCampaign.title,
        goal: 0, // Default goal as number
        budget: newCampaign.budget,
        start_date: newCampaign.start_date,
        start_time: '09:00',
        end_date: '',
        end_time: '18:00',
        period: 'meses',
        status: 'planejamento',
        maturity_level: 1,
        alcance_real: 0,
        leads_reais: 0,
        conversao_real: 0,
        automation_config: {}
      });
      setShowNewCampaignModal(false);
      // Refresh campaigns
      const updatedCampaigns = await erpService.getCampaigns(organization.id);
      setCampaigns(updatedCampaigns);
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetMetrics = async () => {
    if (!organization) return;
    try {
      setSyncing(true);
      await erpService.updateMetrics({
        id: metrics?.id,
        organization_id: organization.id,
        alcance_digital: 0,
        leads_qualificados: 0,
        conversao: 0,
        alcance_change: '0%',
        leads_change: '0%',
        conversao_change: '0%'
      });
    } catch (error) {
      console.error('Error resetting metrics:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncMetrics = async () => {
    if (!organization) return;
    try {
      setSyncing(true);
      await erpService.syncMetrics(organization.id);
    } catch (error) {
      console.error('Error syncing metrics:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    let unsubscribeMetrics: () => void;

    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const orgData = await ecossistemaService.getOrganizationByUserId(userId);
          if (orgData) {
            const [diagData, campaignsData, assetsData, oscAssetsData] = await Promise.all([
              ecossistemaService.getLatestDiagnostic(orgData.id),
              erpService.getCampaigns(orgData.id),
              erpService.getAssets(),
              erpService.getOSCAssets(orgData.id)
            ]);

          setOrganization(orgData);
          setDiagnostic(diagData);
          setCampaigns(campaignsData);
          setAssets(assetsData);
          setOscAssets(oscAssetsData);
          setIdentities(erpService.getInstitutionalIdentities());

          // Get recommendations based on maturity level
          const maturityLevelMap: Record<string, number> = {
            'Iniciante': 1,
            'Estruturação': 2,
            'Avançado': 3
          };
          const level = maturityLevelMap[diagData?.maturity_level || 'Iniciante'] || 1;
          const recommendations = await erpService.getRecommendedAssets(level);
          setRecommendedAssets(recommendations);

          // Subscribe to metrics
          unsubscribeMetrics = erpService.subscribeToMetrics(orgData.id, (newMetrics) => {
            setMetrics(newMetrics);
          });
        }
      }
    } catch (error) {
        console.error('Error fetching ERP data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (unsubscribeMetrics) unsubscribeMetrics();
    };
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 text-brand-gold-dark text-[10px] font-black uppercase tracking-widest mb-6 border border-brand-gold/20">
              <LayoutDashboard size={14} />
              Gestão Estratégica 360°
            </div>
            <h1 className="text-5xl font-display font-black tracking-tighter text-slate-900 leading-none mb-4">
              {activeTab === 'development' ? (
                <>Ecossistema <span className="text-brand-gold-dark">ERP & Digital</span></>
              ) : (
                <>Identidades <span className="text-brand-gold-dark">Institucionais</span></>
              )}
            </h1>
            <p className="text-slate-500 font-medium max-w-2xl">
              {activeTab === 'development' 
                ? 'Portfólio de tecnologias e metodologias para o fortalecimento da base democrática do Terceiro Setor.'
                : 'Gestão de identidades, vínculos e cargos (CFRH) da estrutura organizacional CACI.'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 no-print">
            <button 
              onClick={() => navigate('/ecossistema/command-center')}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
            >
              <Shield size={16} />
              Command Center
            </button>
            <div className="bg-white p-1 rounded-2xl border border-slate-200 flex gap-1">
              <button 
                onClick={() => setActiveTab('development')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'development' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                Ativos de Desenv.
              </button>
              <button 
                onClick={() => setActiveTab('identities')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'identities' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                Identidades (CFRH)
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleResetMetrics}
                disabled={syncing}
                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-400 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:text-slate-900 active:scale-95 transition-all disabled:opacity-50"
              >
                Resetar
              </button>
              <button 
                onClick={handleSyncMetrics}
                disabled={syncing}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {syncing ? <Loader2 className="animate-spin" size={14} /> : <TrendingUp size={14} />}
                Sincronizar
              </button>
              <button 
                onClick={() => setShowNewCampaignModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-brand-gold text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-gold/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={14} />
                Nova Campanha
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
              >
                <Printer size={14} />
                Imprimir
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-brand-gold" size={40} />
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Sincronizando Dados...</p>
          </div>
        ) : activeTab === 'development' ? (
          <div className="space-y-16">
            {/* Marketing & Digital Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  label: 'Alcance Digital', 
                  value: metrics?.alcance_digital || 0, 
                  change: metrics?.alcance_change || '0%', 
                  icon: Globe, 
                  color: 'text-blue-600', 
                  bg: 'bg-blue-50',
                  isK: true
                },
                { 
                  label: 'Leads Qualificados', 
                  value: metrics?.leads_qualificados || 0, 
                  change: metrics?.leads_change || '0%', 
                  icon: Target, 
                  color: 'text-emerald-600', 
                  bg: 'bg-emerald-50' 
                },
                { 
                  label: 'Conversão', 
                  value: metrics?.conversao || 0, 
                  change: metrics?.conversao_change || '0%', 
                  icon: BarChart3, 
                  color: 'text-brand-gold-dark', 
                  bg: 'bg-brand-gold/10',
                  isPercentage: true
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6"
                >
                  <div className={`w-16 h-16 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                    <stat.icon size={32} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-display font-black text-slate-900">
                        <AnimatedCounter 
                          value={stat.value} 
                          isK={stat.isK} 
                          isPercentage={stat.isPercentage} 
                        />
                      </div>
                      <div className="text-[10px] font-bold text-emerald-600">{stat.change}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Ativos Digitais Cards */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Ativos em Operação</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Ativos digitais vinculados à sua organização.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase tracking-widest">
                  <div className="w-1 h-1 rounded-full bg-emerald-600 animate-pulse" />
                  Sincronizado em Tempo Real
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {assets.filter(a => oscAssets.some(oa => oa.asset_id === a.id && oa.status === 'active')).length > 0 ? (
                  assets.filter(a => oscAssets.some(oa => oa.asset_id === a.id && oa.status === 'active')).map((asset, i) => (
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-100 group cursor-pointer hover:scale-[1.02] transition-all"
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-8">
                        {asset.type === 'website' && <Globe size={24} />}
                        {asset.type === 'landing_page' && <FileText size={24} />}
                        {asset.type === 'email_flow' && <Mail size={24} />}
                        {asset.type === 'api_integration' && <Network size={24} />}
                      </div>
                      <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Ativo em Uso</div>
                      <h3 className="text-xl font-black mb-4 text-slate-900">{asset.name}</h3>
                      <p className="text-sm font-medium leading-relaxed text-slate-500">
                        {asset.performance_impact || 'Otimizando processos institucionais.'}
                      </p>
                      <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ROI: {asset.roi || '0'}x</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{asset.usage_count || 0} OSCs</div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-3 bg-white p-12 rounded-[50px] border border-dashed border-slate-200 text-center">
                    <p className="text-slate-400 font-medium italic">Nenhum ativo em operação no momento. Explore o catálogo para ativar novas soluções.</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Recommendations based on Maturity */}
            {recommendedAssets.length > 0 && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900">Recomendações Inteligentes</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                      Baseado no seu nível de maturidade: <span className="text-brand-gold-dark font-black">{diagnostic?.classification || 'Inicial'}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 text-brand-gold-dark text-[10px] font-black uppercase tracking-widest border border-brand-gold/20">
                    <Cpu size={14} />
                    Motor de IA CACI
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {recommendedAssets.map((asset, i) => (
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="bg-slate-900 p-10 rounded-[50px] text-white flex flex-col md:flex-row gap-8 items-center group cursor-pointer hover:bg-slate-800 transition-all"
                    >
                      <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center shrink-0">
                        {asset.type === 'website' && <Globe size={32} />}
                        {asset.type === 'landing_page' && <FileText size={32} />}
                        {asset.type === 'email_flow' && <Mail size={32} />}
                        {asset.type === 'api_integration' && <Network size={32} />}
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <div className="text-[10px] font-black text-brand-gold uppercase tracking-widest mb-2">Próximo Passo Recomendado</div>
                        <h3 className="text-2xl font-black mb-2">{asset.name}</h3>
                        <p className="text-white/60 text-sm font-medium leading-relaxed mb-4">
                          OSCs no seu nível que utilizam este ativo têm <span className="text-white font-black">{asset.performance_impact}</span>.
                        </p>
                        <button className="px-6 py-3 bg-brand-gold text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                          Ativar Agora
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Levels Grid */}
            <div className="space-y-8">
              <h2 className="text-3xl font-black text-slate-900">Níveis de Maturidade</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { 
                    level: 'Nível 1', 
                    title: 'Estruturantes', 
                    desc: 'Fundamentos jurídicos e segurança conceitual.',
                    items: ['E-books de Governança', 'Manuais de Gestão Digital'],
                    icon: BookOpen,
                    color: 'bg-blue-50 text-blue-600'
                  },
                  { 
                    level: 'Nível 2', 
                    title: 'Ativos Operacionais', 
                    desc: 'Tecnologia aplicada ao dia a dia da sua OSC.',
                    items: ['Ponto Digital Auditável', 'Urna Digital Blockchain'],
                    icon: Cpu,
                    color: 'bg-emerald-50 text-emerald-600'
                  },
                  { 
                    level: 'Nível 3', 
                    title: 'Rede Estratégica', 
                    desc: 'Conexão, inteligência e captação institucional.',
                    items: ['Comunidade de Prática', 'Selo de Maturidade IMI'],
                    icon: Network,
                    color: 'bg-brand-gold/10 text-brand-gold-dark'
                  },
                ].map((lvl, i) => (
                  <motion.div 
                    key={lvl.level}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm relative overflow-hidden group"
                  >
                    <div className={`w-14 h-14 rounded-2xl ${lvl.color} flex items-center justify-center mb-8`}>
                      <lvl.icon size={28} />
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{lvl.level}</div>
                    <h3 className="text-2xl font-black text-slate-900 mb-4">{lvl.title}</h3>
                    <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">{lvl.desc}</p>
                    
                    <div className="space-y-3">
                      {lvl.items.map(item => (
                        <div key={item} className="flex items-center gap-3 text-xs font-bold text-slate-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Catalog Table */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-slate-900">Catálogo de Ativos Institucionais</h2>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{CATALOG_DATA.length} Soluções Disponíveis</span>
              </div>
              
              <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Solução / Ativo</th>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor de Desenv.</th>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição Técnica</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {assets.map((item, i) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-8">
                            <div className="font-black text-slate-900">{item.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Users size={10} className="text-slate-400" />
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.usage_count || 0} OSCs utilizando</span>
                            </div>
                          </td>
                          <td className="p-8">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.type}</span>
                          </td>
                          <td className="p-8">
                            <div className="font-bold text-slate-900">{item.performance_impact || 'Sob Consulta'}</div>
                            <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">ROI: {item.roi || '0'}x</div>
                          </td>
                          <td className="p-8">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              item.status === 'ativo' || item.status === 'recomendado' 
                                ? 'bg-emerald-100 text-emerald-600' 
                                : 'bg-brand-gold/10 text-brand-gold'
                            }`}>
                                {item.status}
                            </span>
                          </td>
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs flex-1">{item.department || 'Geral'}</p>
                              <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-brand-gold" 
                                  style={{ width: `${item.popularity || 0}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Config & Support */}
            <div className="grid lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 bg-white p-12 rounded-[50px] border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row items-center gap-12 mb-12">
                  <div className="w-24 h-24 rounded-3xl bg-brand-gold/10 text-brand-gold flex items-center justify-center shrink-0">
                    <ShieldCheck size={48} />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Segurança & Conformidade</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Todos os ativos do catálogo seguem rigorosamente as normas do MROSC e as melhores práticas de governança do Terceiro Setor.
                    </p>
                  </div>
                  <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shrink-0">
                    Ver Certificações
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8 pt-12 border-t border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <Database size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base de Dados</div>
                      <div className="text-sm font-black text-slate-900">Sincronizado</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <Settings size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Integrações API</div>
                      <div className="text-sm font-black text-slate-900">4 Ativas</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 bg-brand-gold p-12 rounded-[50px] text-white flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black mb-4">Suporte Estratégico</h3>
                  <p className="text-white/80 text-sm font-medium mb-8 leading-relaxed">
                    Precisa de ajuda para configurar suas campanhas ou integrar novos ativos?
                  </p>
                </div>
                <button className="w-full py-4 bg-white text-brand-gold-dark rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                  Falar com Especialista
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Identities Header Info */}
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { label: 'Total Identidades', count: identities.length, color: 'text-brand-purple' },
                { label: 'Vínculos Ativos', count: identities.filter(i => i.status === 'ATIVO').length, color: 'text-emerald-600' },
                { label: 'Áreas Cobertas', count: new Set(identities.map(i => i.area)).size, color: 'text-blue-600' },
                { label: 'Unidades', count: new Set(identities.map(i => i.unidade)).size, color: 'text-brand-gold-dark' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                  <div className="text-3xl font-display font-black text-slate-900 mb-1">{stat.count}</div>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${stat.color}`}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Identities Table */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-slate-900">Registro de Identidades Institucionais (CFRH)</h2>
                <div className="flex items-center gap-4">
                  <div className="relative no-print">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome ou CFRH..."
                      className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/20 w-64"
                    />
                  </div>
                  <button className="p-3 bg-brand-purple text-white rounded-xl hover:scale-105 active:scale-95 transition-all no-print">
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidade / CFRH</th>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vínculo / Área</th>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo / Função</th>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail Institucional</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {identities.map((identity) => (
                        <tr key={identity.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center font-black text-xs">
                                {identity.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </div>
                              <div>
                                <div className="font-black text-slate-900 group-hover:text-brand-purple transition-colors">{identity.nome}</div>
                                <div className="text-[10px] font-mono text-slate-400 mt-1">{identity.cfrh}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-8">
                            <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{identity.vinculo}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{identity.area}</div>
                          </td>
                          <td className="p-8">
                            <div className="font-bold text-slate-900">{identity.funcao}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{identity.unidade}</div>
                          </td>
                          <td className="p-8">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              identity.status === 'ATIVO' 
                                ? 'bg-emerald-100 text-emerald-600' 
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              {identity.status}
                            </span>
                            <div className="text-[8px] font-black text-emerald-600 mt-1 uppercase tracking-widest flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              {identity.validacao}
                            </div>
                          </td>
                          <td className="p-8">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                              <Mail size={14} className="text-slate-300" />
                              {identity.email_institucional}
                            </div>
                            <div className="text-[8px] text-slate-400 font-mono mt-1">{identity.registro_id}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Structure Summary */}
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { label: 'Diretoria', count: identities.filter(i => i.area === 'DIRETORIA').length, color: 'text-brand-purple' },
                { label: 'Financeiro', count: identities.filter(i => i.area === 'FINANCEIRO').length, color: 'text-emerald-600' },
                { label: 'Tecnologia', count: identities.filter(i => i.area === 'TECNOLOGIA').length, color: 'text-blue-600' },
                { label: 'Conselhos', count: identities.filter(i => i.area === 'CONSELHOS').length, color: 'text-rose-600' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                  <div className="text-3xl font-display font-black text-slate-900 mb-1">{stat.count}</div>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${stat.color}`}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Campaign Modal */}
      {showNewCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm no-print">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden"
          >
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-900">Nova Campanha Estratégica</h3>
                <button 
                  onClick={() => setShowNewCampaignModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Título da Campanha</label>
                  <input 
                    type="text" 
                    value={newCampaign.title}
                    onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                    placeholder="Ex: Campanha de Inverno 2026"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Objetivo</label>
                  <textarea 
                    value={newCampaign.goal}
                    onChange={(e) => setNewCampaign({ ...newCampaign, goal: e.target.value })}
                    placeholder="Descreva o objetivo estratégico..."
                    rows={3}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-gold/20 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Orçamento (R$)</label>
                    <input 
                      type="number" 
                      value={newCampaign.budget}
                      onChange={(e) => setNewCampaign({ ...newCampaign, budget: Number(e.target.value) })}
                      placeholder="0,00"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Data de Início</label>
                    <input 
                      type="date" 
                      value={newCampaign.start_date}
                      onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => setShowNewCampaignModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateCampaign}
                  disabled={syncing}
                  className="flex-1 py-4 bg-brand-gold text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-gold/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {syncing ? <Loader2 className="animate-spin mx-auto" size={14} /> : 'Criar Campanha'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ERPDashboard;
