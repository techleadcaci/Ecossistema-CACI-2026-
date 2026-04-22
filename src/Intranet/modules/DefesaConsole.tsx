import React from 'react';
import { ShieldAlert, Scale, Users, Gavel } from 'lucide-react';
import BaseConsole from '../components/BaseConsole';

const DefesaConsole = () => {
  return (
    <BaseConsole
      title="Admin Console - Defesa de Direitos"
      subtitle="Advocacy, Proteção e Garantia de Direitos"
      color="caci-def"
      icon={Gavel}
      moduleName="Defesa de Direitos"
      customTabs={{
        users: "Corpo Jurídico & Social",
        departments: "Frentes de Atuação",
        audit: "Auditoria de Casos"
      }}
    />
  );
};

export default DefesaConsole;
