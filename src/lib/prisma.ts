import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const localDatabaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
if (process.env.VERCEL && !process.env.TURSO_DATABASE_URL) throw new Error('TURSO_DATABASE_URL is required for persistent Vercel deployments.');
const databaseUrl = process.env.TURSO_DATABASE_URL
	?? (localDatabaseUrl === 'file:./dev.db' ? 'file:./prisma/dev.db' : localDatabaseUrl);
const adapter = new PrismaLibSQL({ url: databaseUrl, authToken: process.env.TURSO_AUTH_TOKEN });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;