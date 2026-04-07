import { account, databases, DB_ID } from './appwrite';
import { ID, Query } from 'appwrite';

export async function registerUser(email, password, name) {
  try {
    const user = await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    return { success: true, user };
  } catch(e) { return { success: false, error: e.message }; }
}

export async function loginUser(email, password) {
  try {
    // Clear any existing session first to prevent "session already exists" error
    try { await account.deleteSession('current'); } catch(e) {}
    const session = await account.createEmailPasswordSession(email, password);
    return { success: true, session };
  } catch(e) { return { success: false, error: e.message }; }
}

export async function logoutUser() {
  try { await account.deleteSession('current'); return { success: true }; }
  catch(e) { return { success: false, error: e.message }; }
}

export async function getCurrentUser() {
  try { return await account.get(); } catch(e) { return null; }
}

export async function getUserPermissions(userId) {
  try {
    const result = await databases.listDocuments(DB_ID, 'user_permissions', [Query.equal('userId', userId)]);
    if (result.documents.length === 0) return { role:null, agencyCode:null, isResponder:false, hasMedicalSuite:false, totalAccess:false };
    const doc = result.documents[0];
    return { role:doc.role, agencyCode:doc.agencyCode, isResponder:doc.isResponder||false, hasMedicalSuite:doc.hasMedicalSuite||false, totalAccess:doc.totalAccess||false };
  } catch(e) { return { role:null, agencyCode:null, isResponder:false, hasMedicalSuite:false, totalAccess:false }; }
}

export async function loginWithPermissions(email, password) {
  const loginResult = await loginUser(email, password);
  if (!loginResult.success) return loginResult;
  const user = await getCurrentUser();
  if (!user) return { success:false, error:"Session error. Try again." };
  const perms = await getUserPermissions(user.$id);
  return { success:true, user, role:perms.role, agencyCode:perms.agencyCode, isResponder:perms.isResponder, hasMedicalSuite:perms.hasMedicalSuite, totalAccess:perms.totalAccess };
}
