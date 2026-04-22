import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  ShieldCheck, 
  ClipboardCheck, 
  ArrowRight, 
  CheckCircle2,
  Globe,
  MapPin,
  Users,
  Briefcase,
  AlertCircle,
  Printer,
  Lock,
  LogIn
} from 'lucide-react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase';
import { processarAdesaoEcossistema, AdesaoInput } from '../../services/ecossistemaService';

const ProtocoloAdesao: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [regType, setRegType] = useState<'osc' | 'profissional' | 'especialista' | 'parceiro'>('osc');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          nome_completo: currentUser.displayName || prev.nome_completo,
          email: currentUser.email || prev.email,
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      alert("Erro ao fazer login com Google.");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    
    if (type === 'parceiro') setRegType('parceiro');
    else if (type === 'profissional' || location.pathname.includes('profissional')) setRegType('profissional');
    else if (type === 'especialista' || location.pathname.includes('especialista')) setRegType('especialista');
    else setRegType('osc');
  }, [location.pathname, location.search]);

  const [formData, setFormData] = useState({
    // Dados Pessoais
    nome_completo: '',
    email: '',
    telefone: '',
    
    // Dados da Organização
    nome_organizacao: '',
    cnpj: '',
    municipio: '',
    estado: '',
    ano_fundacao: '',
    area_atuacao: 'Assistência Social',
    
    // Classificação IPEA
    privada: false,
    sem_fins_lucrativos: false,
    institucionalizada: false,
    autoadministrada: false,
    voluntaria: false,
    
    // Dados de Atuação
    beneficiarios: '',
    colaboradores: '',
    captacao_ativa: false,
    desafios: '',
    
    // Compliance
    aceitou_lgpd: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const validateCNPJ = (cnpj: string) => {
    const regex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
    return regex.test(cnpj);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.aceitou_lgpd) {
      alert("Você deve autorizar o tratamento de dados (LGPD) para continuar.");
      return;
    }

    if (!validateCNPJ(formData.cnpj)) {
      alert("Por favor, insira um CNPJ válido no formato 00.000.000/0000-00");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const input: AdesaoInput = {
        user: {
          nome: formData.nome_completo,
          email: formData.email,
          telefone: formData.telefone,
        },
        organization: {
          nome: formData.nome_organizacao,
          cnpj: formData.cnpj,
          municipio: formData.municipio,
          estado: formData.estado,
          ano_fundacao: parseInt(formData.ano_fundacao),
          area_atuacao: formData.area_atuacao,
          beneficiarios: parseInt(formData.beneficiarios),
          colaboradores: parseInt(formData.colaboradores),
          captacao_ativa: formData.captacao_ativa,
          desafios: formData.desafios,
        },
        classification: {
          privada: formData.privada,
          sem_fins_lucrativos: formData.sem_fins_lucrativos,
          institucionalizada: formData.institucionalizada,
          autoadministrada: formData.autoadministrada,
          voluntaria: formData.voluntaria,
        },
        compliance: {
          aceitou_lgpd: formData.aceitou_lgpd,
        }
      };

      const result = await processarAdesaoEcossistema(input);
      setSuccess(true);
      
      // Delay navigation to show success message
      setTimeout(() => {
        if (regType === 'parceiro') {
          navigate('/ecossistema/2fa', { 
            state: { 
              orgId: result.orgId, 
              orgName: formData.nome_organizacao,
              email: formData.email 
            } 
          });
        } else {
          navigate('/ecossistema/diagnostico', { state: { orgId: result.orgId, orgName: formData.nome_organizacao } });
        }
      }, 3000);
    } catch (err: any) {
      console.error(err);
      let msg = "Erro ao processar protocolo de adesão.";
      try {
        const parsed = JSON.parse(err.message);
        msg = parsed.error || msg;
      } catch {
        msg = err.message || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-sequential-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-sequential-0 min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-12 rounded-[60px] shadow-2xl text-center space-y-8 border border-slate-100"
        >
          <div className="w-20 h-20 bg-brand-blue/10 text-brand-blue rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock size={40} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Autenticação Necessária</h2>
            <p className="text-slate-500 font-medium">
              Para garantir a segurança e integridade dos dados no Ecossistema CACI, você precisa estar autenticado para realizar a adesão institucional.
            </p>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-blue transition-all shadow-xl shadow-slate-200"
          >
            <LogIn size={18} />
            Entrar com Google
          </button>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Ambiente Seguro • CACI Strategic
          </p>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-sequential-0 min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-12 rounded-[60px] shadow-2xl text-center space-y-8 border border-slate-100"
        >
          <div className="w-24 h-24 bg-brand-emerald/10 text-brand-emerald rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Cadastro Finalizado!</h2>
            <p className="text-slate-500 font-medium">
              O protocolo de adesão da <span className="text-brand-blue font-bold">{formData.nome_organizacao}</span> foi registrado com sucesso no Ecossistema CACI.
            </p>
          </div>
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-left space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Status</span>
              <span className="text-brand-emerald">Ativo</span>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Protocolo</span>
              <span className="text-slate-900">#{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 no-print">
            <div className="flex items-center justify-center gap-3 text-brand-blue font-black text-[10px] uppercase tracking-widest animate-pulse">
              <ArrowRight size={14} />
              Redirecionando para o Diagnóstico...
            </div>
            <button 
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
            >
              <Printer size={14} />
              Imprimir Protocolo
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-sequential-0 min-h-screen">
      <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue/5 text-brand-blue text-[10px] font-black uppercase tracking-widest mb-6 border border-brand-blue/10">
          <ShieldCheck size={14} />
          Protocolo Institucional
        </div>
        <h1 className="text-4xl font-display font-black tracking-tighter text-slate-900 leading-none mb-4">
          {regType === 'osc' ? 'Protocolo de Adesão ao ' : 
           regType === 'profissional' ? 'Cadastro de Profissional no ' : 
           regType === 'parceiro' ? 'Protocolo de Parceria no ' :
           'Cadastro de Especialista no '}
          <span className="text-brand-blue">Ecossistema CACI</span>
        </h1>
        <p className="text-lg text-slate-500 font-medium">
          {regType === 'osc' ? 'Sistema oficial de desenvolvimento e fortalecimento de Organizações da Sociedade Civil.' :
           regType === 'profissional' ? 'Integre-se como profissional ao Ecossistema CACI e contribua com seu talento.' :
           regType === 'parceiro' ? 'Programa de Parcerias Estratégicas para instituições, empresas e órgãos públicos.' :
           'Torne-se um especialista parceiro do Ecossistema CACI e ajude a fortalecer o setor.'}
        </p>
      </div>

      <div className="bg-white p-8 sm:p-16 rounded-[60px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-16">
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl bg-red-50 border border-red-100 flex items-center gap-4 text-red-600"
            >
              <AlertCircle size={20} />
              <p className="text-sm font-bold">{error}</p>
            </motion.div>
          )}

          {/* Section 1: Dados Pessoais */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-black text-sm">1</div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dados do Responsável</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  required
                  name="nome_completo"
                  value={formData.nome_completo}
                  onChange={handleInputChange}
                  type="text" 
                  className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium" 
                  placeholder="Seu nome" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                <input 
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  type="email" 
                  className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium" 
                  placeholder="seu@email.com" 
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone (com WhatsApp)</label>
              <input 
                required
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                type="tel" 
                className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium" 
                placeholder="(00) 00000-0000" 
              />
            </div>
          </section>

          {/* Section 2: Dados da Organização */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-black text-sm">2</div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {regType === 'osc' ? 'Dados da Organização' : 'Dados Profissionais'}
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {regType === 'osc' ? 'Nome da Organização' : 'Instituição/Empresa'}
                </label>
                <input 
                  required
                  name="nome_organizacao"
                  value={formData.nome_organizacao}
                  onChange={handleInputChange}
                  type="text" 
                  className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium" 
                  placeholder={regType === 'osc' ? "Nome da OSC" : "Onde você atua"} 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label>
                <input 
                  required={regType === 'osc'}
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleInputChange}
                  type="text" 
                  className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium" 
                  placeholder="00.000.000/0000-00" 
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-8">
              <div className="sm:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Município</label>
                <input 
                  required
                  name="municipio"
                  value={formData.municipio}
                  onChange={handleInputChange}
                  type="text" 
                  className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium" 
                  placeholder="Ex: São Paulo" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                <input 
                  required
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  type="text" 
                  maxLength={2}
                  className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium uppercase" 
                  placeholder="UF" 
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ano de Fundação</label>
                <input 
                  required
                  name="ano_fundacao"
                  value={formData.ano_fundacao}
                  onChange={handleInputChange}
                  type="number" 
                  className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium" 
                  placeholder="Ex: 2003" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Área de Atuação</label>
                <select 
                  name="area_atuacao"
                  value={formData.area_atuacao}
                  onChange={handleInputChange}
                  className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all appearance-none font-medium"
                >
                  <option>Assistência Social</option>
                  <option>Educação</option>
                  <option>Cultura</option>
                  <option>Meio Ambiente</option>
                  <option>Saúde</option>
                  <option>Direitos Humanos</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 3: Classificação */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-black text-sm">3</div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {regType === 'parceiro' ? 'Classificação do Parceiro' : 'Classificação OSC (Base IPEA)'}
              </h2>
            </div>
            
            {regType === 'parceiro' ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { name: 'is_empresa', label: 'Empresa Privada' },
                  { name: 'is_orgao_publico', label: 'Órgão Público' },
                  { name: 'is_mei', label: 'Microempreendedor Individual (MEI)' },
                  { name: 'is_consultoria', label: 'Consultoria Especializada' },
                  { name: 'is_instituto', label: 'Instituto/Fundação Empresarial' },
                ].map((item) => (
                  <label key={item.name} className="flex items-center gap-4 p-6 rounded-3xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-white hover:shadow-lg transition-all">
                    <input 
                      type="checkbox" 
                      name={item.name}
                      checked={(formData as any)[item.name]}
                      onChange={handleInputChange}
                      className="w-6 h-6 rounded-lg border-slate-300 text-brand-blue focus:ring-brand-blue" 
                    />
                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { name: 'privada', label: 'Organização privada?' },
                  { name: 'sem_fins_lucrativos', label: 'Sem fins lucrativos?' },
                  { name: 'institucionalizada', label: 'Institucionalizada?' },
                  { name: 'autoadministrada', label: 'Autoadministrada?' },
                  { name: 'voluntaria', label: 'Voluntária?' },
                ].map((item) => (
                  <label key={item.name} className="flex items-center gap-4 p-6 rounded-3xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-white hover:shadow-lg transition-all">
                    <input 
                      type="checkbox" 
                      name={item.name}
                      checked={(formData as any)[item.name]}
                      onChange={handleInputChange}
                      className="w-6 h-6 rounded-lg border-slate-300 text-brand-blue focus:ring-brand-blue" 
                    />
                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 flex items-start gap-4">
              <AlertCircle size={20} className="text-amber-600 shrink-0 mt-1" />
              <p className="text-xs text-amber-700 font-medium">
                {regType === 'parceiro' ? 
                  'A classificação correta permite que a CACI direcione o modelo de parceria mais adequado ao seu perfil institucional.' :
                  'Caso alguma resposta seja "não", a iniciativa será classificada como "Iniciativa em estruturação" até que atenda aos critérios do Mapa das OSCs (IPEA).'}
              </p>
            </div>
          </section>

          {/* Section 4: Dados de Atuação */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-black text-sm">4</div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dados de Atuação</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Beneficiários</label>
                <input 
                  required
                  name="beneficiarios"
                  value={formData.beneficiarios}
                  onChange={handleInputChange}
                  type="number" 
                  className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium" 
                  placeholder="Ex: 150" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Colaboradores</label>
                <input 
                  required
                  name="colaboradores"
                  value={formData.colaboradores}
                  onChange={handleInputChange}
                  type="number" 
                  className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium" 
                  placeholder="Ex: 5" 
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-4 p-6 rounded-3xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-white hover:shadow-lg transition-all">
                <input 
                  type="checkbox" 
                  name="captacao_ativa"
                  checked={formData.captacao_ativa}
                  onChange={handleInputChange}
                  className="w-6 h-6 rounded-lg border-slate-300 text-brand-blue focus:ring-brand-blue" 
                />
                <span className="text-sm font-bold text-slate-700">Possui captação ativa de recursos?</span>
              </label>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Principais Desafios</label>
              <textarea 
                required
                name="desafios"
                value={formData.desafios}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium resize-none" 
                placeholder="Descreva os maiores desafios da organização hoje..." 
              />
            </div>
          </section>

          {/* Section 5: LGPD */}
          <section className="space-y-8 p-10 rounded-[40px] bg-slate-900 text-white">
            <div className="flex items-center gap-4">
              <ShieldCheck size={24} className="text-brand-blue" />
              <h2 className="text-xl font-black">Consentimento LGPD</h2>
            </div>
            
            <label className="flex items-start gap-4 cursor-pointer group">
              <input 
                required
                type="checkbox" 
                name="aceitou_lgpd"
                checked={formData.aceitou_lgpd}
                onChange={handleInputChange}
                className="mt-1 w-6 h-6 rounded-lg border-white/20 bg-white/5 text-brand-blue focus:ring-brand-blue" 
              />
              <span className="text-xs text-slate-400 leading-relaxed group-hover:text-white transition-colors">
                Declaro que as informações prestadas são verdadeiras e autorizo o tratamento dos dados pelo Ecossistema CACI para fins de diagnóstico institucional, geração de indicadores e acompanhamento, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018).
              </span>
            </label>
          </section>

          <button 
            disabled={loading}
            type="submit" 
            className="w-full py-8 bg-brand-blue text-white rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand-blue/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando Adesão...' : 'Concluir Protocolo de Adesão'}
          </button>
        </form>
      </div>
    </div>
  </div>
);
};

export default ProtocoloAdesao;
