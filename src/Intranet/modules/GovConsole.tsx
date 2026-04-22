import React from 'react';
import { ShieldCheck, Scale, FileText, Leaf, MessageSquare, Shield } from 'lucide-react';
import BaseConsole from '../components/BaseConsole';

const GovConsole = () => {
  return (
    <BaseConsole
      title="Admin Console - Governança & Compliance"
      subtitle="Governança Corporativa, Controle Interno, Jurídico, ESG, Compliance e Ouvidoria"
      color="caci-gov"
      icon={ShieldCheck}
      moduleName="Governança & Compliance"
      hierarchyRole="subordinate"
      executiveModule="Diretoria & Conselhos"
      customTabs={{
        users: "Gestão de Controladoria",
        departments: "Unidades de Controle",
        audit: "Auditoria & Compliance"
      }}
    />
  );
};

export default GovConsole;
