import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  History, 
  Zap, 
  Search, 
  Filter, 
  ArrowRight, 
  Eye, 
  Edit3, 
  RotateCcw, 
  Shield, 
  Users,
  ChevronRight,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Send,
  X
} from 'lucide-react';
import { cmsService } from '../services/cmsService';
import { CMSContent, CMSAuditLog, CMSWorkflow, CMSComment, CMSContentStatus } from '../types';
import { auth } from '../firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CommandCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'workflow' | 'audit'>('overview');
  const [contents, setContents] = useState<CMSContent[]>([]);
  const [auditLogs, setAuditLogs] = useState<CMSAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<CMSContent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allContent, logs] = await Promise.all([
        cmsService.getAllContent(),
        cmsService.getAuditLogs()
      ]);
      setContents(allContent);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (content: CMSContent) => {
    setSelectedContent(content);
    setEditValue(content.value);
    setIsEditing(true);
    setAiSuggestions(null);
  };

  const handleSave = async () => {
    if (!selectedContent || !auth.currentUser) return;
    try {
      await cmsService.updateContent(selectedContent.id, editValue, auth.currentUser.uid);
      setIsEditing(false);
      fetchData();
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedContent) return;
    setIsAnalyzing(true);
    try {
      const suggestions = await cmsService.getAISuggestions(editValue, selectedContent.type);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status: CMSContentStatus) => {
    switch (status) {
      case 'published': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'review': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-blue/20">
                <Shield size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Command Center</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Governança Híbrida & CMS</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Sistema Online</span>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Users size={20} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            {[
              { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
              { id: 'content', label: 'Gestão de Conteúdo', icon: FileText },
              { id: 'workflow', label: 'Fluxo de Aprovação', icon: CheckCircle },
              { id: 'audit', label: 'Auditoria & Logs', icon: History }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-all text-sm font-bold uppercase tracking-wider ${
                  activeTab === tab.id 
                    ? 'border-brand-blue text-brand-blue' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Aguardando Revisão', value: contents.filter(c => c.status === 'review').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'Publicados', value: contents.filter(c => c.status === 'published').length, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Alertas Críticos', value: 0, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50' },
                { label: 'Ações Hoje', value: auditLogs.filter(l => {
                  const today = new Date();
                  const logDate = l.timestamp?.toDate();
                  return logDate && logDate.toDateString() === today.toDateString();
                }).length, icon: Zap, color: 'text-brand-blue', bg: 'bg-brand-blue/5' }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                      <stat.icon size={24} />
                    </div>
                    <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Activity */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Atividade Recente</h2>
                  <button className="text-xs font-bold text-brand-blue uppercase tracking-wider hover:underline">Ver Tudo</button>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {auditLogs.slice(0, 5).map((log, i) => (
                      <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <History size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">
                            Ação: <span className="text-brand-blue uppercase">{log.action}</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            Conteúdo ID: {log.content_id} • {log.timestamp?.toDate() ? format(log.timestamp.toDate(), 'HH:mm - dd/MM/yy', { locale: ptBR }) : 'Agora'}
                          </p>
                        </div>
                        <button className="p-2 text-slate-300 hover:text-slate-600">
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="space-y-6">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Insights da IA</h2>
                <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap size={80} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
                        <Zap size={16} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">CACI IA Assistant</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed mb-6 italic">
                      "Detectei 3 conteúdos aguardando revisão há mais de 48h. Recomendo priorizar a aprovação do Hero da Campanha de Inverno para evitar atrasos no cronograma de marketing."
                    </p>
                    <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-white/10">
                      Otimizar Fluxo Agora
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gestão de Conteúdo Universal</h2>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar conteúdo..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                  />
                </div>
                <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
                  <Filter size={20} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chave / Identificador</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Departamento</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Versão</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {contents.map((content) => (
                    <tr key={content.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{content.key}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{content.value}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          {content.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-600">{content.department || 'Geral'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border ${getStatusColor(content.status)}`}>
                          {content.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-400">v{content.version}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(content)}
                            className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-all"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                            <Eye size={18} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        <AnimatePresence>
          {isEditing && selectedContent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEditing(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-5xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center">
                      <Edit3 size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Editar Conteúdo</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chave: {selectedContent.key} • v{selectedContent.version}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 transition-all"
                  >
                    <X size={24} />
                  </button>
                </header>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                  {/* Editor Area */}
                  <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor do Conteúdo</label>
                      <textarea 
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full h-64 p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all font-mono text-sm leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tipo de Ativo</span>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <FileText size={16} className="text-brand-blue" />
                          {selectedContent.type.toUpperCase()}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Departamento Responsável</span>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <Users size={16} className="text-brand-blue" />
                          {selectedContent.department || 'Administração Central'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI & Sidebar */}
                  <div className="w-full lg:w-80 bg-slate-50 border-l border-slate-100 p-8 overflow-y-auto custom-scrollbar space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Assistente IA</h4>
                        <Zap size={16} className="text-brand-blue" />
                      </div>
                      <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="w-full py-3 bg-brand-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-blue/20 hover:bg-brand-blue-dark transition-all disabled:opacity-50"
                      >
                        {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
                      </button>
                      
                      {aiSuggestions && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-white rounded-xl border border-brand-blue/20 shadow-sm"
                        >
                          <p className="text-xs text-slate-600 leading-relaxed italic">
                            {aiSuggestions}
                          </p>
                        </motion.div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Governança</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <div className="w-2 h-2 bg-amber-500 rounded-full" />
                          <span>Requer Aprovação Nível 2</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span>Log de Auditoria Ativo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <footer className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    Descartar Alterações
                  </button>
                  <div className="flex gap-3">
                    <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                      Salvar Rascunho
                    </button>
                    <button 
                      onClick={handleSave}
                      className="px-8 py-3 bg-brand-blue text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-blue/20 hover:bg-brand-blue-dark transition-all"
                    >
                      Enviar para Aprovação
                    </button>
                  </div>
                </footer>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default CommandCenter;
