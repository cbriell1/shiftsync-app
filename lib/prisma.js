import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

const globalForPrisma = globalThis;

const prismaInstance = globalForPrisma.prisma ?? prismaClientSingleton();

export const prisma = prismaInstance;
export default prismaInstance;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;