import React, { useState, useRef } from 'react';
import { ShieldAlert, RotateCcw, CheckCircle2, AlertTriangle, Loader2, Printer } from 'lucide-react';
import { performSystemReset, formatBRDateTime } from '../services/maintenanceService';
import { useAuth } from '../hooks/useAuth';
import { useReactToPrint } from 'react-to-print';

const Governance = () => {
  const { profile } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    if (!profile || profile.role !== 'superadmin') return;
    
    setIsResetting(true);
    setResetStatus(null);
    setShowConfirm(false);

    try {
      const result = await performSystemReset(profile.email);
      setResetStatus({
        success: result.success,
        message: result.success 
          ? `Sistema resetado com sucesso em ${formatBRDateTime(new Date())}. Backup realizado.` 
          : `Erro ao resetar.`
      });
    } catch (error) {
      setResetStatus({
        success: false,
        message: `Erro inesperado: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Painel_Governanca_CACI_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`,
  });

  if (profile?.role !== 'superadmin' && profile?.role?.toLowerCase() !== 'diretoria') {
    return (
      <div className="p-8 text-center">
        <ShieldAlert className="mx-auto text-red-500 mb-4" size={48} />
        <h1 className="text-2xl font-bold text-slate-900">Acesso Negado</h1>
        <p className="text-slate-600">Apenas Super Administradores e a Diretoria podem acessar esta área.</p>
      </div>
    );
  }

  const canReset = profile?.role === 'superadmin';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div ref={contentRef} className="print:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Painel de Governança</h1>
            <p className="text-slate-600">Gestão de sistema, manutenção e conformidade institucional.</p>
          </div>
          <button 
            onClick={() => handlePrint()}
            className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-bold text-sm print:hidden"
          >
            <Printer size={18} />
            Imprimir Painel
          </button>
        </div>

        <div className="grid gap-6">
        {/* System Reset Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <RotateCcw size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Reset Geral do Sistema</h2>
                <p className="text-sm text-slate-500">Preparação para o lançamento oficial (05/05/2026)</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {!canReset && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3 text-blue-800">
                <ShieldAlert size={20} className="shrink-0" />
                <p className="text-sm">Seu nível de acesso permite visualizar e imprimir este painel, mas o reset do sistema é restrito ao Super Administrador (TI).</p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                <div className="text-sm text-amber-800">
                  <p className="font-bold mb-1">Atenção: Ação Irreversível</p>
                  <ul className="list-disc list-inside space-y-1 opacity-90">
                    <li>Todos os dados (Leads, Receitas, Campanhas, etc.) serão apagados.</li>
                    <li>Todos os usuários (exceto administradores) serão removidos.</li>
                    <li>Um backup completo será armazenado no console de auditoria.</li>
                    <li>O sistema será reiniciado com os dados base da ONG CACI.</li>
                  </ul>
                </div>
              </div>
            </div>

            {resetStatus && (
              <div className={`mb-6 p-4 rounded-xl flex gap-3 ${resetStatus.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                {resetStatus.success ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
                <p className="text-sm font-medium">{resetStatus.message}</p>
              </div>
            )}

            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={isResetting || !canReset}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw size={20} />
                Iniciar Procedimento de Reset
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-sm font-bold text-red-600">
                  Você tem certeza absoluta? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={isResetting || !canReset}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Processando...
                      </>
                    ) : (
                      'Sim, Resetar Agora'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ativos Institucionais e Inteligência de Dados */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-brand-blue/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Ativos Institucionais e Inteligência de Dados</h2>
                <p className="text-sm text-slate-500">Gestão de Ativos Materiais, Imateriais e Intelectuais</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ativos Materiais</h4>
                <p className="text-xl font-black text-slate-900">Patrimônio Físico</p>
                <p className="text-[10px] text-slate-500 mt-1">Sedes, equipamentos e mobiliário.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ativos Imateriais</h4>
                <p className="text-xl font-black text-slate-900">Marca e Reputação</p>
                <p className="text-[10px] text-slate-500 mt-1">Identidade visual e credibilidade social.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ativos Intelectuais</h4>
                <p className="text-xl font-black text-slate-900">Metodologias CACI</p>
                <p className="text-[10px] text-slate-500 mt-1">Programas, processos e inteligência social.</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">IMI CACI - Índice de Maturidade Institucional</h3>
                <span className="px-3 py-1 rounded-full bg-brand-gold text-slate-900 text-[10px] font-black uppercase tracking-widest">Nível 4 - Avançado</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                <div className="w-[85%] h-full bg-brand-gold" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                O IMI CACI reflete a maturidade e governança da organização em conformidade com as políticas institucionais 2026+. 
                A inteligência de dados é o pilar central para a tomada de decisões estratégicas e transparência radical.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Políticas de Governança 2026+</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Política de Tecnologia e Inovação',
                  'Política de Gestão de Ativos',
                  'Política de Segurança da Informação',
                  'Política de Transparência Radical'
                ].map((policy, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 size={14} className="text-brand-emerald" />
                    {policy}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Other Governance Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Configurações de Domínio</h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm font-bold text-slate-700 mb-1">Domínio Alvo:</p>
              <code className="text-brand-blue font-mono text-sm">caci.ong.br</code>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Para configurar o domínio no Google Cloud, siga os passos:
              <br /><br />
              1. Acesse o <strong>Cloud Run</strong> no Console do Google Cloud.<br />
              2. Selecione o serviço da aplicação.<br />
              3. Vá em <strong>Manage Custom Domains</strong>.<br />
              4. Adicione <code>caci.ong.br</code> e siga as instruções de verificação DNS (registros A/AAAA ou CNAME).
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default Governance;
