import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, Activity, AlertCircle } from 'lucide-react';

const Ticker = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Ticker component mounted");
    const q = query(
      collection(db, 'governance_logs'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(newLogs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching logs for ticker:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const displayLogs = logs.length > 0 ? logs : [
    { id: 'default-1', action: 'Sistema em conformidade institucional', module: 'Governança', timestamp: { toDate: () => new Date() } },
    { id: 'default-2', action: 'Monitoramento de integridade ativo', module: 'Segurança', timestamp: { toDate: () => new Date() } }
  ];

  return (
    <div className="bg-slate-900 text-white py-2 overflow-hidden border-b border-white/10 relative z-50 min-h-[36px] flex items-center">
      <div className="flex items-center whitespace-nowrap animate-ticker">
        {/* Duplicate logs to ensure continuous scrolling */}
        {[...displayLogs, ...displayLogs, ...displayLogs].map((log, index) => (
          <div key={`${log.id}-${index}`} className="inline-flex items-center gap-4 px-8 border-r border-white/10">
            <div className="flex items-center gap-2">
              <Shield size={12} className="text-brand-blue" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Governança:</span>
            </div>
            <span className="text-[11px] font-bold text-slate-200">
              {log.action} em {log.module}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : '...'}
            </span>
          </div>
        ))}
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 65s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
};

export default Ticker;
