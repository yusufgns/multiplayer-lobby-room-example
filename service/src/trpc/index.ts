import { initTRPC } from '@trpc/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

export { prisma }; 