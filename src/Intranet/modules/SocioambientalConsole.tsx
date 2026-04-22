import React from 'react';
import { Leaf, Music, Palette, Trophy, Globe } from 'lucide-react';
import BaseConsole from '../components/BaseConsole';

const SocioambientalConsole = () => {
  return (
    <BaseConsole
      title="Admin Console - Socioambiental"
      subtitle="Esporte, Cultura, Verde e Meio Ambiente"
      color="caci-esg"
      icon={Leaf}
      moduleName="Socioambiental"
      customTabs={{
        users: "Equipe Socioambiental",
        departments: "Programas & Projetos",
        audit: "Auditoria Ambiental"
      }}
    />
  );
};

export default SocioambientalConsole;
