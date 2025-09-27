import { z } from 'zod';
export declare const tableRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
            organizationId: any;
            prisma: import(".prisma/client").PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
            userRole: import(".prisma/client").$Enums.Role;
        };
        _input_in: {
            organizationId: string;
            tournamentId: string;
            tableNumber: number;
            maxSeats?: number | undefined;
        };
        _input_out: {
            organizationId: string;
            tournamentId: string;
            tableNumber: number;
            maxSeats: number;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        table: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TableStatus;
            tournamentId: string;
            tableNumber: number;
            maxSeats: number;
        };
        seatCount: number;
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
        _count: {
            entries: number;
        };
        seats: ({
            entry: {
                id: string;
                status: import(".prisma/client").$Enums.EntryStatus;
                tournamentId: string;
                playerId: string | null;
                displayName: string;
                tableId: string | null;
                seatNumber: number | null;
                chipCount: number;
                position: number | null;
                registeredAt: Date;
                eliminatedAt: Date | null;
            } | null;
        } & {
            id: string;
            tableId: string;
            seatNumber: number;
            entryId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TableStatus;
        tournamentId: string;
        tableNumber: number;
        maxSeats: number;
    })[]>;
    assignSeat: import("@trpc/server").BuildProcedure<"mutation", {
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
            tableId: string;
            seatNumber: number;
            entryId: string;
        };
        _input_out: {
            organizationId: string;
            tournamentId: string;
            tableId: string;
            seatNumber: number;
            entryId: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        tableId: string;
        seatNumber: number;
        entryId: string | null;
    }>;
    balance: import("@trpc/server").BuildProcedure<"mutation", {
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
        moves: number;
    }>;
}>;
//# sourceMappingURL=table.d.ts.map