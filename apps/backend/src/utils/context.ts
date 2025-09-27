import { PrismaClient } from '@prisma/client';
import { inferAsyncReturnType } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function createContext({
  req,
}: trpcExpress.CreateExpressContextOptions) {
  // Get the session from the header
  const token = req.headers.authorization?.replace('Bearer ', '');

  let user = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          organizations: {
            include: {
              organization: true
            }
          }
        }
      });
    } catch (error) {
      // Invalid token
    }
  }

  return {
    prisma,
    user,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;