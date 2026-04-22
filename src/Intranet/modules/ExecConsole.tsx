import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, BarChart3, Users, Building2, Handshake, BookOpen, Package, Megaphone } from 'lucide-react';
import BaseConsole from '../components/BaseConsole';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const ExecConsole = () => {
  const [stats, setStats] = useState({
    partners: 0,
    programs: 0,
    products: 0,
    campaigns: 0
  });

  useEffect(() => {
    const unsubPartners = onSnapshot(collection(db, 'partners'), (snap) => {
      setStats(prev => ({ ...prev, partners: snap.size }));
    });
    const unsubPrograms = onSnapshot(collection(db, 'programs'), (snap) => {
      setStats(prev => ({ ...prev, programs: snap.size }));
    });
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      setStats(prev => ({ ...prev, products: snap.size }));
    });
    const unsubCampaigns = onSnapshot(collection(db, 'campaigns'), (snap) => {
      setStats(prev => ({ ...prev, campaigns: snap.size }));
    });

    return () => {
      unsubPartners();
      unsubPrograms();
      unsubProducts();
      unsubCampaigns();
    };
  }, []);

  const extraStats = [
    { label: 'Parcerias Ativas', value: stats.partners, icon: Handshake, statColor: 'brand-blue' },
    { label: 'Programas Sociais', value: stats.programs, icon: BookOpen, statColor: 'indigo' },
    { label: 'Produtos CACI', value: stats.products, icon: Package, statColor: 'violet' },
    { label: 'Campanhas Ativas', value: stats.campaigns, icon: Megaphone, statColor: 'orange' },
    { label: 'Modelos de Plano', value: '4 Ativos', icon: TrendingUp, statColor: 'emerald' },
  ];

  return (
    <BaseConsole
      title="Admin Console - Diretoria & Conselhos"
      subtitle="Diretoria Executiva, Conselho de Administração e Conselho Fiscal"
      color="caci-exec"
      icon={Shield}
      moduleName="Diretoria & Conselhos"
      hierarchyRole="executive"
      subordinateModules={['TI & Dados', 'Recursos Humanos', 'Projetos & Captação', 'Adm & Financeiro']}
      extraStats={extraStats}
      customTabs={{
        users: "Gestão da Alta Liderança",
        departments: "Conselhos & Comitês",
        audit: "Auditoria Estratégica"
      }}
    />
  );
};

export default ExecConsole;
