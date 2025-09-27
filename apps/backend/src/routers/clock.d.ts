import { z } from 'zod';
export declare const clockRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
    getState: import("@trpc/server").BuildProcedure<"query", {
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
            organizationId: any;
            prisma: import(".prisma/client").PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
            userRole: import(".prisma/client").$Enums.Role;
        };
        _input_in: {
            organizationId: string;
            tournamentId: string;
        };
        _input_out: {
            organizationId: string;
            tournamentId: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        createdAt: Date;
        status: string;
        tournamentId: string;
        currentLevelIdx: number;
        levelStartTime: bigint;
        pausedDuration: bigint;
        serverTime: bigint;
    } | {
        tournamentId: string;
        currentLevelIdx: number;
        status: string;
        levelStartTime: bigint;
        pausedDuration: bigint;
        serverTime: bigint;
    }>;
    updateState: import("@trpc/server").BuildProcedure<"mutation", {
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
            organizationId: any;
            prisma: import(".prisma/client").PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
            userRole: import(".prisma/client").$Enums.Role;
        };
        _input_in: {
            organizationId: string;
            status: string;
            tournamentId: string;
            currentLevelIdx: number;
            levelStartTime: bigint;
            pausedDuration: bigint;
        };
        _input_out: {
            organizationId: string;
            status: string;
            tournamentId: string;
            currentLevelIdx: number;
            levelStartTime: bigint;
            pausedDuration: bigint;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        createdAt: Date;
        status: string;
        tournamentId: string;
        currentLevelIdx: number;
        levelStartTime: bigint;
        pausedDuration: bigint;
        serverTime: bigint;
    }>;
    createBlindStructure: import("@trpc/server").BuildProcedure<"mutation", {
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
            organizationId: any;
            prisma: import(".prisma/client").PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
            userRole: import(".prisma/client").$Enums.Role;
        };
        _input_in: {
            organizationId: string;
            tournamentId: string;
            levels: {
                idx: number;
                smallBlind: number;
                bigBlind: number;
                ante?: number | undefined;
                durationSeconds?: number | undefined;
                isBreak?: boolean | undefined;
                breakName?: string | undefined;
            }[];
            name?: string | undefined;
        };
        _input_out: {
            organizationId: string;
            tournamentId: string;
            levels: {
                idx: number;
                smallBlind: number;
                bigBlind: number;
                ante: number;
                durationSeconds: number;
                isBreak: boolean;
                breakName?: string | undefined;
            }[];
            name?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        levels: {
            id: string;
            idx: number;
            smallBlind: number;
            bigBlind: number;
            ante: number;
            durationSeconds: number;
            isBreak: boolean;
            breakName: string | null;
            structureId: string;
        }[];
    } & {
        id: string;
        name: string | null;
        description: string | null;
        tournamentId: string;
    }>;
    getBlindStructure: import("@trpc/server").BuildProcedure<"query", {
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
            organizationId: any;
            prisma: import(".prisma/client").PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
            userRole: import(".prisma/client").$Enums.Role;
        };
        _input_in: {
            organizationId: string;
            tournamentId: string;
        };
        _input_out: {
            organizationId: string;
            tournamentId: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, ({
        levels: {
            id: string;
            idx: number;
            smallBlind: number;
            bigBlind: number;
            ante: number;
            durationSeconds: number;
            isBreak: boolean;
            breakName: string | null;
            structureId: string;
        }[];
    } & {
        id: string;
        name: string | null;
        description: string | null;
        tournamentId: string;
    }) | {
        tournamentId: string;
        name: string;
        levels: ({
            idx: number;
            smallBlind: number;
            bigBlind: number;
            ante: number;
            durationSeconds: number;
            isBreak: boolean;
            breakName?: undefined;
        } | {
            idx: number;
            smallBlind: number;
            bigBlind: number;
            ante: number;
            durationSeconds: number;
            isBreak: boolean;
            breakName: string;
        })[];
    }>;
}>;
//# sourceMappingURL=clock.d.ts.map