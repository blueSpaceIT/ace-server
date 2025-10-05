import { Organization, Prisma, UserRole } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import slugify from 'slugify';
import ApiError from '../../helpers/ApiError';
import { paginationHelper } from '../../helpers/paginationHelper';
import { IPaginationOptions } from '../../interfaces/pagination';
import prisma from '../../shared/prisma';
import { organizationSearchAbleFields } from './organization.constant';
import { CreateOrganizationInput } from './organization.interface';

/**
 * Create new organization (only SUPER_ADMIN can create)
 */
const createOrganization = async (
  payload: CreateOrganizationInput,
  currentAdmin: { id: string; userRole: UserRole },
): Promise<Organization> => {
  if (currentAdmin.userRole !== UserRole.SUPER_ADMIN) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Only Super Admin can create organizations',
    );
  }
  let adminProfile = await prisma.admin.findUnique({
    where: { userId: currentAdmin.id },
  });

  if (!adminProfile) {
    adminProfile = await prisma.admin.create({
      data: { userId: currentAdmin.id },
    });
  }

  const slug = slugify(payload.name, { lower: true, strict: true });

  const existingOrg = await prisma.organization.findUnique({
    where: { slug },
  });
  if (existingOrg) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Organization with the same slug already exists',
    );
  }

  const newOrg = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: payload.name,
        slug,
        domain: payload.domain || null,
        adminId: adminProfile.id,
        isActive: true,
      },
      include: {
        admin: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        users: {
          select: { id: true, name: true, email: true, userRole: true },
        },
      },
    });

    return organization;
  });

  return newOrg;
};

/**
 * Get all organizations with filters and pagination
 */
const getAllOrganizations = async (
  filters: Record<string, unknown>,
  options: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.OrganizationWhereInput[] = [];

  // Search support
  if (searchTerm) {
    andConditions.push({
      OR: organizationSearchAbleFields.map((field) => ({
        [field]: {
          contains: String(searchTerm),
          mode: 'insensitive',
        },
      })),
    });
  }

  // Exact match filters
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.entries(filterData).map(([key, value]) => ({
        [key]: { equals: value },
      })),
    });
  }

  //  Final where condition
  const whereConditions: Prisma.OrganizationWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  //  Include related data
  const includeData = {
    admin: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            userRole: true,
          },
        },
      },
    },
    users: {
      select: {
        id: true,
        name: true,
        email: true,
        userRole: true,
      },
    },
  };

  // Fetch organizations + total count
  const [organizations, total] = await prisma.$transaction([
    prisma.organization.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: {
        [sortBy as string]: sortOrder,
      },
      include: includeData,
    }),
    prisma.organization.count({ where: whereConditions }),
  ]);

  return {
    meta: { page, limit, total },
    data: organizations,
  };
};

/**
 * Get organization by slug
 */
const getOrganizationBySlug = async (slug: string): Promise<Organization> => {
  const organization = await prisma.organization.findUnique({
    where: { slug },
    include: {
      admin: {
        include: {
          user: {
            select: { id: true, name: true, email: true, userRole: true },
          },
        },
      },
    },
  });

  if (!organization) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Organization not found');
  }

  return organization;
};

/**
 * Assign existing admin to an organization
 */
const assignAdminToOrganization = async (
  orgId: string,
  userId: string,
): Promise<Organization> => {
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { admin: true },
  });

  if (!organization) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Organization not found');
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { admin: true },
  });

  const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

  if (!targetUser || !allowedRoles.includes(targetUser.userRole)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'User must have ADMIN or SUPER_ADMIN role to be assigned as organization admin',
    );
  }

  let adminProfile = targetUser.admin;
  if (!adminProfile) {
    adminProfile = await prisma.admin.create({
      data: { userId },
    });
  }

  const updatedOrg = await prisma.organization.update({
    where: { id: orgId },
    data: { adminId: adminProfile.id },
    include: {
      admin: { include: { user: true } },
    },
  });

  return updatedOrg;
};

/**
 * Update organization by ID
 */
const updateOrganization = async (
  id: string,
  payload: { name?: string; domain?: string; isActive?: boolean },
): Promise<Organization> => {
  // Check if organization exists
  const orgExists = await prisma.organization.findUnique({
    where: { id },
  });

  if (!orgExists) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Organization not found');
  }

  // Prepare update data
  const updateData: any = { ...payload };

  // If name is provided, always regenerate slug
  if (payload.name) {
    const newSlug = slugify(payload.name, { lower: true, strict: true });

    // Check if slug already exists for another org
    const slugExists = await prisma.organization.findFirst({
      where: {
        slug: newSlug,
        id: { not: id },
      },
    });

    if (slugExists) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Organization slug already exists for another organization',
      );
    }

    updateData.slug = newSlug;
  }

  const updatedOrg = await prisma.organization.update({
    where: { id },
    data: updateData,
    include: {
      admin: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              userRole: true,
            },
          },
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          userRole: true,
        },
      },
    },
  });

  return updatedOrg;
};

/**
 * Toggle organization status
 */
const toggleOrganizationStatus = async (id: string): Promise<Organization> => {
  const orgExists = await prisma.organization.findUnique({
    where: { id },
  });

  if (!orgExists) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Organization not found');
  }

  // Toggle the status
  const updatedOrg = await prisma.organization.update({
    where: { id },
    data: { isActive: !orgExists.isActive },
    include: {
      admin: {
        include: {
          user: {
            select: { id: true, name: true, email: true, userRole: true },
          },
        },
      },
      users: {
        select: { id: true, name: true, email: true, userRole: true },
      },
    },
  });

  return updatedOrg;
};

export const OrganizationService = {
  createOrganization,
  getAllOrganizations,
  getOrganizationBySlug,
  assignAdminToOrganization,
  updateOrganization,
  toggleOrganizationStatus,
};
