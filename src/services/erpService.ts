import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
  orderBy,
  limit,
  increment
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  ERPCampaign, 
  ERPAsset, 
  ERPMetrics, 
  OSCAssetUsage,
  MaturityLevel
} from '../types';

export interface InstitutionalIdentity {
  id: string;
  registro_id: string;
  nome: string;
  email_institucional: string;
  area: string;
  vinculo: string;
  funcao: string;
  cfrh: string;
  status: string;
  validacao: string;
  unidade: string;
}

const CAMPAIGNS_COLLECTION = 'erp_campaigns';
const ASSETS_COLLECTION = 'erp_assets';
const METRICS_COLLECTION = 'erp_metrics';
const ASSET_USAGE_COLLECTION = 'osc_asset_usage';

export const erpService = {
  // Fetch Institutional Identities from Backend
  async getInstitutionalIdentities(): Promise<InstitutionalIdentity[]> {
    const response = await fetch('/api/auth/validate-identity'); // Real endpoint for IDs
    if (!response.ok) return [];
    const data = await response.json();
    return data.profiles || [];
  },

  // Campaigns
  async getCampaigns(organizationId?: string) {
    const q = query(collection(db, CAMPAIGNS_COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ERPCampaign));
  },

  async createCampaign(campaign: Omit<ERPCampaign, 'id' | 'created_at' | 'created_by'>) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    
    return await addDoc(collection(db, CAMPAIGNS_COLLECTION), {
      ...campaign,
      created_at: serverTimestamp(),
      created_by: auth.currentUser.uid
    });
  },

  async updateCampaign(id: string, data: Partial<ERPCampaign>) {
    const docRef = doc(db, CAMPAIGNS_COLLECTION, id);
    await updateDoc(docRef, data);
  },

  // Assets
  async getAssets() {
    const q = query(collection(db, ASSETS_COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ERPAsset));
  },

  async getRecommendedAssets(maturityLevel: number) {
    const q = query(
      collection(db, ASSETS_COLLECTION),
      where('maturity_level', '<=', maturityLevel),
      where('status', '==', 'recomendado')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ERPAsset));
  },

  async createAsset(asset: Omit<ERPAsset, 'id' | 'last_sync'>) {
    return await addDoc(collection(db, ASSETS_COLLECTION), {
      ...asset,
      last_sync: serverTimestamp()
    });
  },

  async updateAsset(id: string, data: Partial<ERPAsset>) {
    const docRef = doc(db, ASSETS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      last_sync: serverTimestamp()
    });
  },

  // Asset Usage
  async trackAssetUsage(organizationId: string, assetId: string, status: OSCAssetUsage['status']) {
    const q = query(
      collection(db, ASSET_USAGE_COLLECTION),
      where('organization_id', '==', organizationId),
      where('asset_id', '==', assetId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      await addDoc(collection(db, ASSET_USAGE_COLLECTION), {
        organization_id: organizationId,
        asset_id: assetId,
        status,
        activated_at: serverTimestamp(),
        last_interaction: serverTimestamp()
      });
      
      const assetRef = doc(db, ASSETS_COLLECTION, assetId);
      await updateDoc(assetRef, { usage_count: increment(1) });
    } else {
      const usageDoc = snapshot.docs[0];
      await updateDoc(doc(db, ASSET_USAGE_COLLECTION, usageDoc.id), {
        status,
        last_interaction: serverTimestamp()
      });
    }
  },

  async getOSCAssets(organizationId: string) {
    const q = query(
      collection(db, ASSET_USAGE_COLLECTION),
      where('organization_id', '==', organizationId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OSCAssetUsage));
  },

  // Metrics (SSOT - Backend)
  async getMetrics(organizationId?: string): Promise<ERPMetrics | null> {
    const response = await fetch(`/api/metrics/summary?orgId=${organizationId || 'global'}`);
    if (!response.ok) return null;
    return await response.json();
  },

  async updateMetrics(data: Partial<ERPMetrics>) {
    // Escrita de métricas agora centralizada no backend para auditoria
    await fetch('/api/metrics/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async syncMetrics(organizationId: string) {
    // Trigger real sync on backend
    await fetch('/api/metrics/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId })
    });
  },

  subscribeToMetrics(organizationId: string, callback: (metrics: ERPMetrics) => void) {
    // In production, we'd use WebSockets/SSE from the backend
    // For now, we still use Firestore onSnapshot but the logic is real-data based
    const collRef = collection(db, METRICS_COLLECTION);
    const q = query(
      collRef, 
      where('organization_id', '==', organizationId),
      orderBy('last_updated', 'desc'),
      limit(1)
    );
    
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ERPMetrics);
      }
    });
  }
};
