import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';
import AppError from '../../../builder/app-error';

jest.mock('../team-member.service');
jest.mock('../../../middlewares/auth.middleware', () =>
  jest.fn(
    () =>
      (
        req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) => {
        (req as express.Request & { user: unknown }).user = {
          _id: '507f1f77bcf86cd799439099',
          role: 'admin',
          name: 'Admin',
          email: 'admin@example.com',
        };
        next();
      },
  ),
);
jest.mock('../../../middlewares/validation.middleware', () =>
  jest.fn(
    () =>
      (
        _req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) =>
        next(),
  ),
);

import teamMemberRoutes from '../team-member.route';
import * as TeamMemberService from '../team-member.service';

const MEMBER_ID = '507f1f77bcf86cd799439021';
const member = {
  _id: MEMBER_ID,
  name: 'Alex Morgan',
  role: 'Creative Director',
  bio: 'Leads brand strategy and creative direction.',
  image: '/team/alex.jpg',
  order: 1,
  is_active: true,
};
const meta = { total: 1, page: 1, limit: 10, total_pages: 1 };

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/team-member', teamMemberRoutes);
  app.use(
    (
      error: { status?: number; message?: string },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(error.status ?? 500).json({
        success: false,
        message: error.message ?? 'Internal Server Error',
      });
    },
  );
  return app;
};

const request = supertest(buildApp());

describe('Team member routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET /public returns public team members', async () => {
    (TeamMemberService.getPublicTeamMembers as jest.Mock).mockResolvedValue({
      data: [member],
    });

    const response = await request.get('/api/team-member/public');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([member]);
  });

  it('GET / returns the paginated admin list', async () => {
    (TeamMemberService.getTeamMembers as jest.Mock).mockResolvedValue({
      data: [member],
      meta,
    });

    const response = await request.get(
      '/api/team-member?page=2&filter=inactive',
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.meta).toEqual(meta);
    expect(TeamMemberService.getTeamMembers).toHaveBeenCalledWith(
      expect.objectContaining({ page: '2', filter: 'inactive' }),
    );
  });

  it('GET /:id returns one team member', async () => {
    (TeamMemberService.getTeamMember as jest.Mock).mockResolvedValue(member);

    const response = await request.get(`/api/team-member/${MEMBER_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(member);
    expect(TeamMemberService.getTeamMember).toHaveBeenCalledWith(MEMBER_ID);
  });

  it('POST / creates a team member', async () => {
    (TeamMemberService.createTeamMember as jest.Mock).mockResolvedValue(member);

    const response = await request.post('/api/team-member').send(member);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.data).toEqual(member);
    expect(TeamMemberService.createTeamMember).toHaveBeenCalledWith(member);
  });

  it('POST /reorder forwards ordered items', async () => {
    const items = [{ _id: MEMBER_ID, order: 2 }];
    (TeamMemberService.reorderTeamMembers as jest.Mock).mockResolvedValue(
      undefined,
    );

    const response = await request
      .post('/api/team-member/reorder')
      .send({ items });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(TeamMemberService.reorderTeamMembers).toHaveBeenCalledWith(items);
  });

  it('PATCH /:id updates a team member', async () => {
    const updated = { ...member, role: 'Executive Creative Director' };
    (TeamMemberService.updateTeamMember as jest.Mock).mockResolvedValue(
      updated,
    );

    const response = await request
      .patch(`/api/team-member/${MEMBER_ID}`)
      .send({ role: updated.role });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data.role).toBe(updated.role);
    expect(TeamMemberService.updateTeamMember).toHaveBeenCalledWith(MEMBER_ID, {
      role: updated.role,
    });
  });

  it('PATCH /:id forwards a missing-member error', async () => {
    (TeamMemberService.updateTeamMember as jest.Mock).mockRejectedValue(
      new AppError(httpStatus.NOT_FOUND, 'Team member not found'),
    );

    const response = await request
      .patch(`/api/team-member/${MEMBER_ID}`)
      .send({ name: 'Missing' });

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body.message).toBe('Team member not found');
  });

  it('DELETE /:id/permanent permanently deletes a team member', async () => {
    (
      TeamMemberService.deleteTeamMemberPermanent as jest.Mock
    ).mockResolvedValue(undefined);

    const response = await request.delete(
      `/api/team-member/${MEMBER_ID}/permanent`,
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(TeamMemberService.deleteTeamMemberPermanent).toHaveBeenCalledWith(
      MEMBER_ID,
    );
  });

  it('DELETE /:id soft deletes a team member', async () => {
    (TeamMemberService.deleteTeamMember as jest.Mock).mockResolvedValue(
      undefined,
    );

    const response = await request.delete(`/api/team-member/${MEMBER_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(TeamMemberService.deleteTeamMember).toHaveBeenCalledWith(MEMBER_ID);
  });

  it('DELETE /:id returns 404 for a missing team member', async () => {
    (TeamMemberService.deleteTeamMember as jest.Mock).mockRejectedValue(
      new AppError(httpStatus.NOT_FOUND, 'Team member not found'),
    );

    const response = await request.delete(`/api/team-member/${MEMBER_ID}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });
});
