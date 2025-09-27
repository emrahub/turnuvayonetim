import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { Context } from './context';
import { ZodError } from 'zod';
import { hasRole } from '../middleware/auth';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware to check if user is authenticated
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

// Middleware to check organization access
export const organizationProcedure = protectedProcedure.use(async ({ ctx, rawInput, next }) => {
  const input = rawInput as any;
  const organizationId = input?.organizationId;

  if (!organizationId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Organization ID is required'
    });
  }

  const userOrg = ctx.user.organizations.find(
    (org) => org.organizationId === organizationId
  );

  if (!userOrg) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this organization'
    });
  }

  return next({
    ctx: {
      ...ctx,
      organizationId,
      userRole: userOrg.role,
    },
  });
});

// Middleware creator for role-based access control
export function createRoleProcedure(allowedRoles: string[]) {
  return organizationProcedure.use(async ({ ctx, next }) => {
    if (!hasRole(ctx.userRole, allowedRoles)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions for this operation'
      });
    }

    return next({
      ctx: {
        ...ctx,
        userRole: ctx.userRole,
      },
    });
  });
}

// Export the hasRole function for use in individual route files
export { hasRole };