import React, { forwardRef } from "react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from "recharts";
import { InstitutionalDiagnostic as DiagnosticType } from "../types";

interface DiagnosticReportProps {
  orgData: any;
  diagnosticData: any;
  chartData: any[];
}

const DiagnosticReport = forwardRef<HTMLDivElement, DiagnosticReportProps>(({ orgData, diagnosticData, chartData }, ref) => {
  const result = diagnosticData.detailedResult as DiagnosticType;
  const date = new Date().toLocaleDateString('pt-BR');

  return (
    <div ref={ref} className="p-12 bg-white text-slate-900 font-sans print:p-8" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Institutional Header */}
      <div className="flex justify-between items-start border-b-2 border-brand-blue pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand-blue rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
            CACI
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900">Casa de Apoio ao Cidadão</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Fundada em 18/04/2003 • CNPJ: 05.639.031/0001-00</p>
          </div>
        </div>
        <div className="text-right text-[10px] text-slate-400 font-medium">
          <p>Telefone: (011) 3476-0623</p>
          <p>www.caci.ong.br</p>
        </div>
      </div>

      {/* Report Title */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">INTELIGÊNCIA ESTRATÉGICA CACI-IMI</h2>
        <div className="flex justify-center gap-4">
          <span className="px-4 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-sm font-bold">
            Nível {result.maturityLevel}
          </span>
          <span className="px-4 py-1 bg-brand-blue text-white rounded-full text-sm font-bold">
            Selo {result.maturitySeal}
          </span>
          <span className="px-4 py-1 bg-slate-900 text-white rounded-full text-sm font-bold">
            Confiabilidade: {result.reliabilityScore}%
          </span>
        </div>
      </div>

      {/* Registration Data */}
      <div className="mb-12">
        <h3 className="text-xs font-black text-brand-blue uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Dados da Organização</h3>
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Organização</p>
            <p className="font-bold text-slate-900">{orgData?.name || diagnosticData.orgName}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Localização</p>
            <p className="font-bold text-slate-900">{orgData?.city || '-'}/{orgData?.state || '-'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ano de Fundação</p>
            <p className="font-bold text-slate-900">{orgData?.yearFounded || '-'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Área de Atuação</p>
            <p className="font-bold text-slate-900">{orgData?.mainArea || '-'}</p>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="mb-12">
        <h3 className="text-xs font-black text-brand-blue uppercase tracking-widest border-b border-slate-100 pb-2 mb-6">Radar de Maturidade (8 Dimensões)</h3>
        <div className="h-[300px] w-full flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} />
              <Radar
                name="Maturidade"
                dataKey="A"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Predictive Analysis */}
      <div className="mb-12 grid grid-cols-2 gap-6">
        <div className="p-6 bg-slate-900 text-white rounded-3xl">
          <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 text-brand-blue">Análise Preditiva</h3>
          <div className="space-y-3">
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-bold">Risco de Descontinuidade</p>
              <p className="text-sm font-bold uppercase">{result.reliabilityRisk}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-bold">Potencial de Escala</p>
              <p className="text-sm font-bold uppercase">{result.predictiveAnalysis.scalePotential}</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3">Resumo Estratégico</h3>
          <p className="text-[11px] text-slate-600 leading-relaxed italic">
            "{result.predictiveAnalysis.recommendations[0]}"
          </p>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4">Pontos Fortes</h3>
          <ul className="space-y-3">
            {result.strengths.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-4">Gaps Críticos</h3>
          <ul className="space-y-3">
            {result.weaknesses.map((w: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-12">
        <h3 className="text-xs font-black text-brand-blue uppercase tracking-widest border-b border-slate-100 pb-2 mb-6">Plano de Desenvolvimento Institucional (PDI)</h3>
        <div className="space-y-4">
          {result.recommendations.map((rec: any, i: number) => (
            <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                {i + 1}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rec.dimension}</p>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">{rec.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-12 border-t border-slate-100 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
          OBSERVATÓRIO NACIONAL DE MATURIDADE DAS OSCS — ECOSSISTEMA CACI 2026+
        </p>
        <p className="text-[8px] text-slate-300">
          Relatório de Auditoria Técnica | ID: {diagnosticData.diagnosticId || 'N/A'} | Gerado em {date}
        </p>
      </div>
    </div>
  );
});

DiagnosticReport.displayName = "DiagnosticReport";

export default DiagnosticReport;
