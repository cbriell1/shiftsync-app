// filepath: app/api/admin/sessions/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// GET: List all active database sessions
export async function GET() {
  const session = await auth();
  
  // Security: Only Chris (or Admins) can see active sessions
  if (session?.user?.email !== 'cbriell1@yahoo.com' && !(session?.user as any).systemRoles?.includes('Administrator')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
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

// DELETE: Force a user out by destroying their session record
export async function DELETE(req: Request) {
  const session = await auth();
  
  if (session?.user?.email !== 'cbriell1@yahoo.com' && !(session?.user as any).systemRoles?.includes('Administrator')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { sessionToken } = await req.json();
    
    await prisma.session.delete({
      where: { sessionToken }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}