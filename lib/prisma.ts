// filepath: lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// 🛡️ STADIUM-GRADE DATABASE INITIALIZATION (SAFE MODE)
// This version uses the standard driver for maximum reliability in production.

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;
  
  if (!url || url.trim().length === 0) {
    console.error("🚨 STADIUM OFFLINE: DATABASE_URL is missing from Vercel Environment Variables.");
    return new PrismaClient();
  }

  // Log the character count to verify Vercel secret injection
  console.log(`📡 Database Secret Active. Length: ${url.length} characters.`);

  // Return a standard Prisma Client. 
  // It will handle the postgresql:// or postgres:// protocol automatically.
  return new PrismaClient({
    log: ['error', 'warn'],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
