import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  X, 
  Maximize2, 
  Minimize2,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CACIiaService } from '../../services/caciiaService';
import { AgentType, ChatMessage } from '../../types';
import { auth } from '../../firebase';

interface CACIiaChatProps {
  agentType: AgentType;
  organizationId: string;
  initialMessage?: string;
}

const CACIiaChat: React.FC<CACIiaChatProps> = ({ agentType, organizationId, initialMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    const userId = auth.currentUser?.uid || 'anonymous';
    setLoading(true);
    try {
      if (userId === 'anonymous') {
        if (initialMessage) {
          setMessages([{
            id: 'welcome',
            userId: 'anonymous',
            organizationId,
            agentType,
            role: 'assistant',
            content: initialMessage,
            timestamp: new Date()
          }]);
        }
      } else {
        const history = await CACIiaService.getHistory(userId, organizationId, agentType);
        if (history.length === 0 && initialMessage) {
          setMessages([{
            id: 'welcome',
            userId,
            organizationId,
            agentType,
            role: 'assistant',
            content: initialMessage,
            timestamp: new Date()
          }]);
        } else {
          setMessages(history);
        }
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
      setError('Erro ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userId = auth.currentUser?.uid || 'anonymous';

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      userId,
      organizationId,
      agentType,
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await CACIiaService.sendMessage(
        userId,
        organizationId,
        agentType,
        input,
        messages
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        userId,
        organizationId,
        agentType,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Error sending message:', err);
      if (err?.message?.includes('GEMINI_API_KEY')) {
        setError('Configuração pendente: Chave de API não encontrada.');
      } else if (err?.message?.includes('quota')) {
        setError('Limite de uso atingido. Tente novamente mais tarde.');
      } else {
        setError('Desculpe, ocorreu um erro ao processar sua mensagem.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-brand-blue text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-brand-blue/90 transition-all group relative"
          >
            <Bot size={32} className="group-hover:scale-110 transition-transform" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white">
              AI
            </div>
          </motion.button>
        )}

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className={`bg-[#FFB300]/15 rounded-[40px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden transition-all duration-300 ${
              isMaximized ? 'fixed inset-4 w-auto h-auto' : 'w-[400px] h-[600px] max-h-[calc(100vh-120px)]'
            }`}
          >
            {/* Header */}
            <div className="p-6 bg-brand-blue text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-brand-gold/15 rounded-xl flex items-center justify-center border border-white/20 shrink-0">
                  <Sparkles className="text-white" size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-black tracking-tight leading-none mb-1">CACIia</div>
                  <div className="text-[10px] font-bold text-white/80 uppercase tracking-widest truncate whitespace-nowrap">
                    Assistente {agentType === 'osc' ? 'da OSC' : agentType === 'interno' ? 'Interno' : 'Institucional'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => setIsMaximized(!isMaximized)}
                  title={isMaximized ? "Minimizar" : "Expandir"}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold uppercase"
                >
                  {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  <span className="hidden sm:inline">Expandir</span>
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  title="Sair"
                  className="p-2 hover:bg-white/20 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold uppercase"
                >
                  <X size={16} />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent custom-scrollbar">
              {/* Apoia Brasil Banner */}
              <div className="mb-6 p-4 bg-[#6A1B9A]/30 rounded-3xl border border-white/10 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-brand-gold/15 rounded-lg flex items-center justify-center">
                    <Heart size={16} className="text-brand-gold" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">Apoia Brasil</span>
                </div>
                <p className="text-[10px] font-medium leading-relaxed opacity-90">
                  Conectando causas a corações. Como posso ajudar você hoje?
                </p>
              </div>
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? 'bg-brand-blue text-white' : 'bg-slate-900 text-white'
                    }`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-brand-blue text-white rounded-tr-none shadow-md' 
                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                      <Loader2 className="animate-spin text-brand-blue" size={20} />
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-center">
                  <div className="px-4 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-full flex items-center gap-2 border border-rose-100">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 bg-transparent border-t border-slate-100">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Como posso ajudar hoje?"
                  className="w-full px-6 py-4 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all pr-14"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-brand-blue text-white rounded-xl hover:bg-brand-blue/90 transition-all disabled:opacity-50 disabled:hover:scale-100 active:scale-95 flex items-center justify-center"
                >
                  <span className="hidden sm:inline mr-2 text-[10px] font-black uppercase tracking-widest">Iniciar</span>
                  <Send size={18} />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  CACIia v1.0 • Baseada em Dados Reais
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CACIiaChat;
