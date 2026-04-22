import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Lock, ArrowRight, RefreshCw, Smartphone, Mail, AlertCircle } from "lucide-react";

const TwoFactorAuth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { orgId: string; orgName: string; email: string } | null;
  
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (!state) {
      navigate("/ecossistema");
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [state, navigate]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setError("Por favor, insira o código completo de 6 dígitos.");
      return;
    }

    setLoading(true);
    setError(null);

    // Mock verification
    setTimeout(() => {
      if (fullCode === "123456") {
        navigate("/ecossistema/dashboard-estrategico", { state });
      } else {
        setError("Código inválido. Tente novamente ou solicite um novo código.");
        setLoading(false);
      }
    }, 1500);
  };

  const handleResend = () => {
    setResending(true);
    setTimer(60);
    setTimeout(() => {
      setResending(false);
      alert("Um novo código foi enviado para o seu e-mail e telefone cadastrados.");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-sequential-0 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-12 rounded-[60px] shadow-2xl space-y-8 border border-slate-100"
      >
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-brand-blue/10 text-brand-blue rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Verificação em 2 Fatores</h1>
          <p className="text-slate-500 font-medium text-sm">
            Para sua segurança, enviamos um código de verificação para <span className="text-brand-blue font-bold">{state?.email}</span>
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-16 text-center text-2xl font-black text-slate-900 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all"
              />
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 p-4 rounded-2xl border border-red-100"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-brand-blue transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                Verificar e Acessar Dashboard
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div className="text-center pt-4">
            <button
              onClick={handleResend}
              disabled={timer > 0 || resending}
              className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-brand-blue transition-colors disabled:opacity-30"
            >
              {timer > 0 ? `Reenviar código em ${timer}s` : "Reenviar código agora"}
            </button>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 text-slate-400">
            <Smartphone size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">SMS Ativo</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <Mail size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">E-mail Ativo</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TwoFactorAuth;
