import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as TeamMemberControllers from './team-member.controller';
import * as TeamMemberValidations from './team-member.validator';

const router = express.Router();

router.get('/public', TeamMemberControllers.getPublicTeamMembers);

router.get('/', auth('admin', 'editor'), TeamMemberControllers.getTeamMembers);

router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(TeamMemberValidations.teamMemberIdSchema),
  TeamMemberControllers.getTeamMember,
);

router.post(
  '/',
  auth('admin', 'editor'),
  validation(TeamMemberValidations.createTeamMemberValidationSchema),
  TeamMemberControllers.createTeamMember,
);

router.post(
  '/reorder',
  auth('admin', 'editor'),
  validation(TeamMemberValidations.reorderTeamMembersValidationSchema),
  TeamMemberControllers.reorderTeamMembers,
);

router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(TeamMemberValidations.updateTeamMemberValidationSchema),
  TeamMemberControllers.updateTeamMember,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(TeamMemberValidations.teamMemberIdSchema),
  TeamMemberControllers.restoreTeamMember,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(TeamMemberValidations.teamMemberIdSchema),
  TeamMemberControllers.deleteTeamMemberPermanent,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(TeamMemberValidations.teamMemberIdSchema),
  TeamMemberControllers.deleteTeamMember,
);

const teamMemberRoutes = router;
export default teamMemberRoutes;
