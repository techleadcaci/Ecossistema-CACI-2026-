import React from 'react';
import { Megaphone, Share2, Users, Palette } from 'lucide-react';
import BaseConsole from '../components/BaseConsole';

const MktConsole = () => {
  return (
    <BaseConsole
      title="Admin Console - Comunicação & Marketing"
      subtitle="Gerência de Comunicação e Marketing"
      color="caci-mkt"
      icon={Megaphone}
      moduleName="Comunicação & Marketing"
      customTabs={{
        users: "Equipe Criativa",
        departments: "Canais & Campanhas",
        audit: "Auditoria de Marca"
      }}
    />
  );
};

export default MktConsole;
