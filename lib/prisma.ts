// filepath: lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

// 🛡️ HYBRID DRIVER STRATEGY
// Local/Test: Direct TCP for speed and stability
// Production: Neon HTTP for serverless efficiency

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;
  
  if (!url) {
    console.error("🚨 CRITICAL: DATABASE_URL is missing in environment!");
    return new PrismaClient();
  }

  // Always use the standard driver in development/test to avoid local runtime conflicts
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return new PrismaClient();
  }

  // Use Neon HTTP Adapter for Production
  // Skip ws polyfill in serverless env as fetch is globally available
  const pool = new NeonPool({ connectionString: url });
  const adapter = new PrismaNeon(pool as any);
  
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
