// filepath: lib/actions.ts
"use server";

import { prisma } from './prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

async function getSessionUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

async function logAudit(userId: number, action: string, details: string) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, details }
    });
  } catch (e) {
    console.error("Audit logging failed:", e);
  }
}

async function logError(userId: number | null, message: string, path: string, stack?: string) {
  try {
    await prisma.errorLog.create({
      data: { userId, message, path, stack }
    });
  } catch (e) {
    console.error("Error logging failed:", e);
  }
}

// ==================================================================
// SHIFT ACTIONS
// ==================================================================
export async function updateShiftAction(data: {
  shiftId: number;
  userId: number | null;
  startTime?: string;
  endTime?: string;
  action: 'CLAIM' | 'UNCLAIM' | 'REQUEST_COVER' | 'CANCEL_COVER' | 'UPDATE';
}) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const authUserId = Number(user.id);
  const userRoles = (user as any).systemRoles || [];
  const isManagement = userRoles.includes('Administrator') || userRoles.includes('Manager');

  if (data.action === 'UPDATE' && !isManagement) {
    throw new Error("Forbidden: Managers only");
  }

  try {
    let updateData: any = {};
    switch (data.action) {
      case 'UNCLAIM': updateData = { status: 'OPEN', userId: null }; break;
      case 'REQUEST_COVER': updateData = { status: 'COVERAGE_REQUESTED' }; break;
      case 'CANCEL_COVER': updateData = { status: 'CLAIMED' }; break;
      case 'CLAIM': updateData = { status: 'CLAIMED', userId: data.userId }; break;
      case 'UPDATE':
        if (data.userId !== undefined) {
          updateData.userId = data.userId;
          updateData.status = data.userId === null ? 'OPEN' : 'CLAIMED';
        }
        if (data.startTime) updateData.startTime = new Date(data.startTime);
        if (data.endTime) updateData.endTime = new Date(data.endTime);
        break;
    }

    const updated = await prisma.shift.update({
      where: { id: data.shiftId },
      data: updateData,
      include: { location: true }
    });

    await logAudit(authUserId, "TRANSACTION", `Shift #${data.shiftId} updated: ${data.action} at ${updated.location.name}`);
    revalidatePath('/');
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (err: any) {
    await logError(authUserId, err.message, "updateShiftAction", err.stack);
    return { success: false, error: err.message };
  }
}

export async function createShiftAction(data: {
  locationIds: number[];
  userId: number | null;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  weeksToRepeat?: number;
  checklistTasks?: string[];
  tzOffset?: number;
}) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const userRoles = (user as any).systemRoles || [];
  if (!userRoles.includes('Administrator') && !userRoles.includes('Manager')) {
    throw new Error("Forbidden: Managers only");
  }

  const authUserId = Number(user.id);
  const weeks = data.weeksToRepeat || 1;
  const offset = data.tzOffset || 0;

  try {
    const shiftsToCreate: any[] = [];
    
    for (const locId of data.locationIds) {
        for (let w = 0; w < weeks; w++) {
            for (const dow of data.daysOfWeek) {
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() - targetDate.getDay() + (w * 7) + dow);
                const dateStr = targetDate.toISOString().split('T')[0];
                
                const shiftStart = new Date(`${dateStr}T${data.startTime}:00Z`);
                shiftStart.setMinutes(shiftStart.getMinutes() + offset);
                
                const shiftEnd = new Date(`${dateStr}T${data.endTime}:00Z`);
                shiftEnd.setMinutes(shiftEnd.getMinutes() + offset);
                if (shiftEnd <= shiftStart) shiftEnd.setDate(shiftEnd.getDate() + 1);

                shiftsToCreate.push({
                    locationId: locId,
                    userId: data.userId,
                    startTime: shiftStart,
                    endTime: shiftEnd,
                    status: data.userId ? 'CLAIMED' : 'OPEN'
                });
            }
        }
    }

    const result = await prisma.shift.createMany({
        data: shiftsToCreate
    });

    await logAudit(authUserId, "TRANSACTION", `Bulk created ${result.count} shifts via unified pattern engine.`);
    revalidatePath('/');
    return { success: true, count: result.count };
  } catch (err: any) {
    await logError(authUserId, err.message, "createShiftAction", err.stack);
    return { success: false, error: err.message };
  }
}

export async function deleteShiftAction(shiftId: number) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const userRoles = (user as any)?.systemRoles || [];
  if (!userRoles.includes('Administrator') && !userRoles.includes('Manager')) throw new Error("Forbidden");

  const authUserId = Number(user.id);

  try {
    const deleted = await prisma.shift.delete({
      where: { id: shiftId },
      include: { location: true }
    });

    await logAudit(authUserId, "DELETE", `Deleted shift #${shiftId} at ${deleted.location.name}`);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    await logError(authUserId, err.message, "deleteShiftAction", err.stack);
    return { success: false, error: err.message };
  }
}

export async function bulkDeleteShiftsAction(data: {
  startDate: string;
  endDate: string;
  locationIds?: number[];
}) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const userRoles = (user as any)?.systemRoles || [];
  if (!userRoles.includes('Administrator') && !userRoles.includes('Manager')) throw new Error("Forbidden");

  const authUserId = Number(user.id);

  try {
    const whereClause: any = {
      startTime: { 
        gte: new Date(data.startDate),
        lte: new Date(data.endDate)
      }
    };
    if (data.locationIds && data.locationIds.length > 0) {
      whereClause.locationId = { in: data.locationIds };
    }

    const result = await prisma.shift.deleteMany({ where: whereClause });

    await logAudit(authUserId, "DELETE", `Bulk delete: ${result.count} shifts cleared from ${data.startDate} to ${data.endDate}`);
    revalidatePath('/');
    return { success: true, count: result.count };
  } catch (err: any) {
    await logError(authUserId, err.message, "bulkDeleteShiftsAction", err.stack);
    return { success: false, error: err.message };
  }
}

export async function bulkDeleteShiftsByIdsAction(shiftIds: number[]) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const userRoles = (user as any)?.systemRoles || [];
  if (!userRoles.includes('Administrator') && !userRoles.includes('Manager')) throw new Error("Forbidden");

  const authUserId = Number(user.id);

  try {
    const result = await prisma.shift.deleteMany({
      where: { id: { in: shiftIds } }
    });

    await logAudit(authUserId, "DELETE", `Multiple select delete: ${result.count} shifts removed.`);
    revalidatePath('/');
    return { success: true, count: result.count };
  } catch (err: any) {
    await logError(authUserId, err.message, "bulkDeleteShiftsByIdsAction", err.stack);
    return { success: false, error: err.message };
  }
}

// ==================================================================
// TEMPLATE ACTIONS
// ==================================================================
export async function saveTemplatesAction(data: {
  id?: number | null;
  locationIds: number[];
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  startDate?: string | null;
  endDate?: string | null;
  checklistTasks?: string[];
  userId?: number | null;
}) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const userRoles = (user as any)?.systemRoles || [];
  if (!userRoles.includes('Administrator') && !userRoles.includes('Manager')) throw new Error("Forbidden");

  const authUserId = Number(user.id);

  try {
    const created: any[] = [];
    if (data.id) {
      // Update Single
      const updated = await prisma.shiftTemplate.update({
        where: { id: data.id },
        data: {
          startTime: data.startTime,
          endTime: data.endTime,
          startDate: data.startDate,
          endDate: data.endDate,
          checklistTasks: data.checklistTasks,
          userId: data.userId
        }
      });
      created.push(updated);
    } else {
      // Create Multiple
      for (const locId of data.locationIds) {
        for (const day of data.daysOfWeek) {
          const tpl = await prisma.shiftTemplate.create({
            data: {
              locationId: locId,
              dayOfWeek: day,
              startTime: data.startTime,
              endTime: data.endTime,
              startDate: data.startDate,
              endDate: data.endDate,
              checklistTasks: data.checklistTasks || [],
              userId: data.userId
            }
          });
          created.push(tpl);
        }
      }
    }

    await logAudit(authUserId, "TRANSACTION", `Saved ${created.length} template(s) for ${data.startTime}`);
    revalidatePath('/');
    return { success: true, count: created.length };
  } catch (err: any) {
    await logError(authUserId, err.message, "saveTemplatesAction", err.stack);
    return { success: false, error: err.message };
  }
}

export async function deleteTemplateAction(id: number) {
  const user = await getSessionUser();
  const userRoles = (user as any)?.systemRoles || [];
  if (!userRoles.includes('Administrator') && !userRoles.includes('Manager')) throw new Error("Forbidden");

  const authUserId = Number(user!.id);

  try {
    const deleted = await prisma.shiftTemplate.delete({
      where: { id },
      include: { location: true }
    });

    await logAudit(authUserId, "DELETE", `Deleted template #${id} at ${deleted.location.name}`);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    await logError(authUserId, err.message, "deleteTemplateAction", err.stack);
    return { success: false, error: err.message };
  }
}

export async function bulkTemplatesFromShiftsAction(shifts: any[]) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const userRoles = (user as any)?.systemRoles || [];
  if (!userRoles.includes('Administrator') && !userRoles.includes('Manager')) throw new Error("Forbidden");

  const authUserId = Number(user.id);

  try {
    const templatesData = shifts.map((s: any) => {
      const start = new Date(s.startTime);
      const end = new Date(s.endTime);
      return {
        locationId: s.locationId,
        dayOfWeek: start.getDay(),
        startTime: start.toTimeString().slice(0,5),
        endTime: end.toTimeString().slice(0,5),
        userId: s.userId || null
      };
    });

    const result = await prisma.shiftTemplate.createMany({ data: templatesData });

    await logAudit(authUserId, "TRANSACTION", `Saved week as template: ${result.count} patterns created.`);
    revalidatePath('/');
    return { success: true, count: result.count };
  } catch (err: any) {
    await logError(authUserId, err.message, "bulkTemplatesFromShiftsAction", err.stack);
    return { success: false, error: err.message };
  }
}

// ==================================================================
// FAMILY PLATINUM & SNACK LOGIC
// ==================================================================
export async function getFamilyAllotment(memberId: number) {
  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { family: true, membershipLevel: true }
    });

    if (!member || member.membershipLevel !== 'PLATINUM' || !member.family) {
      return { isPlatinum: false, total: 0, used: 0, remaining: 0 };
    }

    // 1. Get ALL active family members
    const familyMembers = await prisma.member.findMany({
      where: { family: member.family, membershipLevel: 'PLATINUM' },
      select: { id: true }
    });

    const familyIds = familyMembers.map(m => m.id);
    const totalAllotment = familyMembers.length;

    // 2. Get usages for the CURRENT MONTH
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const usedCount = await prisma.snackUsage.count({
      where: {
        memberId: { in: familyIds },
        dateUsed: { gte: startOfMonth }
      }
    });

    return {
      isPlatinum: true,
      familyName: member.family,
      total: totalAllotment,
      used: usedCount,
      remaining: Math.max(0, totalAllotment - usedCount)
    };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function logSnackUsage(memberId: number) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  try {
    const usage = await prisma.snackUsage.create({
      data: { memberId }
    });

    await logAudit(Number(user.id), "TRANSACTION", `Logged snack/beverage for Member #${memberId}`);
    revalidatePath('/');
    return { success: true, data: usage };
  } catch (err: any) {
    await logError(Number(user.id), err.message, "logSnackUsage");
    return { success: false, error: err.message };
  }
}

export async function generateScheduleAction(data: {
  locationIds?: number[];
  startDate: string;
  endDate: string;
  tzOffset?: number;
}) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const userRoles = (user as any)?.systemRoles || [];
  if (!userRoles.includes('Administrator') && !userRoles.includes('Manager')) throw new Error("Forbidden");

  const authUserId = Number(user.id);
  const offset = data.tzOffset || 0;

  try {
     const periodStart = new Date(data.startDate); periodStart.setUTCHours(0,0,0,0);
     const periodEnd = new Date(data.endDate); periodEnd.setUTCHours(23,59,59,999);

     const targetLocations = data.locationIds && data.locationIds.length > 0
        ? await prisma.location.findMany({ where: { id: { in: data.locationIds } } })
        : await prisma.location.findMany();

     const allTemplates = await prisma.shiftTemplate.findMany();
     
     // 🛡️ RESPECT SKIP_GENERATION EVENTS
     const skipEvents = await prisma.event.findMany({
       where: {
         startDate: { lte: periodEnd },
         endDate: { gte: periodStart },
         impact: 'SKIP_GENERATION'
       }
     });

     const existingShifts = await prisma.shift.findMany({
        where: { startTime: { gte: periodStart }, endTime: { lte: periodEnd } },
        select: { locationId: true, startTime: true, endTime: true }
     });

     const shiftLookup = new Set(existingShifts.map(s => `${s.locationId}_${s.startTime.toISOString()}_${s.endTime.toISOString()}`));
     const shiftsToCreate: any[] = [];

     for (const loc of targetLocations) {
        const locTemplates = allTemplates.filter(t => t.locationId === loc.id);
        const locSkipEvents = skipEvents.filter(e => !e.locationId || e.locationId === loc.id);
        const currentDate = new Date(periodStart);

        while (currentDate <= periodEnd) {
           const isSkipped = locSkipEvents.some(e => {
             const eStart = new Date(e.startDate); eStart.setHours(0,0,0,0);
             const eEnd = new Date(e.endDate); eEnd.setHours(23,59,59,999);
             return currentDate >= eStart && currentDate <= eEnd;
           });

           if (!isSkipped) {
              const currentDayOfWeek = currentDate.getDay();
              const dailyTemplates = locTemplates.filter(t => t.dayOfWeek === currentDayOfWeek);
              const dateStr = currentDate.toISOString().split('T')[0];

              for (const t of dailyTemplates) {
                 // Construct UTC date assuming the string is local, then adjust by offset
                 const st = new Date(`${dateStr}T${t.startTime}:00Z`);
                 st.setMinutes(st.getMinutes() + offset);

                 const et = new Date(`${dateStr}T${t.endTime}:00Z`);
                 et.setMinutes(et.getMinutes() + offset);

                 if (et <= st) et.setDate(et.getDate() + 1);

                 const key = `${loc.id}_${st.toISOString()}_${et.toISOString()}`;
                 if (!shiftLookup.has(key)) {
                    shiftsToCreate.push({ locationId: loc.id, startTime: st, endTime: et, status: t.userId ? 'CLAIMED' : 'OPEN', userId: t.userId });
                    shiftLookup.add(key);
                 }
              }
           }
           currentDate.setDate(currentDate.getDate() + 1);
        }
     }

     if (shiftsToCreate.length > 0) {
        await prisma.shift.createMany({ data: shiftsToCreate, skipDuplicates: true });
     }

     await logAudit(authUserId, "TRANSACTION", `Generated ${shiftsToCreate.length} shifts from blueprints.`);
     revalidatePath('/');
     return { success: true, count: shiftsToCreate.length };
  } catch (err: any) {
     await logError(authUserId, err.message, "generateScheduleAction", err.stack);
     return { success: false, error: err.message };
  }
}

export async function cloneShiftsAction(data: {
  sourceStart: string;
  sourceEnd: string;
  targetStart: string;
  locationIds?: number[];
}) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const userRoles = (user as any)?.systemRoles || [];
  if (!userRoles.includes('Administrator') && !userRoles.includes('Manager')) throw new Error("Forbidden");

  const authUserId = Number(user.id);

  try {
    const sStart = new Date(data.sourceStart);
    const tStart = new Date(data.targetStart);
    const offsetMs = tStart.getTime() - sStart.getTime();

    const whereClause: any = {
      startTime: { 
        gte: new Date(data.sourceStart),
        lte: new Date(data.sourceEnd)
      }
    };
    if (data.locationIds && data.locationIds.length > 0) {
      whereClause.locationId = { in: data.locationIds };
    }

    const sourceShifts = await prisma.shift.findMany({
      where: whereClause
    });

    if (sourceShifts.length === 0) return { success: true, count: 0 };

    // 🛡️ Get existing shifts in target range to prevent duplicates
    const targetRangeEnd = new Date(new Date(data.sourceEnd).getTime() + offsetMs);
    const existingTargetShifts = await prisma.shift.findMany({
      where: {
        startTime: { gte: tStart },
        endTime: { lte: targetRangeEnd }
      },
      select: { locationId: true, startTime: true, endTime: true }
    });

    const shiftLookup = new Set(existingTargetShifts.map(s => 
      `${s.locationId}_${s.startTime.getTime()}_${s.endTime.getTime()}`
    ));

    const shiftsToCreate = sourceShifts
      .map(s => {
        const newStart = new Date(s.startTime.getTime() + offsetMs);
        const newEnd = new Date(s.endTime.getTime() + offsetMs);
        
        // Skip if 31st mapping to 30th month (basic safety)
        if (newStart.getMonth() !== tStart.getMonth() && newStart.getDate() < s.startTime.getDate()) {
            return null;
        }

        const key = `${s.locationId}_${newStart.getTime()}_${newEnd.getTime()}`;
        if (shiftLookup.has(key)) return null;

        return {
          locationId: s.locationId,
          userId: s.userId,
          startTime: newStart,
          endTime: newEnd,
          status: s.userId ? 'CLAIMED' : 'OPEN'
        };
      })
      .filter(Boolean) as any[];

    if (shiftsToCreate.length > 0) {
      await prisma.shift.createMany({ data: shiftsToCreate });
    }

    await logAudit(authUserId, "TRANSACTION", `Cloned ${shiftsToCreate.length} shifts to ${data.targetStart}`);
    revalidatePath('/');
    return { success: true, count: shiftsToCreate.length };
  } catch (err: any) {
    await logError(authUserId, err.message, "cloneShiftsAction", err.stack);
    return { success: false, error: err.message };
  }
}
