import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IAuthUser } from '../../interfaces/common';
import catchAsync from '../../shared/catchAsync';
import pick from '../../shared/pick';
import sendResponse from '../../shared/sendResponse';
import { organizationFilterableFields } from './organization.constant';
import { OrganizationService } from './organization.service';

const createOrganization = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationService.createOrganization(
    req.body,
    req.user as IAuthUser,
  );
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Organization created successfully',
    data: result,
  });
});

const getAllOrganizations = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, organizationFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await OrganizationService.getAllOrganizations(
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Organizations fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getOrganizationBySlug = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OrganizationService.getOrganizationBySlug(
      req.params.slug,
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Organization fetched successfully',
      data: result,
    });
  },
);

const assignAdminToOrganization = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;
    const result = await OrganizationService.assignAdminToOrganization(
      id,
      userId,
    );
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Admin assigned to organization successfully',
      data: result,
    });
  },
);

const updateOrganization = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrganizationService.updateOrganization(id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Organization updated successfully',
    data: result,
  });
});

const toggleOrganizationStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updatedOrg = await OrganizationService.toggleOrganizationStatus(id);

    const message = updatedOrg.isActive
      ? 'Organization has been activated'
      : 'Organization has been deactivated';

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message,
      data: null,
    });
  },
);

export const OrganizationController = {
  createOrganization,
  getAllOrganizations,
  getOrganizationBySlug,
  updateOrganization,
  assignAdminToOrganization,
  toggleOrganizationStatus,
};
