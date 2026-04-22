import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Minimize2, Maximize2, AlertCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAIResponse, registerCorrection } from '../../services/geminiService';

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
  isCorrecting?: boolean;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Sou o Agente CACIia. Como posso orientar você hoje?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [correctionInput, setCorrectionInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const aiResponse = await getAIResponse(input);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse || 'Desculpe, não tenho essa informação com segurança. Vou verificar a base da plataforma.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Erro no ChatBot:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCorrection = (msgId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === msgId ? { ...m, isCorrecting: !m.isCorrecting } : { ...m, isCorrecting: false }
    ));
    setCorrectionInput('');
  };

  const handleSubmitCorrection = async (msg: Message) => {
    if (!correctionInput.trim()) return;

    const success = await registerCorrection(msg.id, msg.text, correctionInput);
    if (success) {
      alert('Obrigado! Sua correção foi registrada para validação humana.');
      handleToggleCorrection(msg.id);
    } else {
      alert('Erro ao registrar correção. Tente novamente.');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '80px' : '550px',
              width: '400px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col mb-4"
          >
            {/* Header */}
            <header className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center shadow-lg">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-widest">Agente CACIia</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black opacity-80 uppercase tracking-widest">Base Controlada</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50 custom-scrollbar">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[85%] flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                          msg.sender === 'user' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-100 text-brand-blue'
                        }`}>
                          {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className="space-y-2">
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                            msg.sender === 'user' 
                              ? 'bg-slate-900 text-white rounded-tr-none' 
                              : 'bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-none'
                          }`}>
                            {msg.text}
                            <div className={`text-[10px] mt-2 font-bold opacity-40 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          
                          {msg.sender === 'ai' && !msg.isCorrecting && (
                            <button 
                              onClick={() => handleToggleCorrection(msg.id)}
                              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-blue flex items-center gap-1 transition-colors ml-2"
                            >
                              <AlertCircle size={12} />
                              Sugerir Correção
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Correction Input */}
                      <AnimatePresence>
                        {msg.isCorrecting && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="w-full mt-3 pl-11"
                          >
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl space-y-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Qual a informação correta?</p>
                              <textarea 
                                value={correctionInput}
                                onChange={(e) => setCorrectionInput(e.target.value)}
                                className="w-full p-3 rounded-xl bg-white border border-amber-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none h-20"
                                placeholder="Descreva o erro e a informação oficial..."
                              />
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleToggleCorrection(msg.id)}
                                  className="flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white transition-all"
                                >
                                  Cancelar
                                </button>
                                <button 
                                  onClick={() => handleSubmitCorrection(msg)}
                                  className="flex-1 py-2 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-amber-600 transition-all flex items-center justify-center gap-1"
                                >
                                  <Check size={12} />
                                  Enviar
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 text-brand-blue shadow-sm flex items-center justify-center">
                          <Bot size={16} />
                        </div>
                        <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1.5 items-center">
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-5 bg-white border-t border-slate-100">
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Como posso orientar você?"
                      className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!input.trim() || loading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-slate-900 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                  <p className="text-[10px] text-center text-slate-400 mt-3 font-black uppercase tracking-widest">
                    Agente Orientado a Dados Reais • Auditável
                  </p>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl transition-all ${
          isOpen ? 'bg-white text-slate-900 border border-slate-100' : 'bg-slate-900 text-white'
        }`}
      >
        {isOpen ? <X size={28} /> : <Bot size={28} />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-brand-blue text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg">
            IA
          </div>
        )}
      </motion.button>
    </div>
  );
};

export default ChatBot;
