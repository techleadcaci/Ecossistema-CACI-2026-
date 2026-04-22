import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  id_ccgu?: string; // Identificador da pessoa (ID-CCGU)
  id_cfrh?: string; // Identificador da função institucional (ID-CFRH)
  cpf?: string;
  role: 'user' | 'admin' | 'superadmin' | 'diretoria';
  status?: 'ativo' | 'inativo';
  user_type?: 'interno' | 'institucional' | 'osc';
  department?: string;
  area?: string;
  bank_of_hours?: number; // In minutes
  created_at: any;
  last_active?: any;
}

export const checkCpfUnique = async (cpf: string): Promise<boolean> => {
  const q = query(collection(db, 'users'), where('cpf', '==', cpf));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};

export const logAction = async (action: string, details: any = {}) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    // Fetch profile to get ID-CCGU and ID-CFRH
    const profileDoc = await getDoc(doc(db, 'users', user.uid));
    const profile = profileDoc.exists() ? profileDoc.data() as UserProfile : null;

    await addDoc(collection(db, 'audit_logs'), {
      user_id: user.uid, // UID - Identificador técnico
      id_ccgu: profile?.id_ccgu || 'ausência de identificação da pessoa',
      id_cfrh: profile?.id_cfrh || 'ausência de vínculo funcional',
      user_email: user.email, // Modelo de identidade legada
      action,
      details,
      timestamp: serverTimestamp(),
      ip_address: 'client-side'
    });
  } catch (error) {
    console.error('Error logging action:', error);
  }
};

export const registerWithEmailPassword = async (name: string, email: string, password: string, cpf: string) => {
  // 1. Check CPF uniqueness
  const isUnique = await checkCpfUnique(cpf);
  if (!isUnique) {
    throw new Error('CPF já cadastrado no sistema.');
  }

  // 2. Create Auth User
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 3. Create Firestore Profile
  const userProfile: UserProfile = {
    uid: user.uid,
    name,
    email,
    cpf,
    role: 'user',
    status: 'ativo',
    user_type: 'interno',
    created_at: serverTimestamp(),
    id_ccgu: 'pendente_configuracao',
    id_cfrh: 'pendente_configuracao'
  };

  await setDoc(doc(db, 'users', user.uid), userProfile);

  // 4. Log Action
  await logAction('user_registration', { name, email, cpf });

  return userProfile;
};

export const loginWithEmailPassword = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Fetch profile to verify role
  const profileDoc = await getDoc(doc(db, 'users', user.uid));
  if (!profileDoc.exists()) {
    throw new Error('Perfil de usuário não encontrado.');
  }

  const profile = profileDoc.data() as UserProfile;

  // Log Action
  await logAction('user_login', { email });

  return profile;
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  // Check if profile exists
  const profileDoc = await getDoc(doc(db, 'users', user.uid));
  let profile: UserProfile;

  if (!profileDoc.exists()) {
    // Create initial profile for Google user
    profile = {
      uid: user.uid,
      name: user.displayName || 'Usuário Google',
      email: user.email || '',
      role: 'user',
      status: 'ativo',
      user_type: 'interno',
      created_at: serverTimestamp(),
      id_ccgu: 'pendente_configuracao',
      id_cfrh: 'pendente_configuracao'
    };
    await setDoc(doc(db, 'users', user.uid), profile);
    await logAction('user_registration_google', { email: user.email });
  } else {
    profile = profileDoc.data() as UserProfile;
    await logAction('user_login_google', { email: user.email });
  }

  return profile;
};

export const logout = async () => {
  await logAction('user_logout');
  await signOut(auth);
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const profileDoc = await getDoc(doc(db, 'users', user.uid));
  if (!profileDoc.exists()) return null;

  return profileDoc.data() as UserProfile;
};
