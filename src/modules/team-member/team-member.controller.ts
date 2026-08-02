import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as TeamMemberServices from './team-member.service';

export const createTeamMember = catchAsync(async (req, res) => {
  const result = await TeamMemberServices.createTeamMember(req.body);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Team member created successfully',
    data: result,
  });
});

export const getPublicTeamMembers = catchAsync(async (_req, res) => {
  const result = await TeamMemberServices.getPublicTeamMembers();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Team members retrieved successfully',
    data: result.data,
  });
});

export const getTeamMembers = catchAsync(async (req, res) => {
  const result = await TeamMemberServices.getTeamMembers(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Team members retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getTeamMember = catchAsync(async (req, res) => {
  const result = await TeamMemberServices.getTeamMember(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Team member retrieved successfully',
    data: result,
  });
});

export const updateTeamMember = catchAsync(async (req, res) => {
  const result = await TeamMemberServices.updateTeamMember(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Team member updated successfully',
    data: result,
  });
});

export const reorderTeamMembers = catchAsync(async (req, res) => {
  await TeamMemberServices.reorderTeamMembers(req.body.items);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Team members reordered successfully',
    data: null,
  });
});

export const deleteTeamMember = catchAsync(async (req, res) => {
  await TeamMemberServices.deleteTeamMember(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Team member deleted successfully',
    data: null,
  });
});

export const deleteTeamMemberPermanent = catchAsync(async (req, res) => {
  await TeamMemberServices.deleteTeamMemberPermanent(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Team member permanently deleted',
    data: null,
  });
});

export const restoreTeamMember = catchAsync(async (req, res) => {
  const result = await TeamMemberServices.restoreTeamMember(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Team member restored successfully',
    data: result,
  });
});
