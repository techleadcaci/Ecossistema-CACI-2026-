import React from 'react';
import { motion } from 'motion/react';
import { Clock, ShieldCheck, Heart } from 'lucide-react';

const PlaceholderApp = ({ title, icon: Icon, description }: any) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="heading-md">{title}</h1>
        <p className="text-slate-500 font-medium">{description}</p>
      </div>
      <div className="w-16 h-16 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center">
        <Icon size={32} />
      </div>
    </div>

    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-12 rounded-[40px] shadow-xl border border-slate-100 text-center space-y-6"
    >
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
        <Icon size={40} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Módulo em Desenvolvimento</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Este aplicativo está sendo integrado ao Ecossistema CACI 2026+. Em breve você terá acesso a todas as funcionalidades de gestão.
        </p>
      </div>
      <div className="pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue/5 text-brand-blue text-xs font-bold uppercase tracking-widest border border-brand-blue/10">
          Lançamento em Breve
        </div>
      </div>
    </motion.div>
  </div>
);

export const PontoEletronico = () => (
  <PlaceholderApp 
    title="CACI Ponto Eletrônico" 
    icon={Clock} 
    description="Gestão inteligente de jornada e frequência para colaboradores."
  />
);

export const SistemaEleitoral = () => (
  <PlaceholderApp 
    title="CACI Sistema Eleitoral Digital" 
    icon={ShieldCheck} 
    description="Plataforma segura para eleições e consultas institucionais."
  />
);

export const ApoiaBrasil = () => (
  <PlaceholderApp 
    title="CACI Apoia Brasil" 
    icon={Heart} 
    description="Plataforma digital de rifas, doações e mobilização de recursos."
  />
);
