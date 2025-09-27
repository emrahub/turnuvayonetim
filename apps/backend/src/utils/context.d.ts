import { PrismaClient } from '@prisma/client';
import { inferAsyncReturnType } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
export declare function createContext({ req, }: trpcExpress.CreateExpressContextOptions): Promise<{
    prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
    user: ({
        organizations: ({
            organization: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
                logoUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            organizationId: string;
            role: import(".prisma/client").$Enums.Role;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        email: string;
        passwordHash: string;
        firstName: string | null;
        lastName: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }) | null;
}>;
export type Context = inferAsyncReturnType<typeof createContext>;
//# sourceMappingURL=context.d.ts.map