// filepath: lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { Pool as NeonPool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

// 🛡️ STADIUM-GRADE DATABASE INITIALIZATION
// This singleton ensures we only have one connection pool active.

const prismaClientSingleton = () => {
  const rawUrl = process.env.DATABASE_URL;
  
  if (!rawUrl) {
    // 🚨 This error will now show up clearly in your Vercel logs
    console.error("🚨 STADIUM OFFLINE: DATABASE_URL is missing from Vercel Environment Variables.");
    return new PrismaClient();
  }

  // ⚡ Optimization: Neon HTTP Adapter works best without pgbouncer=true in the string
  const url = rawUrl.replace('pgbouncer=true', 'sslmode=require');

  // 🏗️ PRODUCTION: Use Neon Serverless HTTP (Zero-overhead connection)
  if (process.env.NODE_ENV === 'production') {
    const pool = new NeonPool({ connectionString: url });
    const adapter = new PrismaNeon(pool as any);
    return new PrismaClient({ adapter });
  }

  // 💻 LOCAL/TEST: Use standard PG Driver for speed/stability
  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
