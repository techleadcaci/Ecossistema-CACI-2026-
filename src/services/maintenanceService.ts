import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  addDoc, 
  serverTimestamp, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTIONS_TO_RESET = [
  'rh_people',
  'rh_lifecycle',
  'rh_imi_evaluations',
  'rh_programs',
  'rh_diagnostics',
  'improvement_actions',
  'departments',
  'roles',
  'permissions',
  'audit_logs',
  'organizations',
  'diagnostics',
  'adesao_ecossistema',
  'osc_classification',
  'institutional_compliance',
  'network_profiles',
  'interactions',
  'time_logs',
  'elections',
  'candidates',
  'votes',
  'raffles',
  'raffle_purchases',
  'donations',
  'institutional_projects',
  'apoia_campaigns',
  'erp_campaigns',
  'erp_assets',
  'erp_metrics',
  'governance_logs',
  'sessions',
  'agent_corrections',
  'chat_messages',
  'institutional_diagnostics',
  'leads',
  'revenue'
];

const ADMIN_EMAILS = ['ti@caci.ong.br', 'diretoria@caci.ong.br', 'comunica@caci.ong.br'];

export const performSystemReset = async (performedBy: string) => {
  console.log('Starting System Reset...');
  const backupData: any = {};

  try {
    // 1. Backup Data
    for (const colName of COLLECTIONS_TO_RESET) {
      const snap = await getDocs(collection(db, colName));
      backupData[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    // Backup users (except admins)
    const usersSnap = await getDocs(collection(db, 'users'));
    backupData['users'] = usersSnap.docs
      .filter(d => !ADMIN_EMAILS.includes(d.data().email))
      .map(d => ({ id: d.id, ...d.data() }));

    // Save Backup to Firestore
    await addDoc(collection(db, 'backups'), {
      data: JSON.stringify(backupData),
      timestamp: serverTimestamp(),
      performed_by: performedBy,
      type: 'SYSTEM_RESET_PRE_LAUNCH'
    });

    console.log('Backup completed. Starting deletion...');

    // 2. Delete Data
    for (const colName of COLLECTIONS_TO_RESET) {
      const snap = await getDocs(collection(db, colName));
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        batch.delete(d.ref);
      });
      await batch.commit();
      console.log(`Collection ${colName} cleared.`);
    }

    // Delete non-admin users
    const batchUsers = writeBatch(db);
    usersSnap.docs.forEach(d => {
      if (!ADMIN_EMAILS.includes(d.data().email)) {
        batchUsers.delete(d.ref);
      }
    });
    await batchUsers.commit();
    console.log('Non-admin users cleared.');

    // 3. Log the action
    await addDoc(collection(db, 'audit_logs'), {
      action: 'SYSTEM_RESET',
      details: { message: 'System reset performed for scheduled launch on 05/05/2026' },
      user_email: performedBy,
      timestamp: serverTimestamp()
    });

    console.log('System Reset completed successfully.');
    return { success: true };
  } catch (error) {
    console.error('Error during system reset:', error);
    throw error;
  }
};

export const formatBRDate = (date: Date | any) => {
  if (!date) return '';
  const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatBRDateTime = (date: Date | any) => {
  if (!date) return '';
  const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};
