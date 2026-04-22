import React, { useState, useEffect } from 'react';
import { DollarSign, Building2, BarChart3, Calculator, CreditCard, Receipt } from 'lucide-react';
import BaseConsole from '../components/BaseConsole';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const AdmFinConsole = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    departments: 0,
    logs: 0
  });

  useEffect(() => {
    const unsubRevenue = onSnapshot(collection(db, 'revenue'), (snap) => {
      const total = snap.docs.reduce((acc, doc) => acc + (doc.data().value || 0), 0);
      setStats(prev => ({ ...prev, revenue: total }));
    });
    const unsubDepts = onSnapshot(collection(db, 'departments'), (snap) => {
      setStats(prev => ({ ...prev, departments: snap.size }));
    });
    const unsubLogs = onSnapshot(collection(db, 'audit_logs'), (snap) => {
      setStats(prev => ({ ...prev, logs: snap.size }));
    });

    return () => {
      unsubRevenue();
      unsubDepts();
      unsubLogs();
    };
  }, []);

  const extraStats = [
    { label: 'Receita Total', value: `R$ ${stats.revenue.toLocaleString()}`, icon: DollarSign, statColor: 'emerald' },
    { label: 'Centros de Custo', value: stats.departments, icon: Building2, statColor: 'brand-blue' },
    { label: 'Registros Auditados', value: stats.logs, icon: Receipt, statColor: 'amber' },
  ];

  return (
    <BaseConsole
      title="Admin Console - Adm & Financeiro"
      subtitle="Gerência Administrativa e Financeira"
      color="caci-fin"
      icon={Calculator}
      moduleName="Adm & Financeiro"
      hierarchyRole="subordinate"
      executiveModule="Diretoria & Conselhos"
      extraStats={extraStats}
      customTabs={{
        users: "Equipe Administrativa",
        departments: "Centros de Custo",
        audit: "Auditoria Financeira"
      }}
    />
  );
};

export default AdmFinConsole;
