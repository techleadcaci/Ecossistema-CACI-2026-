import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  Scale, 
  Globe, 
  Users, 
  Database,
  CheckCircle2
} from 'lucide-react';

const TermsOfUse: React.FC = () => {
  return (
    <div className="bg-sequential-0 min-h-screen">
      <div className="max-w-4xl mx-auto py-12">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/5 text-slate-900 text-[10px] font-black uppercase tracking-widest mb-6 border border-slate-900/10">
          <FileText size={14} />
          Documentação Institucional
        </div>
        <h1 className="text-4xl font-display font-black tracking-tighter text-slate-900 leading-none mb-4">
          Termos de Uso e <span className="text-brand-blue">Privacidade</span>
        </h1>
        <p className="text-lg text-slate-500 font-medium">
          Diretrizes de governança, LGPD e conduta no Ecossistema CACI.
        </p>
      </div>

      <div className="bg-white p-10 sm:p-16 rounded-[60px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 space-y-16">
        
        {/* Section 1: Introduction */}
        <section className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
              <Globe size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-900">1. Propósito Institucional</h2>
          </div>
          <p className="text-slate-600 font-medium leading-relaxed">
            O Ecossistema CACI é uma plataforma de desenvolvimento, diagnóstico e fortalecimento de Organizações da Sociedade Civil (OSCs). Nosso objetivo é puramente institucional e consultivo, visando o aprimoramento da gestão e do impacto social.
          </p>
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-start gap-4">
            <CheckCircle2 size={20} className="text-brand-emerald shrink-0 mt-1" />
            <p className="text-sm text-slate-500 font-bold">
              A plataforma NÃO possui fins comerciais ou de venda direta. Toda comunicação é orientada ao desenvolvimento organizacional.
            </p>
          </div>
        </section>

        {/* Section 2: LGPD */}
        <section className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-900">2. Proteção de Dados (LGPD)</h2>
          </div>
          <p className="text-slate-600 font-medium leading-relaxed">
            Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), o Ecossistema CACI garante a privacidade e a segurança das informações coletadas.
          </p>
          <ul className="space-y-4">
            {[
              'Coleta mínima de dados necessária para o diagnóstico e suporte.',
              'Uso exclusivo para fins de fortalecimento institucional e estatísticas de rede.',
              'Direito de acesso, correção e exclusão de dados pelo titular.',
              'Armazenamento seguro em infraestrutura de nuvem certificada.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Section 3: Responsibilities */}
        <section className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold-dark flex items-center justify-center">
              <Users size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-900">3. Responsabilidades do Usuário</h2>
          </div>
          <p className="text-slate-600 font-medium leading-relaxed">
            Ao utilizar a plataforma, o usuário compromete-se a:
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-8 rounded-[40px] bg-slate-50 border border-slate-100">
              <h3 className="font-black text-slate-900 mb-2">Veracidade</h3>
              <p className="text-xs text-slate-500 font-medium">Fornecer informações precisas e atualizadas sobre a organização ou perfil profissional.</p>
            </div>
            <div className="p-8 rounded-[40px] bg-slate-50 border border-slate-100">
              <h3 className="font-black text-slate-900 mb-2">Ética</h3>
              <p className="text-xs text-slate-500 font-medium">Utilizar o ecossistema para fins de colaboração e desenvolvimento, respeitando a conduta institucional.</p>
            </div>
          </div>
        </section>

        {/* Section 4: Diagnostics */}
        <section className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Database size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-900">4. Diagnósticos e Resultados</h2>
          </div>
          <p className="text-slate-600 font-medium leading-relaxed">
            Os resultados do Diagnóstico de Maturidade são ferramentas de apoio à decisão e não constituem certificação legal ou auditoria externa. A CACI reserva-se o direito de utilizar dados agregados e anonimizados para pesquisas sobre o setor.
          </p>
        </section>

        {/* Footer of Terms */}
        <div className="pt-12 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-4">Última atualização: Março de 2026</p>
          <p className="text-sm text-slate-500 font-medium">
            Dúvidas sobre nossos termos? Entre em contato pelo e-mail: <a href="mailto:contato@caci.ong.br" className="text-brand-blue underline">contato@caci.ong.br</a>
          </p>
        </div>
      </div>
    </div>
  </div>
);
};

export default TermsOfUse;
