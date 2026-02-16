import { PrismaClient } from '@/app/generated/prisma';

// Prisma client singleton for Next.js
// Prevents multiple instances in development due to hot reloading

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;