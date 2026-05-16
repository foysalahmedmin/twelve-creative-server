import { publish } from '../../events/event-publisher';

export const emitUserRegistered = (userId: string, email: string) =>
  publish('user.registered', { userId, email });

export const emitUserVerified = (userId: string) =>
  publish('user.verified', { userId });
