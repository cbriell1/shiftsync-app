// filepath: lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { Pool as NeonPool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

// 🛡️ STADIUM-GRADE DATABASE INITIALIZATION
// Optimized for Vercel Serverless + Neon HTTP

const prismaClientSingleton = () => {
  const rawUrl = process.env.DATABASE_URL;
  
  if (!rawUrl || rawUrl.trim().length === 0) {
    // 🚨 This will show up clearly in Vercel logs if the variable is missing
    console.error("🚨 DATABASE_URL IS MISSING! Dashboard will remain blank. Please add it to Vercel Settings.");
    return new PrismaClient();
  }

  console.log(`📡 Database Secret Detected. Length: ${rawUrl.length} characters.`);

  // ⚡ Advanced Optimization: Clean the connection string for Neon HTTP
  let url = rawUrl.replace('pgbouncer=true', 'sslmode=require');

  // 🏗️ PRODUCTION: Use Neon Serverless HTTP (Zero-overhead connection)
  if (process.env.NODE_ENV === 'production') {
    try {
        const pool = new NeonPool({ connectionString: url });
        const adapter = new PrismaNeon(pool as any);
        return new PrismaClient({ adapter });
    } catch (e: any) {
        console.error("❌ Neon HTTP Adapter Initialization Failed:", e.message);
        return new PrismaClient();
    }
  }

  // 💻 LOCAL/TEST: Use standard PG Driver
  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
