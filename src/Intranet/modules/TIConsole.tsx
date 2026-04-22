import React from 'react';
import { Cpu, Terminal, Database, Shield, Server } from 'lucide-react';
import BaseConsole from '../components/BaseConsole';

const TIConsole = () => {
  return (
    <BaseConsole
      title="Admin Console - TI & Dados"
      subtitle="Tecnologia da Informação e Gestão de Dados"
      color="caci-ti"
      icon={Cpu}
      moduleName="TI & Dados"
      hierarchyRole="subordinate"
      executiveModule="Diretoria & Conselhos"
      customTabs={{
        users: "Equipe Técnica",
        departments: "Infraestrutura & Sistemas",
        audit: "Auditoria de Segurança"
      }}
    />
  );
};

export default TIConsole;
