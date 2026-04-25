// filepath: lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// 🛡️ HYBRID DRIVER STRATEGY
// Local/Test: Direct TCP for speed and stability
// Production: Neon HTTP for serverless efficiency

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;
  
  if (!url) {
    console.error("🚨 CRITICAL: DATABASE_URL is missing!");
    return new PrismaClient();
  }

  // Always use the standard driver in development/test to avoid local runtime conflicts
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    console.log("🛠️ Prisma initialized with Standard PG Driver (Dev Mode).");
    return new PrismaClient();
  }

  // Use Neon HTTP Adapter for Production
  if (typeof window === 'undefined') {
    neonConfig.webSocketConstructor = ws;
  }
  const pool = new NeonPool({ connectionString: url });
  const adapter = new PrismaNeon(pool as any);
  
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
