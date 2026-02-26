import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
    let madeChanges = false;

    // Safely filter for profiles, skipping any corrupted/blank users
    const allChrisProfiles = new Array();
    for (const u of users) {
      if (u.name && typeof u.name === 'string' && u.name.toLowerCase().includes('briell')) {
        allChrisProfiles.push(u);
      }
    }
    
    for (const chris of allChrisProfiles) {
      // Safely rebuild the roles array from scratch to guarantee NO NULL VALUES
      const currentRoles = new Array();
      if (chris.systemRoles && chris.systemRoles.length > 0) {
        for (const r of chris.systemRoles) {
          if (r) currentRoles.push(r);
        }
      }
      
      // If the safe array doesn't have the badge, add it and save to database!
      if (!currentRoles.includes('Administrator')) {
        currentRoles.push('Administrator');
        
        await prisma.user.update({
          where: { id: chris.id },
          data: { systemRoles: currentRoles }
        });
        madeChanges = true;
      }
    }

    if (madeChanges) {
      users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
    }

    return NextResponse.json(users);
    
  } catch (error) {
    console.error("User API Error:", error);
    return NextResponse.json(new Array());
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { id, roles, systemRoles, locationIds, ...otherUpdates } = data;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Prepare the update object dynamically
    const updateData = {};

    // 1. Handle Location IDs (The fix for your disappearing locations)
    if (locationIds !== undefined) {
      updateData.locationIds = locationIds;
    }

    // 2. Handle System Roles (Checking both 'roles' and 'systemRoles' keys for compatibility)
    if (systemRoles !== undefined) {
      updateData.systemRoles = systemRoles;
    } else if (roles !== undefined) {
      updateData.systemRoles = roles;
    }

    // 3. Handle any other fields sent in the update (e.g., name, initials, etc.)
    Object.assign(updateData, otherUpdates);

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: updateData
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("PUT User Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}