import httpStatus from 'http-status';

jest.mock('../team-member.repository');

import * as TeamMemberRepository from '../team-member.repository';
import * as TeamMemberService from '../team-member.service';
import { TTeamMember } from '../team-member.type';

const MEMBER_ID = '507f1f77bcf86cd799439021';

const member: TTeamMember = {
  _id: MEMBER_ID,
  name: 'Alex Morgan',
  role: 'Creative Director',
  bio: 'Leads brand strategy and creative direction.',
  image: '/team/alex.jpg',
  socials: { linkedin: 'https://linkedin.com/in/alex' },
  order: 1,
  is_active: true,
};

const paginated = {
  data: [member],
  meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
};

describe('TeamMemberService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates a team member', async () => {
    (TeamMemberRepository.create as jest.Mock).mockResolvedValue(member);

    await expect(TeamMemberService.createTeamMember(member)).resolves.toEqual(
      member,
    );
    expect(TeamMemberRepository.create).toHaveBeenCalledWith(member);
  });

  it('returns public team members', async () => {
    (TeamMemberRepository.findPublic as jest.Mock).mockResolvedValue([member]);

    await expect(TeamMemberService.getPublicTeamMembers()).resolves.toEqual({
      data: [member],
    });
  });

  it('returns the paginated admin team list', async () => {
    const query = { page: '2', filter: 'active' };
    (TeamMemberRepository.findAdminPaginated as jest.Mock).mockResolvedValue(
      paginated,
    );

    await expect(TeamMemberService.getTeamMembers(query)).resolves.toEqual(
      paginated,
    );
    expect(TeamMemberRepository.findAdminPaginated).toHaveBeenCalledWith(query);
  });

  describe('getTeamMember', () => {
    it('returns a team member by id', async () => {
      (TeamMemberRepository.findByIdLean as jest.Mock).mockResolvedValue(
        member,
      );

      await expect(TeamMemberService.getTeamMember(MEMBER_ID)).resolves.toEqual(
        member,
      );
    });

    it('throws 404 when the member does not exist', async () => {
      (TeamMemberRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

      await expect(
        TeamMemberService.getTeamMember(MEMBER_ID),
      ).rejects.toMatchObject({
        status: httpStatus.NOT_FOUND,
        message: 'Team member not found',
      });
    });
  });

  describe('updateTeamMember', () => {
    it('updates an existing member', async () => {
      const payload = { role: 'Executive Creative Director' };
      const updated = { ...member, ...payload };
      (TeamMemberRepository.findByIdLean as jest.Mock).mockResolvedValue(
        member,
      );
      (TeamMemberRepository.updateById as jest.Mock).mockResolvedValue(updated);

      await expect(
        TeamMemberService.updateTeamMember(MEMBER_ID, payload),
      ).resolves.toEqual(updated);
      expect(TeamMemberRepository.updateById).toHaveBeenCalledWith(
        MEMBER_ID,
        payload,
      );
    });

    it('throws 404 before updating a missing member', async () => {
      (TeamMemberRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

      await expect(
        TeamMemberService.updateTeamMember(MEMBER_ID, { name: 'Missing' }),
      ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
      expect(TeamMemberRepository.updateById).not.toHaveBeenCalled();
    });
  });

  it('forwards team-member reorder items', async () => {
    const items = [{ _id: MEMBER_ID, order: 4 }];
    (TeamMemberRepository.updateOrder as jest.Mock).mockResolvedValue(
      undefined,
    );

    await TeamMemberService.reorderTeamMembers(items);

    expect(TeamMemberRepository.updateOrder).toHaveBeenCalledWith(items);
  });

  describe('deleteTeamMember', () => {
    it('soft deletes an existing member', async () => {
      const softDelete = jest.fn().mockResolvedValue(undefined);
      (TeamMemberRepository.findById as jest.Mock).mockResolvedValue({
        softDelete,
      });

      await TeamMemberService.deleteTeamMember(MEMBER_ID);

      expect(softDelete).toHaveBeenCalledTimes(1);
    });

    it('throws 404 when soft deleting a missing member', async () => {
      (TeamMemberRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        TeamMemberService.deleteTeamMember(MEMBER_ID),
      ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    });
  });

  describe('deleteTeamMemberPermanent', () => {
    it('hard deletes an existing member', async () => {
      (TeamMemberRepository.findByIdLean as jest.Mock).mockResolvedValue(
        member,
      );

      await TeamMemberService.deleteTeamMemberPermanent(MEMBER_ID);

      expect(TeamMemberRepository.hardDeleteById).toHaveBeenCalledWith(
        MEMBER_ID,
      );
    });

    it('throws 404 when permanently deleting a missing member', async () => {
      (TeamMemberRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

      await expect(
        TeamMemberService.deleteTeamMemberPermanent(MEMBER_ID),
      ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
      expect(TeamMemberRepository.hardDeleteById).not.toHaveBeenCalled();
    });
  });
});

// Restore is the counterpart to the soft delete these modules already had:
// without it a soft-deleted record was unreachable from the API entirely, and
// could only be brought back by editing the database by hand.
describe('TeamMemberService.restoreTeamMember', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('restores a soft-deleted record and returns the fresh copy', async () => {
    (TeamMemberRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(
      member,
    );
    (TeamMemberRepository.restoreById as jest.Mock).mockResolvedValue(member);
    (TeamMemberRepository.findByIdLean as jest.Mock).mockResolvedValue(member);

    await expect(
      TeamMemberService.restoreTeamMember(MEMBER_ID),
    ).resolves.toEqual(member);
    expect(TeamMemberRepository.restoreById).toHaveBeenCalledWith(MEMBER_ID);
  });

  it('throws 404 without attempting a restore when the id does not exist', async () => {
    (TeamMemberRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      TeamMemberService.restoreTeamMember(MEMBER_ID),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Team member not found',
    });
    expect(TeamMemberRepository.restoreById).not.toHaveBeenCalled();
  });

  it('throws 404 when the record exists but was never deleted', async () => {
    (TeamMemberRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(
      member,
    );
    (TeamMemberRepository.restoreById as jest.Mock).mockResolvedValue(null);

    await expect(
      TeamMemberService.restoreTeamMember(MEMBER_ID),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Team member not found or not deleted',
    });
  });
});
