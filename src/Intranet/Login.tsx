import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginWithEmailPassword, loginWithGoogle } from '../services/authService';
import { LogIn, ShieldAlert, UserPlus, Mail, Lock, ArrowLeft } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginWithEmailPassword(formData.email, formData.password);
    } catch (err: any) {
      console.error('Erro no login:', err);
      const errorMessage = err.code === 'auth/operation-not-allowed'
        ? 'O login com e-mail e senha está desativado. Por favor, use o login com Google.'
        : err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Email ou senha inválidos. Por favor, tente novamente.'
        : `Falha na autenticação: ${err.message || 'Verifique suas credenciais.'}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Erro no login Google:', err);
      setError(`Falha na autenticação Google: ${err.message || 'Tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative">
        <Link 
          to="/" 
          className="absolute top-6 left-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-brand-blue transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Voltar ao Início
        </Link>
        <div className="p-8 sm:p-12 text-center">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg border border-slate-100 p-2">
            <img 
              src="https://ais-pre-qvipanm3ysdp4ln6k5eqfh-308119493736.us-west2.run.app/Logo_CACI_2026+.SVG.png" 
              alt="CACI Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-4">Acesso Restrito</h1>
          <p className="text-slate-600 mb-10 leading-relaxed">
            Bem-vindo à Intranet CACI. Por favor, identifique-se para acessar o sistema de gestão institucional.
          </p>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
              <ShieldAlert size={20} className="shrink-0" />
              <span className="text-left">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Entrar com Google
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Ou use e-mail</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email"
                    className="w-full pl-14 pr-8 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    type="password"
                    className="w-full pl-14 pr-8 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-brand-blue text-white rounded-2xl font-bold shadow-xl shadow-brand-blue/20 hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-50 disabled:hover:scale-100 mt-4"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn size={20} />
                    Entrar no Sistema
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <Link 
              to="/intranet/register" 
              className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue hover:underline"
            >
              <UserPlus size={18} />
              Ainda não tem conta? Cadastre-se
            </Link>
          </div>
        </div>
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">
            Sistema de Gestão Integrada CACI
          </p>
          <Link to="/" className="inline-block text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline">
            Voltar ao Site Principal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
