import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerWithEmailPassword, loginWithGoogle } from '../services/authService';
import { UserPlus, ShieldAlert, CheckCircle2, ArrowLeft } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    cpf: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      setSuccess(true);
      setTimeout(() => navigate('/intranet'), 2000);
    } catch (err: any) {
      console.error('Erro no login Google:', err);
      setError(`Falha na autenticação Google: ${err.message || 'Tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic CPF validation (11 digits)
    const cpfClean = (formData.cpf || '').replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      setError('CPF deve conter 11 dígitos.');
      setLoading(false);
      return;
    }

    try {
      await registerWithEmailPassword(
        formData.name,
        formData.email,
        formData.password,
        cpfClean
      );
      setSuccess(true);
      setTimeout(() => navigate('/intranet'), 2000);
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      setError(err.message || 'Falha no cadastro. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-12 text-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Sucesso!</h1>
          <p className="text-slate-600">
            Sua conta foi processada com sucesso. Redirecionando para a Intranet...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative">
        <div className="p-8 sm:p-12">
          <div className="flex items-center justify-between mb-8">
            <Link to="/intranet" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-brand-blue transition-colors">
              <ArrowLeft size={16} />
              Voltar ao Login
            </Link>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-brand-blue transition-colors">
              Início
            </Link>
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Novo Cadastro</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Crie sua conta para acessar a plataforma institucional CACI.
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
              Cadastrar com Google
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Ou use e-mail</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  type="text"
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium"
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <input
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  type="email"
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium"
                  placeholder="seu@email.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                <input
                  required
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  type="text"
                  maxLength={14}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium"
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                <input
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  type="password"
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white outline-none transition-all font-medium"
                  placeholder="••••••••"
                />
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
                    <UserPlus size={20} />
                    Cadastrar Conta
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-500 font-medium">
            Já possui uma conta? <Link to="/intranet" className="text-brand-blue font-bold hover:underline">Entrar agora</Link>
          </p>
          <Link to="/" className="inline-block text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline">
            Voltar ao Site Principal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
