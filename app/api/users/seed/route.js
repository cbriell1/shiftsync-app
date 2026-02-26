import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // Your provided list of employees
  const names = new Array(
    'Colin Amatucci', 'Sophia Kim', 'Pam Gilbert', 'Eric Gilbert', 'Neal Lagatta',
    'Jack Sisler', 'Brandon Parris', 'Victoria Widman', 'Suzi Wilson', 'Leesa Pollone',
    'Chelsea English', 'Marissa Elk', 'Mike Perry', 'Mary Money', 'Riley Bruce',
    'Wade Hudson', 'Susan Fanelly', 'Esther Jimenez', 'Lane Ethridge'
  );

  // Fallback to Location 1 if PnP Garner isn't found
  const loc = await prisma.location.findFirst({ where: { name: 'PnP Garner' } });
  const locationId = loc ? loc.id : 1;

  let addedCount = 0;

  for (const name of names) {
    const existingUser = await prisma.user.findFirst({ where: { name: name } });
    
    // Only add them if they don't already exist in the database!
    if (!existingUser) {
      await prisma.user.create({
        data: {
          name: name,
          role: 'EMPLOYEE',
          locationId: locationId
        }
      });
      addedCount++;
    }
  }

  return NextResponse.json({ message: "Employees successfully added!", count: addedCount });
}