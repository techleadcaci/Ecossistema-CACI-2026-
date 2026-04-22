import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookOpen, Package, 
  FileDigit, Megaphone, UserPlus, DollarSign, 
  Handshake, ShieldCheck, LogOut, Leaf,
  ChevronLeft, Menu, User as UserIcon, Shield,
  ClipboardCheck, TrendingUp, RotateCcw, Heart,
  Star
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const { profile } = useAuth();

  const mainItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/intranet' },
    { icon: Star, label: 'Avaliações da Plataforma', path: '/intranet/avaliacoes', roles: ['superadmin', 'diretoria', 'marketing', 'ti'] },
    { icon: TrendingUp, label: 'Painéis de Melhorias', path: '/intranet/melhorias' },
    { icon: ClipboardCheck, label: 'Diagnóstico Institucional', path: '/intranet/diagnostico-institucional' },
    { icon: Leaf, label: 'SIMPLIFICA ESG', path: '/intranet/esg' },
    { icon: ShieldCheck, label: 'Maturidade Digital', path: '/intranet/digital' },
    { icon: Users, label: 'Personality I.D.', path: '/intranet/personality' },
    { icon: FileDigit, label: 'Ponto Eletrônico', path: '/intranet/ponto' },
    { icon: Shield, label: 'Diretoria - CACI Presidência', path: '/intranet/admin/executivo', roles: ['superadmin', 'diretoria'] },
  ];

  const dataItems = [
    { icon: UserPlus, label: 'Cadastros OSC', path: '/intranet/cadastros', roles: ['admin', 'superadmin'] },
    { icon: ShieldCheck, label: 'Diagnósticos', path: '/intranet/diagnosticos', roles: ['admin', 'superadmin'] },
    { icon: BookOpen, label: 'Relatórios', path: '/intranet/relatorios', roles: ['admin', 'superadmin'] },
    { icon: Users, label: 'Identidades', path: '/intranet/identidades', roles: ['admin', 'superadmin'] },
    { icon: BookOpen, label: 'Programas', path: '/intranet/programas', roles: ['admin', 'superadmin'] },
    { icon: Package, label: 'Produtos', path: '/intranet/produtos', roles: ['admin', 'superadmin'] },
  ];

  const erpItems = [
    { icon: FileDigit, label: 'Ativos Digitais', path: '/intranet/ativos', roles: ['admin', 'superadmin'] },
    { icon: Megaphone, label: 'Campanhas de Crowdfunding', path: '/intranet/campanhas', roles: ['admin', 'superadmin', 'diretoria', 'projetos'] },
    { icon: UserPlus, label: 'Leads', path: '/intranet/leads', roles: ['admin', 'superadmin'] },
    { icon: DollarSign, label: 'Receita', path: '/intranet/receita', roles: ['admin', 'superadmin'] },
    { icon: Handshake, label: 'Parcerias', path: '/intranet/parcerias', roles: ['admin', 'superadmin', 'diretoria', 'projetos', 'financeiro'] },
  ];

  const adminItems = [
    { icon: Shield, label: 'Admin Console Geral', path: '/intranet/admin', roles: ['superadmin', 'admin_institucional'] },
    { icon: Users, label: 'Gestão de Usuários', path: '/intranet/usuarios', roles: ['superadmin'] },
    { icon: ShieldCheck, label: 'Auditoria', path: '/intranet/auditoria', roles: ['superadmin'] },
    { icon: ShieldCheck, label: 'Sistema Eleitoral', path: '/intranet/eleitoral', roles: ['superadmin', 'diretoria', 'governanca', 'ti', 'projetos', 'marketing'] },
    { icon: RotateCcw, label: 'Governança & Reset', path: '/intranet/governanca', roles: ['superadmin', 'diretoria'] },
  ];

  const consoleItems = [
    { icon: Shield, label: 'Diretoria & Conselhos', path: '/intranet/admin/executivo', roles: ['superadmin', 'diretoria'], hierarchy: 'executive' },
    { icon: ShieldCheck, label: 'Governança & Compliance', path: '/intranet/admin/governanca', roles: ['superadmin', 'governanca'], hierarchy: 'subordinate' },
    { icon: Leaf, label: 'Socioambiental', path: '/intranet/admin/socioambiental', roles: ['superadmin', 'socioambiental'], hierarchy: 'subordinate' },
    { icon: ShieldCheck, label: 'Defesa de Direitos', path: '/intranet/admin/defesa', roles: ['superadmin', 'defesa'], hierarchy: 'subordinate' },
    { icon: BookOpen, label: 'Educação', path: '/intranet/admin/educacao', roles: ['superadmin', 'educacao'], hierarchy: 'subordinate' },
    { icon: TrendingUp, label: 'Projetos & Captação', path: '/intranet/admin/projetos', roles: ['superadmin', 'projetos'], hierarchy: 'subordinate' },
    { icon: Heart, label: 'Social & Saúde', path: '/intranet/admin/social-saude', roles: ['superadmin', 'social'], hierarchy: 'subordinate' },
    { icon: DollarSign, label: 'Adm & Financeiro', path: '/intranet/admin/adm-financeiro', roles: ['superadmin', 'financeiro'], hierarchy: 'subordinate' },
    { icon: Megaphone, label: 'Comunicação & Mkt', path: '/intranet/admin/marketing', roles: ['superadmin', 'marketing'], hierarchy: 'subordinate' },
    { icon: Users, label: 'Recursos Humanos', path: '/intranet/admin/rh', roles: ['superadmin', 'rh'], hierarchy: 'subordinate' },
    { icon: FileDigit, label: 'TI & Dados', path: '/intranet/admin/ti', roles: ['superadmin', 'ti'], hierarchy: 'subordinate' },
  ];

  const FULL_ACCESS_ROLES = ['superadmin', 'diretoria', 'governanca', 'projetos', 'rh', 'ti'];
  const SUBORDINATE_ROLES = ['financeiro', 'marketing', 'social', 'educacao', 'defesa', 'socioambiental'];

  const isSubordinateContext = profile && !FULL_ACCESS_ROLES.some(role => role.toLowerCase() === profile.role?.toLowerCase());

  const filterItems = (items: any[]) => items.filter(item => {
    if (profile && FULL_ACCESS_ROLES.some(role => role.toLowerCase() === profile.role?.toLowerCase())) return true;
    if (!item.roles) return true;
    return profile && item.roles.some(role => role.toLowerCase() === profile.role?.toLowerCase());
  });

  const renderNavSection = (title: string, items: any[]) => {
    const filtered = filterItems(items);
    if (filtered.length === 0) return null;

    return (
      <div className="py-4">
        {!isCollapsed && (
          <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            {title}
          </h4>
        )}
        <div className="space-y-1">
          {filtered.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/intranet'}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative group/item
                ${isActive 
                  ? 'bg-brand-blue/10 text-brand-blue shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                ${isCollapsed ? 'justify-center px-0' : ''}
              `}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon size={20} className="shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{item.label}</span>
                  {isSubordinateContext && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[7px] font-black rounded-md uppercase tracking-tighter shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap">
                      Modo Validação
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    );
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <aside className={`
      ${isCollapsed ? 'w-0 lg:w-20' : 'w-64'} 
      bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 transition-all duration-300 z-50
      ${isCollapsed ? 'overflow-hidden lg:overflow-visible' : ''}
    `}>
      <div className={`p-6 border-b border-slate-100 flex items-center justify-between ${isCollapsed ? 'px-4 lg:justify-center' : ''}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <img 
              src="https://ais-pre-qvipanm3ysdp4ln6k5eqfh-308119493736.us-west2.run.app/Logo_CACI_2026+.SVG.png" 
              alt="CACI Logo" 
              className="w-8 h-8 object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="font-display font-bold text-slate-800 tracking-tight whitespace-nowrap">CACI Intranet</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors ${isCollapsed ? 'fixed left-4 top-4 bg-white shadow-md lg:static lg:bg-transparent lg:shadow-none' : ''}`}
          title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
        {renderNavSection('Principal', mainItems)}
        {renderNavSection('Gestão de Dados', dataItems)}
        {renderNavSection('ERP & Marketing', erpItems)}
        {renderNavSection('Consoles por Área', consoleItems)}
        {renderNavSection('Administração', adminItems)}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-2">
        {profile && !isCollapsed && (
          <div className="px-4 py-3 bg-slate-50 rounded-xl mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                <UserIcon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{profile.name}</p>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{profile.role}</p>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">ID-CCGU</span>
                      <span className={`text-[9px] font-mono truncate ${profile.id_ccgu === 'pendente_configuracao' ? 'text-amber-500 font-bold italic' : 'text-slate-500'}`}>
                        {profile.id_ccgu === 'pendente_configuracao' ? 'Pendente' : (profile.id_ccgu || 'N/A')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">ID-CFRH</span>
                      <span className={`text-[9px] font-mono truncate ${profile.id_cfrh === 'pendente_configuracao' ? 'text-amber-500 font-bold italic' : 'text-slate-500'}`}>
                        {profile.id_cfrh === 'pendente_configuracao' ? 'Pendente' : (profile.id_cfrh || 'N/A')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all ${isCollapsed ? 'justify-center px-0' : ''}`}
          title={isCollapsed ? "Sair do Sistema" : ""}
        >
          <LogOut size={20} className="shrink-0" />
          {!isCollapsed && <span>Sair do Sistema</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
