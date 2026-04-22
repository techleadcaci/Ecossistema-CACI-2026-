import { 
  initializeTestEnvironment, 
  RulesTestEnvironment, 
  assertFails, 
  assertSucceeds 
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

describe('Firestore Security Rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'caci-security-test',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
        host: 'localhost',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it('P1: Disallows manual superadmin role creation', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const userRef = doc(alice.firestore(), 'users', 'alice');
    await assertFails(setDoc(userRef, {
      uid: 'alice',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'superadmin',
      created_at: new Date()
    }));
  });

  it('P2: Disallows editing another user profile', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const bobRef = doc(alice.firestore(), 'users', 'bob');
    await assertFails(setDoc(bobRef, {
      name: 'Hacked Bob'
    }));
  });

  it('P3: Disallows creating organization as another owner', async () => {
    const alice = testEnv.authenticatedContext('alice', { email_verified: true });
    const orgRef = doc(collection(alice.firestore(), 'organizations'));
    await assertFails(setDoc(orgRef, {
      name: 'Fake Org',
      cnpj: '00.000.000/0001-00',
      owner_user_id: 'bob'
    }));
  });

  it('P4: Disallows deleting audit logs', async () => {
    const admin = testEnv.authenticatedContext('admin');
    // Seed an audit log
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'audit_logs', 'log1'), { action: 'test' });
    });

    const user = testEnv.authenticatedContext('user');
    await assertFails(deleteDoc(doc(user.firestore(), 'audit_logs', 'log1')));
  });

  it('P5: Disallows anonymous write to global stats', async () => {
    const anon = testEnv.unauthenticatedContext();
    const statsRef = doc(anon.firestore(), 'global_stats', 'current');
    await assertFails(setDoc(statsRef, { total_oscs: 99999 }));
  });

  it('P6: Disallows standard user listing all users', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const usersColl = collection(alice.firestore(), 'users');
    await assertFails(getDocs(usersColl));
  });

  it('P7: Disallows standard user reading audit logs', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const logsColl = collection(alice.firestore(), 'audit_logs');
    await assertFails(getDocs(logsColl));
  });

  it('P8: Disallows non-owner updating organization', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'organizations', 'org1'), { 
        name: 'Real Org', 
        owner_user_id: 'bob',
        cnpj: '123'
      });
    });

    const alice = testEnv.authenticatedContext('alice');
    const orgRef = doc(alice.firestore(), 'organizations', 'org1');
    await assertFails(updateDoc(orgRef, { name: 'Vandalized' }));
  });

  it('Allow user to read their own profile', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users', 'alice'), { 
        uid: 'alice', 
        name: 'Alice', 
        email: 'alice@example.com',
        role: 'user'
      });
    });

    const alice = testEnv.authenticatedContext('alice');
    const userRef = doc(alice.firestore(), 'users', 'alice');
    await assertSucceeds(getDoc(userRef));
  });
});
