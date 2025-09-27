export declare const appRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
            zodError: import("zod").typeToFlattenedError<any, string> | null;
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
    auth: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
                zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
            _input_in: {
                email: string;
                password: string;
                firstName?: string | undefined;
                lastName?: string | undefined;
            };
            _input_out: {
                email: string;
                password: string;
                firstName?: string | undefined;
                lastName?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            user: {
                id: string;
                email: string;
                firstName: string | null;
                lastName: string | null;
            };
            token: string;
        }>;
        login: import("@trpc/server").BuildProcedure<"mutation", {
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
            _input_in: {
                email: string;
                password: string;
            };
            _input_out: {
                email: string;
                password: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            user: {
                id: string;
                email: string;
                firstName: string | null;
                lastName: string | null;
            };
            token: string;
        }>;
        logout: import("@trpc/server").BuildProcedure<"mutation", {
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
            success: boolean;
        }>;
        me: import("@trpc/server").BuildProcedure<"query", {
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
            email: string;
            firstName: string | null;
            lastName: string | null;
            organizations: {
                id: string;
                name: string;
                slug: string;
                role: import(".prisma/client").$Enums.Role;
            }[];
        }>;
        updateProfile: import("@trpc/server").BuildProcedure<"mutation", {
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                firstName?: string | undefined;
                lastName?: string | undefined;
                avatarUrl?: string | undefined;
            };
            _input_out: {
                firstName?: string | undefined;
                lastName?: string | undefined;
                avatarUrl?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            avatarUrl: string | null;
        }>;
        changePassword: import("@trpc/server").BuildProcedure<"mutation", {
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                currentPassword: string;
                newPassword: string;
            };
            _input_out: {
                currentPassword: string;
                newPassword: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
    }>;
    organization: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
                zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
    tournament: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
                zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                name: string;
                organizationId: string;
                startDate: Date;
                buyIn: number;
                startingStack: number;
                description?: string | undefined;
                rebuyAllowed?: boolean | undefined;
                rebuyAmount?: number | undefined;
                addonAllowed?: boolean | undefined;
                addonAmount?: number | undefined;
                maxPlayers?: number | undefined;
                lateRegMinutes?: number | undefined;
                guaranteedPrize?: number | undefined;
            };
            _input_out: {
                name: string;
                organizationId: string;
                startDate: Date;
                buyIn: number;
                startingStack: number;
                rebuyAllowed: boolean;
                addonAllowed: boolean;
                lateRegMinutes: number;
                description?: string | undefined;
                rebuyAmount?: number | undefined;
                addonAmount?: number | undefined;
                maxPlayers?: number | undefined;
                guaranteedPrize?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            blindStructure: {
                id: string;
                name: string | null;
                description: string | null;
                tournamentId: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            organizationId: string;
            description: string | null;
            status: import(".prisma/client").$Enums.TournamentStatus;
            startDate: Date;
            buyIn: number;
            startingStack: number;
            rebuyAllowed: boolean;
            rebuyAmount: number;
            addonAllowed: boolean;
            addonAmount: number;
            maxPlayers: number | null;
            lateRegMinutes: number;
            guaranteedPrize: number | null;
            endDate: Date | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                status?: "SCHEDULED" | "REGISTERING" | "LIVE" | "PAUSED" | "COMPLETED" | "CANCELLED" | undefined;
                cursor?: string | undefined;
                limit?: number | undefined;
            };
            _input_out: {
                organizationId: string;
                limit: number;
                status?: "SCHEDULED" | "REGISTERING" | "LIVE" | "PAUSED" | "COMPLETED" | "CANCELLED" | undefined;
                cursor?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            tournaments: ({
                _count: {
                    entries: number;
                    tables: number;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                organizationId: string;
                description: string | null;
                status: import(".prisma/client").$Enums.TournamentStatus;
                startDate: Date;
                buyIn: number;
                startingStack: number;
                rebuyAllowed: boolean;
                rebuyAmount: number;
                addonAllowed: boolean;
                addonAmount: number;
                maxPlayers: number | null;
                lateRegMinutes: number;
                guaranteedPrize: number | null;
                endDate: Date | null;
            })[];
            nextCursor: string | undefined;
        }>;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
            activeEntries: number;
            prizePool: number;
            _count: {
                entries: number;
                eliminations: number;
                tables: number;
            };
            blindStructure: ({
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
            }) | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            organizationId: string;
            description: string | null;
            status: import(".prisma/client").$Enums.TournamentStatus;
            startDate: Date;
            buyIn: number;
            startingStack: number;
            rebuyAllowed: boolean;
            rebuyAmount: number;
            addonAllowed: boolean;
            addonAmount: number;
            maxPlayers: number | null;
            lateRegMinutes: number;
            guaranteedPrize: number | null;
            endDate: Date | null;
        }>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                name?: string | undefined;
                description?: string | undefined;
                status?: "SCHEDULED" | "REGISTERING" | "LIVE" | "PAUSED" | "COMPLETED" | "CANCELLED" | undefined;
                startDate?: Date | undefined;
                buyIn?: number | undefined;
                startingStack?: number | undefined;
                rebuyAllowed?: boolean | undefined;
                rebuyAmount?: number | undefined;
                addonAllowed?: boolean | undefined;
                addonAmount?: number | undefined;
                maxPlayers?: number | undefined;
                lateRegMinutes?: number | undefined;
                guaranteedPrize?: number | undefined;
            };
            _input_out: {
                organizationId: string;
                tournamentId: string;
                name?: string | undefined;
                description?: string | undefined;
                status?: "SCHEDULED" | "REGISTERING" | "LIVE" | "PAUSED" | "COMPLETED" | "CANCELLED" | undefined;
                startDate?: Date | undefined;
                buyIn?: number | undefined;
                startingStack?: number | undefined;
                rebuyAllowed?: boolean | undefined;
                rebuyAmount?: number | undefined;
                addonAllowed?: boolean | undefined;
                addonAmount?: number | undefined;
                maxPlayers?: number | undefined;
                lateRegMinutes?: number | undefined;
                guaranteedPrize?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            organizationId: string;
            description: string | null;
            status: import(".prisma/client").$Enums.TournamentStatus;
            startDate: Date;
            buyIn: number;
            startingStack: number;
            rebuyAllowed: boolean;
            rebuyAmount: number;
            addonAllowed: boolean;
            addonAmount: number;
            maxPlayers: number | null;
            lateRegMinutes: number;
            guaranteedPrize: number | null;
            endDate: Date | null;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
            success: boolean;
        }>;
        start: import("@trpc/server").BuildProcedure<"mutation", {
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
            updatedAt: Date;
            name: string;
            organizationId: string;
            description: string | null;
            status: import(".prisma/client").$Enums.TournamentStatus;
            startDate: Date;
            buyIn: number;
            startingStack: number;
            rebuyAllowed: boolean;
            rebuyAmount: number;
            addonAllowed: boolean;
            addonAmount: number;
            maxPlayers: number | null;
            lateRegMinutes: number;
            guaranteedPrize: number | null;
            endDate: Date | null;
        }>;
        pause: import("@trpc/server").BuildProcedure<"mutation", {
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
            updatedAt: Date;
            name: string;
            organizationId: string;
            description: string | null;
            status: import(".prisma/client").$Enums.TournamentStatus;
            startDate: Date;
            buyIn: number;
            startingStack: number;
            rebuyAllowed: boolean;
            rebuyAmount: number;
            addonAllowed: boolean;
            addonAmount: number;
            maxPlayers: number | null;
            lateRegMinutes: number;
            guaranteedPrize: number | null;
            endDate: Date | null;
        }>;
        complete: import("@trpc/server").BuildProcedure<"mutation", {
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
            updatedAt: Date;
            name: string;
            organizationId: string;
            description: string | null;
            status: import(".prisma/client").$Enums.TournamentStatus;
            startDate: Date;
            buyIn: number;
            startingStack: number;
            rebuyAllowed: boolean;
            rebuyAmount: number;
            addonAllowed: boolean;
            addonAmount: number;
            maxPlayers: number | null;
            lateRegMinutes: number;
            guaranteedPrize: number | null;
            endDate: Date | null;
        }>;
        stats: import("@trpc/server").BuildProcedure<"query", {
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
            totalEntries: number;
            activeEntries: number;
            eliminatedEntries: number;
            totalRebuys: number;
            totalAddons: number;
            prizePool: number;
            averageStack: number;
        }>;
        seatPlayers: import("@trpc/server").BuildProcedure<"mutation", {
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                maxPlayersPerTable?: number | undefined;
                minPlayersPerTable?: number | undefined;
                balanceThreshold?: number | undefined;
            };
            _input_out: {
                organizationId: string;
                tournamentId: string;
                maxPlayersPerTable: number;
                minPlayersPerTable: number;
                balanceThreshold: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("../services/seating.service").SeatingResult>;
        rebalanceTables: import("@trpc/server").BuildProcedure<"mutation", {
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                maxPlayersPerTable?: number | undefined;
                minPlayersPerTable?: number | undefined;
                balanceThreshold?: number | undefined;
            };
            _input_out: {
                organizationId: string;
                tournamentId: string;
                maxPlayersPerTable: number;
                minPlayersPerTable: number;
                balanceThreshold: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("../services/seating.service").SeatingResult>;
        eliminatePlayer: import("@trpc/server").BuildProcedure<"mutation", {
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                entryId: string;
            };
            _input_out: {
                organizationId: string;
                entryId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
    }>;
    player: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
                zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
    table: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
                zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
    clock: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
                zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
                        zodError: import("zod").typeToFlattenedError<any, string> | null;
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
}>;
export type AppRouter = typeof appRouter;
//# sourceMappingURL=index.d.ts.map