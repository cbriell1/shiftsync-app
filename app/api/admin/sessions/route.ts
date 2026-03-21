// filepath: app/api/admin/sessions/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// GET: List all active database sessions
export async function GET() {
  const session = await auth();
  
  // Security: Only Admins or Managers can see the Live Sessions Tab
  const isAdmin = session?.user?.email === 'cbriell1@yahoo.com' || (session?.user as any).systemRoles?.includes('Administrator');
  const isManager = (session?.user as any).systemRoles?.includes('Manager');
  
  if (!isAdmin && !isManager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // HOUSEKEEPING: Automatically delete sessions that have naturally expired (>30 days old)
    await prisma.session.deleteMany({
      where: { expires: { lt: new Date() } }
    });

    const activeSessions = await prisma.session.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      },
      orderBy: { expires: 'desc' }
    });

    return NextResponse.json(activeSessions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Force a user out OR allow a user to logout themselves
export async function DELETE(req: Request) {
  const authSession = await auth();
  if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { sessionToken } = await req.json();
    
    // Security: You can delete a session if you are an Admin, OR if it's your own session
    const isAdmin = authSession?.user?.email === 'cbriell1@yahoo.com' || (authSession?.user as any).systemRoles?.includes('Administrator');
    const isOwnSession = (authSession as any).sessionId === sessionToken;

    if (!isAdmin && !isOwnSession) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // FIX: Using deleteMany prevents Prisma crash if the session was already removed
    await prisma.session.deleteMany({
      where: { sessionToken }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}