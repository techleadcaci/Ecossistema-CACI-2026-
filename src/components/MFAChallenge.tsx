import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Smartphone, ArrowRight, AlertCircle, Lock } from 'lucide-react';

interface MFAChallengeProps {
  onVerify: () => void;
  userEmail: string | null;
}

const MFAChallenge: React.FC<MFAChallengeProps> = ({ onVerify, userEmail }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Official CACI number for testing phase
  const officialCaciNumber = "(11) 94060-3881";
  const correctCode = "123456"; // Fixed code for the testing phase

  useEffect(() => {
    // Simulates sending the code to the official number
    sendCode();
  }, []);

  useEffect(() => {
    let interval: any;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  const sendCode = () => {
    setSent(false);
    const timeout = setTimeout(() => {
      setSent(true);
      console.log(`CACI MFA [TEST MODE]: Code sent to ${officialCaciNumber}. Code: ${correctCode}`);
    }, 1000);
    return () => clearTimeout(timeout);
  };

  const handleResend = () => {
    if (!canResend) return;
    setTimer(60);
    setCanResend(false);
    setError(null);
    setCode(['', '', '', '', '', '']);
    sendCode();
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`mfa-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`mfa-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (code.join('') === correctCode) {
      onVerify();
    } else {
      setError("Código de verificação inválido. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-brand-blue/10 text-brand-blue rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ShieldCheck size={40} />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 mb-2">Autenticação em 2 Fatores</h2>
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-8">
            <p className="text-amber-800 text-[11px] font-black uppercase tracking-widest mb-2">Fase de Testes</p>
            <p className="text-slate-600 text-xs font-medium leading-relaxed">
              O código de verificação foi enviado para o número oficial da CACI:
              <br />
              <strong className="text-slate-900 text-sm">{officialCaciNumber}</strong>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex justify-between gap-2 mb-8">
            {code.map((digit, i) => (
              <input
                key={i}
                id={`mfa-input-${i}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-16 text-center text-2xl font-black bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-blue focus:bg-white outline-none transition-all"
              />
            ))}
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || code.some(d => !d)}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-brand-blue text-white rounded-2xl font-bold shadow-xl shadow-brand-blue/20 hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Lock size={18} />
                Verificar Acesso
              </>
            )}
          </button>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Smartphone size={14} />
              {sent ? `Código enviado para ${officialCaciNumber}` : 'Enviando código...'}
            </div>

            <button
              onClick={handleResend}
              disabled={!canResend}
              className={`text-xs font-black uppercase tracking-widest transition-all ${
                canResend 
                  ? 'text-brand-blue hover:text-brand-blue-dark' 
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              {canResend ? 'Reenviar Código' : `Reenviar em ${timer}s`}
            </button>
          </div>
        </div>
        
        <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
            Segurança Institucional CACI
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default MFAChallenge;
