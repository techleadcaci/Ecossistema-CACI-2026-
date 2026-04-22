import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Smartphone, Monitor, Globe, BarChart3, CheckCircle2, Plus, History, Rocket } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';

const DigitalMaturity = () => {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    infrastructure_score: 0,
    digital_culture_score: 0,
    data_management_score: 0,
    organization_id: 'caci'
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'digital_maturity_evaluations'),
      where('user_id', '==', auth.currentUser.uid),
      orderBy('created_at', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvaluations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      const overall_score = (formData.infrastructure_score + formData.digital_culture_score + formData.data_management_score) / 3;
      let maturity_level = 'iniciante';
      if (overall_score > 90) maturity_level = 'digital';
      else if (overall_score > 75) maturity_level = 'inovadora';
      else if (overall_score > 50) maturity_level = 'estruturada';
      else if (overall_score > 25) maturity_level = 'tradicional';

      await addDoc(collection(db, 'digital_maturity_evaluations'), {
        ...formData,
        user_id: auth.currentUser.uid,
        overall_score,
        maturity_level,
        created_at: serverTimestamp()
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error saving digital maturity evaluation:', error);
    }
  };

  const lastEval = evaluations[0];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-md">Diagnóstico de Maturidade Digital</h1>
          <p className="text-slate-500 font-medium">Avaliação institucional de tecnologia e cultura digital.</p>
        </div>
        <div className="w-16 h-16 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center">
          <Rocket size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {showForm ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900">Novo Diagnóstico Digital</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">Cancelar</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  {/* Infrastructure */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-brand-blue">
                      <Monitor size={18} />
                      <span className="text-sm font-black uppercase tracking-widest">Infraestrutura</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={formData.infrastructure_score}
                      onChange={(e) => setFormData({...formData, infrastructure_score: parseInt(e.target.value)})}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Básico</span>
                      <span>{formData.infrastructure_score}%</span>
                      <span>Avançado</span>
                    </div>
                  </div>

                  {/* Digital Culture */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Globe size={18} />
                      <span className="text-sm font-black uppercase tracking-widest">Cultura Digital</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={formData.digital_culture_score}
                      onChange={(e) => setFormData({...formData, digital_culture_score: parseInt(e.target.value)})}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Básico</span>
                      <span>{formData.digital_culture_score}%</span>
                      <span>Avançado</span>
                    </div>
                  </div>

                  {/* Data Management */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Smartphone size={18} />
                      <span className="text-sm font-black uppercase tracking-widest">Gestão de Dados</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={formData.data_management_score}
                      onChange={(e) => setFormData({...formData, data_management_score: parseInt(e.target.value)})}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Básico</span>
                      <span>{formData.data_management_score}%</span>
                      <span>Avançado</span>
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full py-4 rounded-2xl bg-brand-blue text-white font-bold text-sm uppercase tracking-widest hover:bg-brand-blue-dark transition-colors">
                  Salvar Diagnóstico
                </button>
              </form>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-white p-12 rounded-[48px] shadow-2xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                  <Rocket size={200} />
                </div>
                
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-slate-900">Seu Índice Digital</h3>
                      <p className="text-slate-500 font-medium">Última atualização: {lastEval?.created_at?.toDate().toLocaleDateString('pt-BR') || 'Nenhuma'}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-black text-brand-blue">{lastEval?.overall_score?.toFixed(0) || 0}%</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-brand-blue/60">Score Geral</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="p-4 rounded-3xl bg-brand-blue/5 border border-brand-blue/10 text-center space-y-1">
                      <div className="text-xl font-black text-brand-blue">{lastEval?.infrastructure_score || 0}%</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-brand-blue/60">Infra</div>
                    </div>
                    <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-100 text-center space-y-1">
                      <div className="text-xl font-black text-emerald-600">{lastEval?.digital_culture_score || 0}%</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Cultura</div>
                    </div>
                    <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 text-center space-y-1">
                      <div className="text-xl font-black text-slate-900">{lastEval?.data_management_score || 0}%</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-900/60">Dados</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-brand-blue" size={20} />
                      <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">Nível: {lastEval?.maturity_level || 'Pendente'}</span>
                    </div>
                    <button 
                      onClick={() => setShowForm(true)}
                      className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      <Plus size={16} /> Novo Diagnóstico
                    </button>
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-3">
                  <BarChart3 className="text-brand-blue" size={24} />
                  <h4 className="font-bold text-slate-900">Transformação Digital</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sua organização está no nível <strong>{lastEval?.maturity_level}</strong>. Recomendamos investir em ferramentas de colaboração em nuvem.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-3">
                  <Smartphone className="text-emerald-600" size={24} />
                  <h4 className="font-bold text-slate-900">Mobilidade</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Aumente sua pontuação integrando o <strong>Ponto Eletrônico Mobile</strong> em sua rotina.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: History */}
        <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 space-y-8">
          <div className="flex items-center gap-2">
            <History size={20} className="text-slate-400" />
            <h3 className="font-bold text-slate-900">Histórico</h3>
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-xs text-slate-400">Carregando...</p>
            ) : evaluations.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhum diagnóstico anterior.</p>
            ) : (
              evaluations.map(evalItem => (
                <div key={evalItem.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{evalItem.created_at?.toDate().toLocaleDateString('pt-BR')}</span>
                    <span className="text-sm font-black text-brand-blue">{evalItem.overall_score?.toFixed(0)}%</span>
                  </div>
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-widest">{evalItem.maturity_level}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalMaturity;
