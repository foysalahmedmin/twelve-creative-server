import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as TeamMemberRepository from './team-member.repository';
import { TTeamMember } from './team-member.type';

export const createTeamMember = async (
  data: Partial<TTeamMember>,
): Promise<TTeamMember> => {
  return await TeamMemberRepository.create(data);
};

export const getPublicTeamMembers = async (): Promise<{
  data: TTeamMember[];
}> => {
  const data = await TeamMemberRepository.findPublic();
  return { data };
};

export const getTeamMembers = async (
  query: Record<string, unknown>,
): Promise<{
  data: TTeamMember[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await TeamMemberRepository.findAdminPaginated(query);
};

export const getTeamMember = async (id: string): Promise<TTeamMember> => {
  const result = await TeamMemberRepository.findByIdLean(id);
  if (!result)
    throw new AppError(httpStatus.NOT_FOUND, 'Team member not found');
  return result;
};

export const updateTeamMember = async (
  id: string,
  payload: Partial<TTeamMember>,
): Promise<TTeamMember> => {
  const exists = await TeamMemberRepository.findByIdLean(id);
  if (!exists)
    throw new AppError(httpStatus.NOT_FOUND, 'Team member not found');
  const result = await TeamMemberRepository.updateById(id, payload);
  return result!;
};

export const reorderTeamMembers = async (
  items: { _id: string; order: number }[],
): Promise<void> => {
  await TeamMemberRepository.updateOrder(items);
};

export const deleteTeamMember = async (id: string): Promise<void> => {
  const member = await TeamMemberRepository.findById(id);
  if (!member)
    throw new AppError(httpStatus.NOT_FOUND, 'Team member not found');
  await member.softDelete();
};

export const deleteTeamMemberPermanent = async (id: string): Promise<void> => {
  const exists = await TeamMemberRepository.findByIdLean(id);
  if (!exists)
    throw new AppError(httpStatus.NOT_FOUND, 'Team member not found');
  await TeamMemberRepository.hardDeleteById(id);
};

export const restoreTeamMember = async (id: string): Promise<TTeamMember> => {
  const exists = await TeamMemberRepository.findByIdWithDeleted(id);
  if (!exists)
    throw new AppError(httpStatus.NOT_FOUND, 'Team member not found');

  const restored = await TeamMemberRepository.restoreById(id);
  if (!restored) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Team member not found or not deleted',
    );
  }
  return (await TeamMemberRepository.findByIdLean(id))!;
};
