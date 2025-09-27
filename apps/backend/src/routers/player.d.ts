import { z } from 'zod';
export declare const playerRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
    register: import("@trpc/server").BuildProcedure<"mutation", {
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
            displayName: string;
            buyIn: number;
            email?: string | undefined;
            playerId?: string | undefined;
            phone?: string | undefined;
        };
        _input_out: {
            organizationId: string;
            tournamentId: string;
            displayName: string;
            buyIn: number;
            email?: string | undefined;
            playerId?: string | undefined;
            phone?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
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
            status?: "REGISTERED" | "ACTIVE" | "ELIMINATED" | "WITHDRAWN" | undefined;
        };
        _input_out: {
            organizationId: string;
            tournamentId: string;
            status?: "REGISTERED" | "ACTIVE" | "ELIMINATED" | "WITHDRAWN" | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, ({
        player: {
            id: string;
            email: string | null;
            firstName: string | null;
            lastName: string | null;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            nickname: string | null;
            photoUrl: string | null;
            notes: string | null;
        } | null;
        table: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TableStatus;
            tournamentId: string;
            tableNumber: number;
            maxSeats: number;
        } | null;
        seat: {
            id: string;
            tableId: string;
            seatNumber: number;
            entryId: string | null;
        } | null;
    } & {
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
    })[]>;
    eliminate: import("@trpc/server").BuildProcedure<"mutation", {
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
            entryId: string;
            place: number;
        };
        _input_out: {
            organizationId: string;
            tournamentId: string;
            entryId: string;
            place: number;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
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
    }>;
    rebuy: import("@trpc/server").BuildProcedure<"mutation", {
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
            entryId: string;
            amount: number;
            chips: number;
        };
        _input_out: {
            organizationId: string;
            tournamentId: string;
            entryId: string;
            amount: number;
            chips: number;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
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
    }>;
}>;
//# sourceMappingURL=player.d.ts.map