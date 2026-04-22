import React from 'react';
import { motion } from 'motion/react';
import { 
  Handshake, 
  Target, 
  Users, 
  Settings, 
  TrendingUp, 
  FileText, 
  ShieldCheck, 
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  ClipboardCheck,
  RefreshCw
} from 'lucide-react';

const StrategicPartnerships: React.FC = () => {
  return (
    <div className="bg-sequential-0 min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue/5 text-brand-blue text-[10px] font-black uppercase tracking-widest border border-brand-blue/10">
            <Handshake size={14} />
            Programa de Parcerias Estratégicas
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter text-slate-900 leading-none">
            Modelo de Parcerias <span className="text-brand-blue">Estratégicas</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium leading-relaxed">
            O Ecossistema CACI é uma iniciativa voltada à construção de modelos institucionais, produção de conhecimento e desenvolvimento de soluções para o fortalecimento do Terceiro Setor.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-16">
          {/* 1. Apresentação */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-blue text-white flex items-center justify-center text-sm">1</div>
              Apresentação
            </h2>
            <div className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm space-y-4 text-slate-600 leading-relaxed">
              <p>
                A iniciativa integra atividades de formação, pesquisa aplicada, produção de conteúdo e desenvolvimento de ferramentas voltadas à governança e à maturidade organizacional.
              </p>
              <p>
                A CACI atua como uma plataforma estruturante, integrando educação, dados e desenvolvimento institucional — um modelo ainda pouco consolidado no terceiro setor brasileiro.
              </p>
              <p>
                Para apoiar a consolidação e expansão desse ecossistema, foi estruturado o Programa de Parcerias Estratégicas, destinado a profissionais interessados em colaborar com o crescimento da iniciativa.
              </p>
            </div>
          </section>

          {/* 2. Objetivo do Programa */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-blue text-white flex items-center justify-center text-sm">2</div>
              Objetivo do Programa
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Ativação e adesão de novos participantes',
                'Estruturação de processos de crescimento',
                'Posicionamento institucional da organização',
                'Geração de receitas sustentáveis'
              ].map((item, i) => (
                <div key={i} className="p-6 bg-white rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
                  <CheckCircle2 className="text-brand-emerald shrink-0" size={20} />
                  <span className="font-bold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Áreas de Atuação */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-blue text-white flex items-center justify-center text-sm">3</div>
              Áreas de Atuação
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="p-8 bg-slate-900 text-white rounded-[40px] space-y-4">
                <Target className="text-brand-blue" size={32} />
                <h3 className="font-black uppercase text-xs tracking-widest">Ativação e Aquisição</h3>
                <ul className="text-xs text-slate-400 space-y-2">
                  <li>• Gestão de campanhas digitais</li>
                  <li>• Geração de interesse qualificado</li>
                  <li>• Testes e otimização de funis</li>
                </ul>
              </div>
              <div className="p-8 bg-brand-blue text-white rounded-[40px] space-y-4">
                <Users size={32} />
                <h3 className="font-black uppercase text-xs tracking-widest">Relacionamento e Adesão</h3>
                <ul className="text-xs text-brand-blue/20 text-white space-y-2">
                  <li>• Contato com organizações</li>
                  <li>• Diagnóstico de necessidades</li>
                  <li>• Apresentação de soluções</li>
                </ul>
              </div>
              <div className="p-8 bg-slate-50 border border-slate-100 rounded-[40px] space-y-4">
                <FileText className="text-brand-blue" size={32} />
                <h3 className="font-black uppercase text-xs tracking-widest text-slate-900">Conteúdo Institucional</h3>
                <ul className="text-xs text-slate-500 space-y-2">
                  <li>• Produção de artigos técnicos</li>
                  <li>• Conteúdos estratégicos</li>
                  <li>• Fortalecimento de marca</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4 & 5. Modelo e Remuneração */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-blue text-white flex items-center justify-center text-sm">4</div>
              Modelo e Remuneração
            </h2>
            <div className="p-10 bg-white rounded-[50px] border border-slate-100 shadow-xl space-y-8">
              <div className="grid sm:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest flex items-center gap-2">
                    <Settings size={16} className="text-brand-blue" />
                    Colaboração
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Formalizado por contrato específico, contemplando escopo, responsabilidades, indicadores de desempenho e modelo de remuneração.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest flex items-center gap-2">
                    <TrendingUp size={16} className="text-brand-emerald" />
                    Estrutura Híbrida
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Configuração inicial <strong>R$ 500 (parcelado)</strong> + variável por desempenho (até <strong>10% sobre adesões</strong>).
                    </p>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Foco em profissionais e instituições de alto impacto
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-8 border-t border-slate-100">
                <div className="flex items-start gap-4 p-6 rounded-3xl bg-amber-50 border border-amber-100">
                  <ShieldCheck size={20} className="text-amber-600 shrink-0 mt-1" />
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    A remuneração está vinculada exclusivamente aos serviços prestados, não configurando participação nos resultados institucionais ou vínculo empregatício.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Contrapartidas */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-blue text-white flex items-center justify-center text-sm">5</div>
              Contrapartidas CACI
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { title: 'Infraestrutura', desc: 'Presença institucional consolidada e rede de contatos.' },
                { title: 'Ativos de Conteúdo', desc: 'Materiais formativos e base conceitual estruturada.' },
                { title: 'Estrutura Digital', desc: 'Plataforma da comunidade e funis de entrada.' },
                { title: 'Ambiente Colaborativo', desc: 'Integração em discussões estratégicas.' }
              ].map((item, i) => (
                <div key={i} className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                  <h4 className="font-black text-slate-900 mb-2 group-hover:text-brand-blue transition-colors">{item.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 7. Padrões Editoriais e Coautoria (Anexo XI) */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-blue text-white flex items-center justify-center text-sm">6</div>
              Padrões Editoriais e Coautoria
            </h2>
            <div className="p-10 bg-slate-50 border border-slate-200 rounded-[50px] space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900">Manual de Padrões Editoriais (Linha Hotmart)</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Estabelece os padrões oficiais para produtos digitais (e-books, manuais, diagnósticos) produzidos em parceria estratégica, garantindo unidade e segurança metodológica.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-6 bg-white rounded-3xl border border-slate-100 space-y-3">
                  <h4 className="font-black text-brand-blue uppercase text-[10px] tracking-widest">Princípios Fundamentais</h4>
                  <ul className="text-xs text-slate-500 space-y-2">
                    <li>• Aderência ao Livro Institucional</li>
                    <li>• Coerência Metodológica</li>
                    <li>• Clareza e Objetividade</li>
                    <li>• Narrativa Institucional CACI</li>
                  </ul>
                </div>
                <div className="p-6 bg-white rounded-3xl border border-slate-100 space-y-3">
                  <h4 className="font-black text-brand-emerald uppercase text-[10px] tracking-widest">Política de Precificação</h4>
                  <ul className="text-xs text-slate-500 space-y-2">
                    <li>• Preço-base Institucional</li>
                    <li>• Matriz de Segmentação (A, B, C, D)</li>
                    <li>• Sustentabilidade Econômica</li>
                    <li>• Regras de Desconto (Alunos/Público)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 8. Personality ID - Diagnóstico de Pré-Qualificação */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-blue text-white flex items-center justify-center text-sm">7</div>
              Diagnóstico de Pré-Qualificação
            </h2>
            <div className="p-10 bg-white rounded-[50px] border-2 border-brand-blue/20 shadow-2xl shadow-brand-blue/5 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ClipboardCheck size={120} className="text-brand-blue" />
              </div>
              <div className="max-w-2xl space-y-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue text-white text-[8px] font-black uppercase tracking-widest mb-2">
                  Recomendado
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Personality ID — Diagnóstico Organizacional</h3>
                <p className="text-slate-600 leading-relaxed">
                  Antes de encaminhar sua manifestação de interesse, recomendamos a realização do diagnóstico <strong>Personality ID</strong>. Este instrumento permite medir sua capacidade técnica, maturidade institucional, estabilidade financeira e alinhamento ao perfil da ONG CACI.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                  {[
                    { label: 'Capacidade Técnica', icon: Target },
                    { label: 'Maturidade Financeira', icon: TrendingUp },
                    { label: 'Adaptabilidade', icon: RefreshCw },
                    { label: 'Credibilidade', icon: ShieldCheck }
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center text-center gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-brand-blue">
                        <item.icon size={20} />
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight leading-tight">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-6">
                  <button 
                    onClick={() => window.location.href = '/ecossistema/diagnostico'}
                    className="flex items-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue transition-all group"
                  >
                    Realizar Diagnóstico Personality ID
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="p-12 rounded-[60px] bg-slate-900 text-white text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl font-black tracking-tight">Manifestação de Interesse</h2>
              <p className="text-slate-400 max-w-xl mx-auto font-medium">
                As manifestações serão analisadas considerando alinhamento estratégico, capacidade de execução e potencial de contribuição.
              </p>
              <a 
                href="https://forms.gle/Ywip5y6vbsJZQ5ZA9" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-10 py-6 bg-brand-blue text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand-blue/40 hover:scale-105 active:scale-95 transition-all"
              >
                Registrar Manifestação
                <ExternalLink size={18} />
              </a>
            </div>
          </section>
        </div>

        {/* Footer Info */}
        <div className="pt-12 border-t border-slate-200 text-center space-y-4">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">
            Ecossistema CACI • 2026
          </p>
          <div className="flex justify-center gap-4">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Transparência</span>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Governança</span>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Impacto</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategicPartnerships;
