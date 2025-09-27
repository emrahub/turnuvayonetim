import { router, protectedProcedure, organizationProcedure, hasRole } from '../utils/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { UserRole } from '@prisma/client';
import { ROLE_PERMISSIONS } from '../middleware/auth';
import { EventStoreFactory, AggregateType } from '../services/event-store';

// Validation schemas
const organizationCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(50),
  logoUrl: z.string().url().optional(),
  description: z.string().max(500).optional(),
});

const organizationUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  logoUrl: z.string().url().optional(),
  description: z.string().max(500).optional(),
});

const memberInviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  message: z.string().optional(),
});

export const organizationRouter = router({
  create: protectedProcedure
    .input(organizationCreateSchema)
    .mutation(async ({ input, ctx }) => {
      // Check if slug is taken
      const existing = await ctx.prisma.organization.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Organization slug already exists',
        });
      }

      // Create organization and add user as owner in transaction
      const result = await ctx.prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name: input.name,
            slug: input.slug,
            logoUrl: input.logoUrl,
          },
        });

        await tx.userOrganization.create({
          data: {
            userId: ctx.user.id,
            organizationId: organization.id,
            role: UserRole.ADMIN,
          },
        });

        return organization;
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        result.id,
        result.id,
        AggregateType.ORGANIZATION,
        'OrganizationCreated',
        {
          organizationId: result.id,
          name: result.name,
          slug: result.slug,
          createdBy: ctx.user.id,
        },
        {
          userId: ctx.user.id,
        }
      );

      return result;
    }),

  list: protectedProcedure
    .query(async ({ ctx }) => {
      const organizations = await ctx.prisma.userOrganization.findMany({
        where: { userId: ctx.user.id },
        include: {
          organization: true,
        },
      });

      return organizations.map(org => ({
        id: org.organization.id,
        name: org.organization.name,
        slug: org.organization.slug,
        role: org.role,
        joinedAt: org.joinedAt,
      }));
    }),

  get: protectedProcedure
    .input(z.object({
      organizationId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const userOrg = await ctx.prisma.userOrganization.findFirst({
        where: {
          userId: ctx.user.id,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              _count: {
                select: {
                  users: true,
                  tournaments: true,
                },
              },
            },
          },
        },
      });

      if (!userOrg) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this organization',
        });
      }

      return {
        ...userOrg.organization,
        role: userOrg.role,
      };
    }),

  // Organization management
  update: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      ...organizationUpdateSchema.shape,
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this organization',
        });
      }

      const { organizationId, ...updateData } = input;

      const organization = await ctx.prisma.organization.update({
        where: { id: organizationId },
        data: updateData,
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        organizationId,
        organizationId,
        AggregateType.ORGANIZATION,
        'OrganizationUpdated',
        {
          organizationId,
          changes: Object.keys(updateData),
          updateData,
        },
        {
          userId: ctx.user.id,
        }
      );

      return organization;
    }),

  delete: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      confirmationSlug: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, [UserRole.ADMIN])) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only organization owners can delete organizations',
        });
      }

      // Get organization for confirmation
      const organization = await ctx.prisma.organization.findUnique({
        where: { id: input.organizationId },
        include: {
          tournaments: {
            where: {
              status: { in: ['LIVE', 'PAUSED'] },
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      // Confirm slug matches
      if (organization.slug !== input.confirmationSlug) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Confirmation slug does not match',
        });
      }

      // Check for active tournaments
      if (organization.tournaments.length > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot delete organization with active tournaments',
        });
      }

      await ctx.prisma.organization.delete({
        where: { id: input.organizationId },
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        input.organizationId,
        AggregateType.ORGANIZATION,
        'OrganizationDeleted',
        {
          organizationId: input.organizationId,
          name: organization.name,
          slug: organization.slug,
        },
        {
          userId: ctx.user.id,
        }
      );

      return { success: true };
    }),

  // Member management
  getMembers: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      const members = await ctx.prisma.userOrganization.findMany({
        where: {
          organizationId: input.organizationId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              isActive: true,
            },
          },
        },
        orderBy: {
          joinedAt: 'asc',
        },
        take: input.limit,
        skip: input.offset,
      });

      const totalMembers = await ctx.prisma.userOrganization.count({
        where: {
          organizationId: input.organizationId,
        },
      });

      return {
        members: members.map(member => ({
          id: member.id,
          user: member.user,
          role: member.role,
          joinedAt: member.joinedAt,
        })),
        total: totalMembers,
      };
    }),

  inviteMember: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      ...memberInviteSchema.shape,
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to invite members',
        });
      }

      // Only owners can invite other owners/admins
      if (
        [UserRole.ADMIN, UserRole.ADMIN].includes(input.role) &&
        !hasRole(ctx.userRole, [UserRole.ADMIN])
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners can invite admins or owners',
        });
      }

      // Check if user already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        // Check if already a member
        const existingMember = await ctx.prisma.userOrganization.findFirst({
          where: {
            userId: existingUser.id,
            organizationId: input.organizationId,
          },
        });

        if (existingMember) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User is already a member of this organization',
          });
        }

        // Add existing user to organization
        const membership = await ctx.prisma.userOrganization.create({
          data: {
            userId: existingUser.id,
            organizationId: input.organizationId,
            role: input.role,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        // Record event
        const eventStore = EventStoreFactory.getInstance();
        await eventStore.append(
          input.organizationId,
          input.organizationId,
          AggregateType.ORGANIZATION,
          'MemberAdded',
          {
            organizationId: input.organizationId,
            userId: existingUser.id,
            email: input.email,
            role: input.role,
            invitedBy: ctx.user.id,
          },
          {
            userId: ctx.user.id,
          }
        );

        return {
          type: 'direct_add',
          membership,
        };
      } else {
        // TODO: Implement invitation system for new users
        // For now, return information about what would happen
        return {
          type: 'invitation_required',
          email: input.email,
          role: input.role,
          message: 'User invitation system not yet implemented',
        };
      }
    }),

  updateMemberRole: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      userId: z.string(),
      role: z.nativeEnum(UserRole),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update member roles',
        });
      }

      // Only owners can modify owner/admin roles
      if (
        [UserRole.ADMIN, UserRole.ADMIN].includes(input.role) &&
        !hasRole(ctx.userRole, [UserRole.ADMIN])
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners can assign admin or owner roles',
        });
      }

      // Cannot modify own role unless there are other owners
      if (input.userId === ctx.user.id && ctx.userRole === UserRole.ADMIN) {
        const otherOwners = await ctx.prisma.userOrganization.count({
          where: {
            organizationId: input.organizationId,
            role: UserRole.ADMIN,
            userId: { not: ctx.user.id },
          },
        });

        if (otherOwners === 0 && input.role !== UserRole.ADMIN) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Cannot remove the last owner from organization',
          });
        }
      }

      const membership = await ctx.prisma.userOrganization.update({
        where: {
          userId_organizationId: {
            userId: input.userId,
            organizationId: input.organizationId,
          },
        },
        data: {
          role: input.role,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        input.organizationId,
        AggregateType.ORGANIZATION,
        'MemberRoleUpdated',
        {
          organizationId: input.organizationId,
          userId: input.userId,
          newRole: input.role,
          updatedBy: ctx.user.id,
        },
        {
          userId: ctx.user.id,
        }
      );

      return membership;
    }),

  removeMember: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to remove members',
        });
      }

      // Get member details
      const member = await ctx.prisma.userOrganization.findFirst({
        where: {
          userId: input.userId,
          organizationId: input.organizationId,
        },
        include: {
          user: true,
        },
      });

      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      }

      // Cannot remove owners unless you are an owner
      if (member.role === UserRole.ADMIN && !hasRole(ctx.userRole, [UserRole.ADMIN])) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners can remove other owners',
        });
      }

      // Cannot remove the last owner
      if (member.role === UserRole.ADMIN) {
        const ownerCount = await ctx.prisma.userOrganization.count({
          where: {
            organizationId: input.organizationId,
            role: UserRole.ADMIN,
          },
        });

        if (ownerCount === 1) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Cannot remove the last owner from organization',
          });
        }
      }

      await ctx.prisma.userOrganization.delete({
        where: {
          userId_organizationId: {
            userId: input.userId,
            organizationId: input.organizationId,
          },
        },
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        input.organizationId,
        AggregateType.ORGANIZATION,
        'MemberRemoved',
        {
          organizationId: input.organizationId,
          userId: input.userId,
          email: member.user.email,
          role: member.role,
          removedBy: ctx.user.id,
        },
        {
          userId: ctx.user.id,
        }
      );

      return { success: true };
    }),

  // Organization statistics and analytics
  getStats: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
    }))
    .query(async ({ input, ctx }) => {
      const periodDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
      }[input.period];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      const [tournamentStats, memberStats, recentActivity] = await Promise.all([
        // Tournament statistics
        ctx.prisma.tournament.groupBy({
          by: ['status'],
          where: {
            organizationId: input.organizationId,
            createdAt: { gte: startDate },
          },
          _count: true,
        }),

        // Member statistics
        ctx.prisma.userOrganization.groupBy({
          by: ['role'],
          where: {
            organizationId: input.organizationId,
          },
          _count: true,
        }),

        // Recent activity (tournaments)
        ctx.prisma.tournament.findMany({
          where: {
            organizationId: input.organizationId,
            createdAt: { gte: startDate },
          },
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            createdAt: true,
            _count: {
              select: {
                entries: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        }),
      ]);

      // Calculate total revenue from tournaments
      const revenueData = await ctx.prisma.transaction.aggregate({
        where: {
          tournament: {
            organizationId: input.organizationId,
          },
          createdAt: { gte: startDate },
          type: { in: ['BUYIN', 'REBUY', 'ADDON'] },
        },
        _sum: {
          amount: true,
        },
      });

      return {
        period: input.period,
        tournaments: {
          byStatus: tournamentStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count;
            return acc;
          }, {} as Record<string, number>),
          total: tournamentStats.reduce((sum, stat) => sum + stat._count, 0),
        },
        members: {
          byRole: memberStats.reduce((acc, stat) => {
            acc[stat.role] = stat._count;
            return acc;
          }, {} as Record<string, number>),
          total: memberStats.reduce((sum, stat) => sum + stat._count, 0),
        },
        revenue: {
          total: revenueData._sum.amount || 0,
          period: input.period,
        },
        recentActivity,
      };
    }),
});