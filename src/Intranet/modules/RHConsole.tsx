import React from 'react';
import { Users, UserPlus, Briefcase, Award, GraduationCap, Handshake } from 'lucide-react';
import BaseConsole from '../components/BaseConsole';

const RHConsole = () => {
  return (
    <BaseConsole
      title="Admin Console - Recursos Humanos"
      subtitle="Gestão de Pessoas: Jovem Aprendiz, Parceiros, CLT, Estágio e Voluntariado"
      color="caci-rh"
      icon={Users}
      moduleName="Recursos Humanos"
      hierarchyRole="subordinate"
      executiveModule="Diretoria & Conselhos"
      customTabs={{
        users: "Gestão de Talentos",
        departments: "Programas de Vínculo",
        audit: "Auditoria de Pessoal"
      }}
    />
  );
};

export default RHConsole;
