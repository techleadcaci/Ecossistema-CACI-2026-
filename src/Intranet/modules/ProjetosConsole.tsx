import React, { useState, useEffect } from 'react';
import { Target, DollarSign, TrendingUp, Briefcase, Handshake, BookOpen } from 'lucide-react';
import BaseConsole from '../components/BaseConsole';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

const ProjetosConsole = () => {
  const [stats, setStats] = useState({
    projects: 0,
    partners: 0,
    activeCampaigns: 0
  });

  useEffect(() => {
    const unsubProjects = onSnapshot(collection(db, 'programs'), (snap) => {
      setStats(prev => ({ ...prev, projects: snap.size }));
    });
    const unsubPartners = onSnapshot(collection(db, 'partners'), (snap) => {
      setStats(prev => ({ ...prev, partners: snap.size }));
    });
    const unsubCampaigns = onSnapshot(query(collection(db, 'campaigns'), where('status', '==', 'ativa')), (snap) => {
      setStats(prev => ({ ...prev, activeCampaigns: snap.size }));
    });

    return () => {
      unsubProjects();
      unsubPartners();
      unsubCampaigns();
    };
  }, []);

  const extraStats = [
    { label: 'Projetos em Gestão', value: stats.projects, icon: Briefcase, statColor: 'brand-blue' },
    { label: 'Parceiros Estratégicos', value: stats.partners, icon: Handshake, statColor: 'indigo' },
    { label: 'Campanhas de Captação', value: stats.activeCampaigns, icon: TrendingUp, statColor: 'emerald' },
  ];

  return (
    <BaseConsole
      title="Admin Console - Projetos & Captação"
      subtitle="Gerência de Projetos e Captação de Recursos"
      color="caci-proj"
      icon={Target}
      moduleName="Projetos & Captação"
      hierarchyRole="subordinate"
      executiveModule="Diretoria & Conselhos"
      extraStats={extraStats}
      customTabs={{
        users: "Gestores & Captadores",
        departments: "Portfólio de Projetos",
        audit: "Auditoria de Recursos"
      }}
    />
  );
};

export default ProjetosConsole;
