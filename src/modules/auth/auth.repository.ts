/**
 * Auth Repository
 *
 * Handles ALL direct database interactions for the Auth module.
 * The service layer must NEVER import from any model directly;
 * it must go through this repository. This ensures:
 *  - Loose coupling between business logic and data access
 *  - Mockable DB layer for unit testing
 *  - A single place to change if the persistence layer changes
 *
 * Note: Because auth operates exclusively on the User collection,
 * this repository re-exports the relevant functions from user.repository
 * rather than duplicating model calls.
 */

export {
  // ─── Writes ───────────────────────────────────────────────────────────────
  createUser,
  // ─── Lookups ──────────────────────────────────────────────────────────────
  findByEmailWithPassword,
  findByGoogleIdWithPassword,
  saveDocument,
  updateIsVerifiedById,
  updatePasswordByEmailAndRole,
  updatePasswordById,
  incrementTokenVersion,
} from '../user/user.repository';
