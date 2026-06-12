import { auth } from '@/auth';

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

export async function isManagement(): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  const roles: string[] = (session.user as any).systemRoles ?? [];
  return roles.includes('Administrator') || roles.includes('Manager');
}
