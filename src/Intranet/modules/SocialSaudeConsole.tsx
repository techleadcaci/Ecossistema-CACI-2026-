import React from 'react';
import { Heart, Activity, Users, Hospital } from 'lucide-react';
import BaseConsole from '../components/BaseConsole';

const SocialSaudeConsole = () => {
  return (
    <BaseConsole
      title="Admin Console - Assistência Social & Saúde"
      subtitle="Atendimento Social e Serviços de Saúde"
      color="caci-ass"
      icon={Heart}
      moduleName="Assistência Social & Saúde"
      customTabs={{
        users: "Equipe Multidisciplinar",
        departments: "Unidades de Atendimento",
        audit: "Auditoria de Prontuários"
      }}
    />
  );
};

export default SocialSaudeConsole;
