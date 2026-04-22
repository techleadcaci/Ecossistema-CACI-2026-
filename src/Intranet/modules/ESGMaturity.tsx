import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Leaf, Shield, Users, BarChart3, CheckCircle2, Plus, History } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';

const ESGMaturity = () => {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    environmental_score: 0,
    social_score: 0,
    governance_score: 0,
    organization_id: 'caci'
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'esg_evaluations'),
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
      const overall_score = (formData.environmental_score + formData.social_score + formData.governance_score) / 3;
      let maturity_level = 'básico';
      if (overall_score > 80) maturity_level = 'líder';
      else if (overall_score > 60) maturity_level = 'avançado';
      else if (overall_score > 40) maturity_level = 'em desenvolvimento';

      await addDoc(collection(db, 'esg_evaluations'), {
        ...formData,
        user_id: auth.currentUser.uid,
        overall_score,
        maturity_level,
        created_at: serverTimestamp()
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error saving ESG evaluation:', error);
    }
  };

  const lastEval = evaluations[0];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-md">SIMPLIFICA ESG</h1>
          <p className="text-slate-500 font-medium">Avaliação de maturidade em sustentabilidade e governança.</p>
        </div>
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
          <Leaf size={32} />
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
                <h3 className="text-xl font-black text-slate-900">Nova Avaliação ESG</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">Cancelar</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  {/* Environmental */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Leaf size={18} />
                      <span className="text-sm font-black uppercase tracking-widest">Ambiental (E)</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={formData.environmental_score}
                      onChange={(e) => setFormData({...formData, environmental_score: parseInt(e.target.value)})}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Básico</span>
                      <span>{formData.environmental_score}%</span>
                      <span>Líder</span>
                    </div>
                  </div>

                  {/* Social */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-brand-blue">
                      <Users size={18} />
                      <span className="text-sm font-black uppercase tracking-widest">Social (S)</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={formData.social_score}
                      onChange={(e) => setFormData({...formData, social_score: parseInt(e.target.value)})}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Básico</span>
                      <span>{formData.social_score}%</span>
                      <span>Líder</span>
                    </div>
                  </div>

                  {/* Governance */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Shield size={18} />
                      <span className="text-sm font-black uppercase tracking-widest">Governança (G)</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={formData.governance_score}
                      onChange={(e) => setFormData({...formData, governance_score: parseInt(e.target.value)})}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Básico</span>
                      <span>{formData.governance_score}%</span>
                      <span>Líder</span>
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm uppercase tracking-widest hover:bg-emerald-700 transition-colors">
                  Salvar Avaliação
                </button>
              </form>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-white p-12 rounded-[48px] shadow-2xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                  <Leaf size={200} />
                </div>
                
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-slate-900">Sua Maturidade ESG</h3>
                      <p className="text-slate-500 font-medium">Última atualização: {lastEval?.created_at?.toDate().toLocaleDateString('pt-BR') || 'Nenhuma'}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-black text-emerald-600">{lastEval?.overall_score?.toFixed(0) || 0}%</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Score Geral</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-100 text-center space-y-1">
                      <div className="text-xl font-black text-emerald-600">{lastEval?.environmental_score || 0}%</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Ambiental</div>
                    </div>
                    <div className="p-4 rounded-3xl bg-brand-blue/5 border border-brand-blue/10 text-center space-y-1">
                      <div className="text-xl font-black text-brand-blue">{lastEval?.social_score || 0}%</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-brand-blue/60">Social</div>
                    </div>
                    <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 text-center space-y-1">
                      <div className="text-xl font-black text-slate-900">{lastEval?.governance_score || 0}%</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-900/60">Governança</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-emerald-500" size={20} />
                      <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">Nível: {lastEval?.maturity_level || 'Pendente'}</span>
                    </div>
                    <button 
                      onClick={() => setShowForm(true)}
                      className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      <Plus size={16} /> Nova Avaliação
                    </button>
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-3">
                  <BarChart3 className="text-brand-blue" size={24} />
                  <h4 className="font-bold text-slate-900">Próximos Passos</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Para atingir o nível <strong>Líder</strong>, foque em relatórios de transparência e políticas de diversidade.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-3">
                  <Shield className="text-emerald-600" size={24} />
                  <h4 className="font-bold text-slate-900">Certificação CACI</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sua pontuação atual qualifica sua OSC para o selo de <strong>Impacto Verificado</strong>.
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
              <p className="text-xs text-slate-400 italic">Nenhuma avaliação anterior.</p>
            ) : (
              evaluations.map(evalItem => (
                <div key={evalItem.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{evalItem.created_at?.toDate().toLocaleDateString('pt-BR')}</span>
                    <span className="text-sm font-black text-emerald-600">{evalItem.overall_score?.toFixed(0)}%</span>
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

export default ESGMaturity;
