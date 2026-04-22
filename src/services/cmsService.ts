import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  CMSContent, 
  CMSVersion, 
  CMSWorkflow, 
  CMSComment, 
  CMSAuditLog,
  CMSContentType,
  CMSContentStatus
} from '../types';
import { GoogleGenAI } from "@google/genai";

const CONTENT_COLLECTION = 'cms_content';
const VERSIONS_COLLECTION = 'cms_versions';
const WORKFLOWS_COLLECTION = 'cms_workflows';
const COMMENTS_COLLECTION = 'cms_comments';
const AUDIT_LOGS_COLLECTION = 'cms_audit_logs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const cmsService = {
  async getContentByKey(key: string): Promise<CMSContent | null> {
    const q = query(collection(db, CONTENT_COLLECTION), where('key', '==', key), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() } as CMSContent;
  },

  async getAllContent(): Promise<CMSContent[]> {
    const snapshot = await getDocs(collection(db, CONTENT_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CMSContent));
  },

  async updateContent(id: string, value: string, userId: string, department?: string) {
    const contentRef = doc(db, CONTENT_COLLECTION, id);
    const contentSnap = await getDoc(contentRef);
    if (!contentSnap.exists()) throw new Error('Content not found');
    
    const currentData = contentSnap.data() as CMSContent;
    const newVersion = (currentData.version || 0) + 1;

    // 1. Create a new version record
    await addDoc(collection(db, VERSIONS_COLLECTION), {
      content_id: id,
      value: currentData.value,
      version_number: currentData.version,
      created_at: serverTimestamp(),
      created_by: userId
    });

    // 2. Update the main content as a draft (Level 1)
    await updateDoc(contentRef, {
      value,
      status: 'draft',
      version: newVersion,
      last_edited_by: userId,
      last_edited_at: serverTimestamp(),
      department: department || currentData.department
    });

    // 3. Initialize workflow
    await addDoc(collection(db, WORKFLOWS_COLLECTION), {
      content_id: id,
      level: 1,
      status: 'pending',
      timestamp: serverTimestamp()
    });

    // 4. Log action
    await this.logAction('edit', id, userId, { version: newVersion });
  },

  async approveWorkflow(contentId: string, level: number, userId: string, comments?: string) {
    const q = query(
      collection(db, WORKFLOWS_COLLECTION), 
      where('content_id', '==', contentId), 
      where('level', '==', level),
      where('status', '==', 'pending'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) throw new Error('Workflow stage not found');

    const workflowDoc = snapshot.docs[0];
    await updateDoc(doc(db, WORKFLOWS_COLLECTION, workflowDoc.id), {
      status: 'approved',
      reviewer_id: userId,
      comments,
      timestamp: serverTimestamp()
    });

    // Update content status based on level
    const contentRef = doc(db, CONTENT_COLLECTION, contentId);
    let nextStatus: CMSContentStatus = 'draft';
    if (level === 1) nextStatus = 'review';
    if (level === 2) nextStatus = 'approved';
    if (level === 3) nextStatus = 'published';

    await updateDoc(contentRef, { status: nextStatus });

    // If not published, create next workflow stage
    if (level < 3) {
      await addDoc(collection(db, WORKFLOWS_COLLECTION), {
        content_id: contentId,
        level: level + 1,
        status: 'pending',
        timestamp: serverTimestamp()
      });
    }

    await this.logAction('approve', contentId, userId, { level, status: nextStatus });
  },

  async rollback(contentId: string, versionNumber: number, userId: string) {
    const q = query(
      collection(db, VERSIONS_COLLECTION), 
      where('content_id', '==', contentId), 
      where('version_number', '==', versionNumber),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) throw new Error('Version not found');

    const versionData = snapshot.docs[0].data() as CMSVersion;
    const contentRef = doc(db, CONTENT_COLLECTION, contentId);
    
    await updateDoc(contentRef, {
      value: versionData.value,
      version: versionNumber,
      status: 'published',
      last_edited_by: userId,
      last_edited_at: serverTimestamp()
    });

    await this.logAction('rollback', contentId, userId, { version: versionNumber });
  },

  async addComment(contentId: string, userId: string, text: string, department?: string) {
    await addDoc(collection(db, COMMENTS_COLLECTION), {
      content_id: contentId,
      user_id: userId,
      department,
      text,
      timestamp: serverTimestamp()
    });
  },

  async getComments(contentId: string): Promise<CMSComment[]> {
    const q = query(collection(db, COMMENTS_COLLECTION), where('content_id', '==', contentId), orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CMSComment));
  },

  async logAction(action: string, contentId: string, userId: string, details?: any) {
    await addDoc(collection(db, AUDIT_LOGS_COLLECTION), {
      action,
      content_id: contentId,
      user_id: userId,
      timestamp: serverTimestamp(),
      details
    });
  },

  async getAuditLogs(contentId?: string): Promise<CMSAuditLog[]> {
    let q = query(collection(db, AUDIT_LOGS_COLLECTION), orderBy('timestamp', 'desc'), limit(50));
    if (contentId) {
      q = query(collection(db, AUDIT_LOGS_COLLECTION), where('content_id', '==', contentId), orderBy('timestamp', 'desc'), limit(50));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CMSAuditLog));
  },

  // AI Integration
  async getAISuggestions(content: string, type: CMSContentType) {
    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Como especialista em arquitetura de sistemas institucionais e comunicação para ONGs, analise o seguinte conteúdo de um ${type} e sugira melhorias em termos de clareza, impacto, SEO e detecção de inconsistências ou riscos: \n\n ${content}`,
    });
    const response = await model;
    return response.text;
  }
};
