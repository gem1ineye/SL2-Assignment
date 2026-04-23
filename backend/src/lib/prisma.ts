import { PrismaClient } from '@prisma/client';

// Lazy singleton pattern - PrismaClient is created only when first accessed
let _prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient();
  }
  return _prisma;
}

// For backwards compatibility - creates a proxy that lazily initializes
const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    return (client as any)[prop];
  },
});

export default prisma;
