import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import MFAChallenge from './MFAChallenge';
import Login from '../Intranet/Login';

interface ProtectedERPProps {
  children: React.ReactNode;
}

const ProtectedERP: React.FC<ProtectedERPProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaVerified, setMfaVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!mfaVerified) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 text-brand-gold text-[10px] font-black uppercase tracking-widest mb-4 border border-brand-gold/20">
              Acesso Restrito ERP
            </div>
            <h2 className="text-2xl font-display font-black text-white">Verificação de Segurança</h2>
            <p className="text-slate-400 text-sm mt-2">O ERP Estratégico requer autenticação de dois fatores.</p>
          </div>
          <MFAChallenge onVerify={() => setMfaVerified(true)} userEmail={user.email} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedERP;
