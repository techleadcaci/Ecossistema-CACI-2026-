import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Users, 
  ShieldCheck, 
  Globe, 
  FileText,
  ArrowLeft,
  Settings,
  Star
} from 'lucide-react';

const EcossistemaLayout: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Ecossistema', path: '/ecossistema', icon: Globe },
    { name: 'Diagnóstico', path: '/ecossistema/diagnostico', icon: ClipboardCheck },
    { name: 'Mapa de Maturidade das OSCs Escala 0-10', path: '/ecossistema/dashboard', icon: LayoutDashboard },
    { name: 'Avaliações da Plataforma', path: '/ecossistema/avaliacoes', icon: Star },
    { name: 'ERP Estratégico', path: '/ecossistema/dashboard/erp', icon: Settings },
    { name: 'Termos de Uso', path: '/ecossistema/termos', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-sequential-0 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-brand-emerald/50 backdrop-blur-md text-white flex flex-col border-r border-brand-emerald/20">
        <div className="p-8 border-b border-brand-emerald/20">
          <Link to="/" className="flex items-center gap-3 group">
            <ArrowLeft size={18} className="text-white/70 group-hover:text-white transition-colors" />
            <span className="text-xl font-display font-black tracking-tighter">CACI<span className="text-brand-blue">.</span></span>
          </Link>
          <div className="mt-4 text-[10px] font-black text-white/50 uppercase tracking-widest">Ecossistema</div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-black text-sm bg-brand-emerald/50 text-white shadow-lg shadow-brand-emerald/20 hover:bg-brand-emerald/60"
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-brand-emerald/20">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-emerald/50 backdrop-blur-sm border border-brand-emerald/20">
            <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-xs font-black">
              C
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black truncate">CACI Institucional</div>
              <div className="text-[10px] text-white/70 font-bold">Administrador</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default EcossistemaLayout;
