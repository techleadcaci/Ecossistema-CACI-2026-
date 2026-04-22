import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserCircle, Brain, Target, Sparkles, CheckCircle2, Plus, History } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';

const PersonalityID = () => {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [archetype, setArchetype] = useState('');

  const archetypes = [
    { id: 'analista', name: 'Analista', description: 'Focado em dados, precisão e processos estruturados.', icon: Target },
    { id: 'lider', name: 'Líder Visionário', description: 'Focado em estratégia, inovação e grandes objetivos.', icon: Sparkles },
    { id: 'executor', name: 'Executor Ágil', description: 'Focado em resultados rápidos e eficiência operacional.', icon: Rocket },
    { id: 'colaborador', name: 'Colaborador Empático', description: 'Focado em pessoas, cultura e harmonia do time.', icon: Users },
  ];

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'personality_evaluations'),
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

  const handleSubmit = async (selectedArchetype: string) => {
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'personality_evaluations'), {
        user_id: auth.currentUser.uid,
        archetype: selectedArchetype,
        created_at: serverTimestamp()
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error saving personality evaluation:', error);
    }
  };

  const lastEval = evaluations[0];
  const currentArchetype = archetypes.find(a => a.id === lastEval?.archetype);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-md">Personality I.D.</h1>
          <p className="text-slate-500 font-medium">Mapeamento de perfil comportamental e talentos.</p>
        </div>
        <div className="w-16 h-16 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center">
          <Brain size={32} />
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
                <h3 className="text-xl font-black text-slate-900">Selecione seu Perfil Predominante</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">Cancelar</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {archetypes.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleSubmit(a.id)}
                    className="p-6 rounded-3xl border-2 border-slate-100 hover:border-brand-blue hover:bg-brand-blue/5 transition-all text-left space-y-3 group"
                  >
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-all">
                      <a.icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{a.name}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{a.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white p-12 rounded-[48px] shadow-2xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                  <Brain size={200} />
                </div>
                
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-brand-blue/10 text-brand-blue rounded-[32px] flex items-center justify-center">
                      {currentArchetype ? <currentArchetype.icon size={48} /> : <UserCircle size={48} />}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-slate-900">{currentArchetype?.name || 'Perfil Pendente'}</h3>
                      <p className="text-slate-500 font-medium">Seu arquétipo profissional predominante.</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                    <p className="text-slate-600 leading-relaxed italic">
                      "{currentArchetype?.description || 'Realize sua primeira avaliação para descobrir seu perfil comportamental e como ele impacta sua performance no Ecossistema CACI.'}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-brand-blue" size={20} />
                      <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">Status: {lastEval ? 'Mapeado' : 'Não Iniciado'}</span>
                    </div>
                    <button 
                      onClick={() => setShowForm(true)}
                      className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      <Plus size={16} /> {lastEval ? 'Refazer Teste' : 'Iniciar Teste'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Insights Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-3">
                  <Target className="text-brand-blue" size={24} />
                  <h4 className="font-bold text-slate-900">Pontos Fortes</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Seu perfil destaca-se pela capacidade de análise crítica e resolução de problemas complexos.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-3">
                  <Sparkles className="text-amber-500" size={24} />
                  <h4 className="font-bold text-slate-900">Desenvolvimento</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Explore treinamentos de liderança situacional para complementar seu perfil técnico.
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
            <h3 className="font-bold text-slate-900">Evolução</h3>
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-xs text-slate-400">Carregando...</p>
            ) : evaluations.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhum mapeamento anterior.</p>
            ) : (
              evaluations.map(evalItem => (
                <div key={evalItem.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{evalItem.created_at?.toDate().toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-widest">{archetypes.find(a => a.id === evalItem.archetype)?.name}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Rocket = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3" />
    <path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5" />
  </svg>
);

const Users = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default PersonalityID;
