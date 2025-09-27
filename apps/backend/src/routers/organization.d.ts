import { z } from 'zod';
export declare const organizationRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: {
        prisma: import(".prisma/client").PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
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
    };
    meta: object;
    errorShape: {
        data: {
            zodError: z.typeToFlattenedError<any, string> | null;
            code: import("@trpc/server/dist/rpc").TRPC_ERROR_CODE_KEY;
            httpStatus: number;
            path?: string;
            stack?: string;
        };
        message: string;
        code: import("@trpc/server/dist/rpc").TRPC_ERROR_CODE_NUMBER;
    };
    transformer: typeof import("superjson").default;
}>, {
    create: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: {
                prisma: import(".prisma/client").PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
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
            };
            meta: object;
            errorShape: {
                data: {
                    zodError: z.typeToFlattenedError<any, string> | null;
                    code: import("@trpc/server/dist/rpc").TRPC_ERROR_CODE_KEY;
                    httpStatus: number;
                    path?: string;
                    stack?: string;
                };
                message: string;
                code: import("@trpc/server/dist/rpc").TRPC_ERROR_CODE_NUMBER;
            };
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            user: {
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
            };
            prisma: import(".prisma/client").PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
        };
        _input_in: {
            name: string;
            slug: string;
        };
        _input_out: {
            name: string;
            slug: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        logoUrl: string | null;
    }>;
    list: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: {
                prisma: import(".prisma/client").PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
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
            };
            meta: object;
            errorShape: {
                data: {
                    zodError: z.typeToFlattenedError<any, string> | null;
                    code: import("@trpc/server/dist/rpc").TRPC_ERROR_CODE_KEY;
                    httpStatus: number;
                    path?: string;
                    stack?: string;
                };
                message: string;
                code: import("@trpc/server/dist/rpc").TRPC_ERROR_CODE_NUMBER;
            };
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            user: {
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
            };
            prisma: import(".prisma/client").PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
        };
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        name: string;
        slug: string;
        role: import(".prisma/client").$Enums.Role;
        joinedAt: Date;
    }[]>;
    get: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: {
                prisma: import(".prisma/client").PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
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
            };
            meta: object;
            errorShape: {
                data: {
                    zodError: z.typeToFlattenedError<any, string> | null;
                    code: import("@trpc/server/dist/rpc").TRPC_ERROR_CODE_KEY;
                    httpStatus: number;
                    path?: string;
                    stack?: string;
                };
                message: string;
                code: import("@trpc/server/dist/rpc").TRPC_ERROR_CODE_NUMBER;
            };
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            user: {
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
            };
            prisma: import(".prisma/client").PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
        };
        _input_in: {
            organizationId: string;
        };
        _input_out: {
            organizationId: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        role: import(".prisma/client").$Enums.Role;
        _count: {
            users: number;
            tournaments: number;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        logoUrl: string | null;
    }>;
}>;
//# sourceMappingURL=organization.d.ts.map