import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Users, Printer, ClipboardCheck, ChevronRight, 
  ArrowRight, Heart, ShieldCheck, Download, FileText,
  Mail, Phone, MapPin, Calendar, Info, CheckCircle2
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '../App';

interface FormState {
  nome: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  sexo: string;
  telefone: string;
  email: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  cep: string;
  // Beneficiary specific
  rendaFamiliar: string;
  membrosFamilia: string;
  observacoes: string;
  // Associate specific
  profissao: string;
  estadoCivil: string;
  tipoAssociacao: string;
}

const initialFormState: FormState = {
  nome: '',
  cpf: '',
  rg: '',
  dataNascimento: '',
  sexo: '',
  telefone: '',
  email: '',
  endereco: '',
  numero: '',
  bairro: '',
  cidade: '',
  cep: '',
  rendaFamiliar: '',
  membrosFamilia: '',
  observacoes: '',
  profissao: '',
  estadoCivil: '',
  tipoAssociacao: 'Efetivo',
};

export default function BeneficiaryArea() {
  const [activeTab, setActiveTab] = useState<'beneficiario' | 'associado'>('beneficiario');
  const [form, setForm] = useState<FormState>(initialFormState);
  const [protocol, setProtocol] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    rg: null,
    cpf: null,
    residencia: null,
  });
  
  const formRef = useRef<HTMLDivElement>(null);
  const protocolRef = useRef<HTMLDivElement>(null);

  const handlePrintForm = useReactToPrint({
    contentRef: formRef,
    documentTitle: `Formulario_${activeTab === 'beneficiario' ? 'Beneficiario' : 'Associado'}_${form.nome || 'CACI'}`,
  });

  const handlePrintProtocol = useReactToPrint({
    contentRef: protocolRef,
    documentTitle: `Protocolo_Inscricao_CACI_${protocol}`,
  });

  const generateProtocol = () => {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    const prefix = activeTab === 'beneficiario' ? 'BEN' : 'ASC';
    return `${prefix}-${year}-${random}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProtocol = generateProtocol();
    setProtocol(newProtocol);
    setSubmitted(true);
    
    // Simulate document organization and reporting
    const report = {
      protocol: newProtocol,
      type: activeTab === 'beneficiario' ? 'Usuário/Beneficiário' : 'Associado',
      name: form.nome,
      timestamp: new Date().toISOString(),
      routing: {
        rg: files.rg ? 'Pasta Interna: /documentos/identidade/rg' : 'Não enviado',
        cpf: files.cpf ? 'Pasta Interna: /documentos/identidade/cpf' : 'Não enviado',
        residencia: files.residencia ? 'Pasta Interna: /documentos/enderecos' : 'Não enviado',
        form: 'Pasta Transparência: /publico/formularios (Anonimizado)'
      },
      destination: activeTab === 'beneficiario' ? 'Assistência Social' : 'Administração/Associados',
      emails: ['diretoria@caci.ong.br', 'ti@caci.ong.br']
    };

    console.log('--- Relatório de Governança CACI ---');
    console.log(JSON.stringify(report, null, 2));
    console.log('Status: Documentos encaminhados para pastas internas seguras.');
    console.log('Cópia enviada para: diretoria@caci.ong.br, ti@caci.ong.br');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(initialFormState);
    setProtocol(null);
    setSubmitted(false);
  };

  return (
    <div className="w-full space-y-12">
      {/* Tab Navigation */}
      <div className="flex flex-row flex-wrap gap-4">
        {[
          { id: 'beneficiario', label: 'Usuário/Beneficiário', icon: <User size={18} /> },
          { id: 'associado', label: 'Associado', icon: <Users size={18} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setSubmitted(false);
              setProtocol(null);
            }}
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

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[40px] p-8 sm:p-12 border border-slate-200 shadow-xl shadow-slate-200/50"
          >
            <div className="max-w-3xl mb-10">
              <h3 className="text-2xl font-black text-slate-900 mb-4">
                {activeTab === 'beneficiario' ? 'Interesse em Benefícios (Cesta Básica)' : 'Cadastro de Associado CACI'}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                {activeTab === 'beneficiario' 
                  ? 'Preencha os dados abaixo para registrar seu interesse em nossos programas de assistência alimentar. Suas informações serão tratadas com sigilo e encaminhadas ao departamento social.'
                  : 'Seja parte da nossa instituição. O cadastro de associados segue os padrões nacionais e as normativas institucionais da CACI.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Common Fields */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome Completo</label>
                  <input 
                    type="text" 
                    name="nome"
                    required
                    value={form.nome}
                    onChange={handleChange}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white transition-all outline-none text-sm font-medium"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">CPF</label>
                    <input 
                      type="text" 
                      name="cpf"
                      required
                      value={form.cpf}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white transition-all outline-none text-sm font-medium"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">RG</label>
                    <input 
                      type="text" 
                      name="rg"
                      required
                      value={form.rg}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white transition-all outline-none text-sm font-medium"
                      placeholder="00.000.000-0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Data de Nascimento</label>
                  <input 
                    type="date" 
                    name="dataNascimento"
                    required
                    value={form.dataNascimento}
                    onChange={handleChange}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white transition-all outline-none text-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Telefone / WhatsApp</label>
                  <input 
                    type="tel" 
                    name="telefone"
                    required
                    value={form.telefone}
                    onChange={handleChange}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white transition-all outline-none text-sm font-medium"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white transition-all outline-none text-sm font-medium"
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Endereço</label>
                  <div className="grid grid-cols-12 gap-4">
                    <input 
                      type="text" 
                      name="endereco"
                      required
                      value={form.endereco}
                      onChange={handleChange}
                      className="col-span-8 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white transition-all outline-none text-sm font-medium"
                      placeholder="Rua, Avenida, etc."
                    />
                    <input 
                      type="text" 
                      name="numero"
                      required
                      value={form.numero}
                      onChange={handleChange}
                      className="col-span-4 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white transition-all outline-none text-sm font-medium"
                      placeholder="Nº"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Bairro</label>
                  <input 
                    type="text" 
                    name="bairro"
                    required
                    value={form.bairro}
                    onChange={handleChange}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white transition-all outline-none text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Cidade</label>
                    <input 
                      type="text" 
                      name="cidade"
                      required
                      value={form.cidade}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white transition-all outline-none text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">CEP</label>
                    <input 
                      type="text" 
                      name="cep"
                      required
                      value={form.cep}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white transition-all outline-none text-sm font-medium"
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                {/* Specific Fields */}
                {activeTab === 'beneficiario' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Renda Familiar Mensal</label>
                      <input 
                        type="text" 
                        name="rendaFamiliar"
                        required
                        value={form.rendaFamiliar}
                        onChange={handleChange}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white transition-all outline-none text-sm font-medium"
                        placeholder="R$ 0,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Membros na Família</label>
                      <input 
                        type="number" 
                        name="membrosFamilia"
                        required
                        value={form.membrosFamilia}
                        onChange={handleChange}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white transition-all outline-none text-sm font-medium"
                        placeholder="Quantidade"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Observações / Necessidades</label>
                      <textarea 
                        name="observacoes"
                        value={form.observacoes}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white transition-all outline-none text-sm font-medium resize-none"
                        placeholder="Descreva brevemente sua situação ou necessidades específicas..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Profissão</label>
                      <input 
                        type="text" 
                        name="profissao"
                        required
                        value={form.profissao}
                        onChange={handleChange}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white transition-all outline-none text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Estado Civil</label>
                      <select 
                        name="estadoCivil"
                        required
                        value={form.estadoCivil}
                        onChange={handleChange}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white transition-all outline-none text-sm font-medium appearance-none"
                      >
                        <option value="">Selecione...</option>
                        <option value="Solteiro(a)">Solteiro(a)</option>
                        <option value="Casado(a)">Casado(a)</option>
                        <option value="Divorciado(a)">Divorciado(a)</option>
                        <option value="Viúvo(a)">Viúvo(a)</option>
                        <option value="União Estável">União Estável</option>
                      </select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Associação</label>
                      <div className="grid sm:grid-cols-3 gap-4">
                        {['Efetivo', 'Colaborador', 'Benemérito'].map((tipo) => (
                          <button
                            key={tipo}
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, tipoAssociacao: tipo }))}
                            className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                              form.tipoAssociacao === tipo 
                                ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20' 
                                : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-brand-blue'
                            }`}
                          >
                            {tipo}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Document Upload Section */}
                <div className="sm:col-span-2 space-y-4 pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                      <Download size={16} />
                    </div>
                    <h4 className="font-black text-slate-900 text-[10px] uppercase tracking-widest">Documentação Anexa</h4>
                  </div>
                  
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { id: 'rg', label: 'RG (Frente/Verso)', icon: <User size={16} /> },
                      { id: 'cpf', label: 'CPF', icon: <FileText size={16} /> },
                      { id: 'residencia', label: 'Comprovante Residência', icon: <MapPin size={16} /> },
                    ].map((doc) => (
                      <div key={doc.id} className="relative">
                        <input
                          type="file"
                          id={doc.id}
                          name={doc.id}
                          onChange={handleFileChange}
                          className="hidden"
                          accept="image/*,application/pdf"
                        />
                        <label
                          htmlFor={doc.id}
                          className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer ${
                            files[doc.id] 
                              ? 'bg-brand-emerald/5 border-brand-emerald/30 text-brand-emerald' 
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-brand-blue hover:text-brand-blue'
                          }`}
                        >
                          {files[doc.id] ? <CheckCircle2 size={24} className="mb-2" /> : doc.icon}
                          <span className="text-[10px] font-black uppercase tracking-widest text-center mt-2">
                            {files[doc.id] ? files[doc.id]?.name : doc.label}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 italic text-center">
                    Formatos aceitos: PDF, JPG, PNG. Tamanho máximo: 5MB por arquivo.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button type="submit" className="flex-1 py-5">
                  <ClipboardCheck size={18} />
                  Enviar Cadastro
                </Button>
                <button 
                  type="button"
                  onClick={() => handlePrintForm()}
                  className="px-10 py-5 rounded-full border-2 border-slate-900 text-slate-900 font-black text-sm uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  Imprimir Formulário
                </button>
              </div>
            </form>

            {/* Hidden Print Content */}
            <div className="hidden">
              <div ref={formRef} className="p-12 font-sans text-slate-900">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-8 mb-8">
                  <div className="flex items-center gap-4">
                    <img src="https://ais-pre-qvipanm3ysdp4ln6k5eqfh-308119493736.us-west2.run.app/Logo_CACI_2026+.SVG.png" alt="Logo CACI" className="w-16 h-16 object-contain" />
                    <div>
                      <h1 className="text-3xl font-black tracking-tighter">CACI</h1>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Casa de Apoio ao Cidadão</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-black uppercase tracking-widest">Ficha de Cadastro</h2>
                    <p className="text-sm font-bold text-slate-500">{activeTab === 'beneficiario' ? 'Usuário/Beneficiário' : 'Associado'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-6 text-sm">
                  <div className="col-span-2 border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nome Completo</span>
                    <span className="font-bold">{form.nome || '________________________________________________'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">CPF</span>
                    <span className="font-bold">{form.cpf || '_________________'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">RG</span>
                    <span className="font-bold">{form.rg || '_________________'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Data de Nascimento</span>
                    <span className="font-bold">{form.dataNascimento || '____/____/____'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Telefone</span>
                    <span className="font-bold">{form.telefone || '_________________'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">E-mail</span>
                    <span className="font-bold">{form.email || '________________________________________________'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Endereço</span>
                    <span className="font-bold">{form.endereco} {form.numero}, {form.bairro}, {form.cidade} - {form.cep}</span>
                  </div>
                  
                  {activeTab === 'beneficiario' ? (
                    <>
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Renda Familiar</span>
                        <span className="font-bold">{form.rendaFamiliar || '_________________'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Membros na Família</span>
                        <span className="font-bold">{form.membrosFamilia || '____'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Observações</span>
                        <p className="font-medium mt-1">{form.observacoes || 'Sem observações adicionais.'}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Profissão</span>
                        <span className="font-bold">{form.profissao || '_________________'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Estado Civil</span>
                        <span className="font-bold">{form.estadoCivil || '_________________'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tipo de Associação</span>
                        <span className="font-bold">{form.tipoAssociacao}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-24 grid grid-cols-2 gap-12">
                  <div className="text-center border-t border-slate-900 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest">Assinatura do Requerente</p>
                  </div>
                  <div className="text-center border-t border-slate-900 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest">Responsável CACI</p>
                  </div>
                </div>

                <div className="mt-12 text-center text-[8px] text-slate-400 uppercase tracking-[0.3em]">
                  Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[40px] p-12 border border-brand-emerald/20 shadow-2xl shadow-brand-emerald/5 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-brand-emerald/10 flex items-center justify-center text-brand-emerald mx-auto mb-8">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4">Cadastro Realizado com Sucesso!</h3>
            <p className="text-slate-600 max-w-lg mx-auto mb-10 font-medium">
              Seu interesse foi registrado em nosso sistema. O protocolo de inscrição foi gerado e seus documentos foram encaminhados para análise.
            </p>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 max-w-md mx-auto mb-10">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Protocolo de Inscrição</span>
              <span className="text-2xl font-black text-brand-blue tracking-tighter">{protocol}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => handlePrintProtocol()}
                className="px-10 py-5 rounded-full bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={18} />
                Imprimir Protocolo
              </button>
              <button 
                onClick={resetForm}
                className="px-10 py-5 rounded-full border-2 border-slate-200 text-slate-600 font-black text-sm uppercase tracking-widest hover:border-brand-blue hover:text-brand-blue transition-all"
              >
                Novo Cadastro
              </button>
            </div>

            {/* Hidden Protocol Content */}
            <div className="hidden">
              <div ref={protocolRef} className="p-12 font-sans text-slate-900 border-4 border-slate-900">
                <div className="text-center mb-12">
                  <img src="https://ais-pre-qvipanm3ysdp4ln6k5eqfh-308119493736.us-west2.run.app/Logo_CACI_2026+.SVG.png" alt="Logo CACI" className="w-24 h-24 object-contain mx-auto mb-4" />
                  <h1 className="text-4xl font-black tracking-tighter">CACI</h1>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Protocolo de Inscrição Institucional</p>
                </div>

                <div className="space-y-8 text-center">
                  <div className="py-8 border-y-2 border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Número do Protocolo</span>
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">{protocol}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-8 text-left max-w-md mx-auto">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Requerente</span>
                      <span className="font-bold text-sm">{form.nome}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Data/Hora</span>
                      <span className="font-bold text-sm">{new Date().toLocaleString('pt-BR')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tipo</span>
                      <span className="font-bold text-sm uppercase">{activeTab === 'beneficiario' ? 'Beneficiário' : 'Associado'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Status</span>
                      <span className="font-bold text-sm text-brand-emerald uppercase tracking-widest">Registrado</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm mx-auto pt-8">
                    Este protocolo comprova a entrega de sua solicitação à CACI. Guarde este número para consultas futuras. A análise será realizada em até 15 dias úteis.
                  </p>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">CACI - Casa de Apoio ao Cidadão | CNPJ: 05.639.031/0001-00</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
