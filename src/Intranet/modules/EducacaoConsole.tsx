import React from 'react';
import { GraduationCap, BookOpen, Users, School } from 'lucide-react';
import BaseConsole from '../components/BaseConsole';

const EducacaoConsole = () => {
  return (
    <BaseConsole
      title="Admin Console - Educação"
      subtitle="Programas Educacionais e Formação Profissional"
      color="caci-edu"
      icon={GraduationCap}
      moduleName="Educação"
      customTabs={{
        users: "Corpo Docente & Técnico",
        departments: "Polos & Unidades",
        audit: "Auditoria Pedagógica"
      }}
    />
  );
};

export default EducacaoConsole;
