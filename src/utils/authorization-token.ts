/**
 * Accept both the RFC-standard `Authorization: Bearer <token>` form and the
 * legacy raw-token form used by the existing admin server actions.
 */
export const extractAuthorizationToken = (
  authorization: string | undefined,
): string | undefined => {
  const value = authorization?.trim();
  if (!value) return undefined;
  if (/^Bearer$/i.test(value)) return undefined;

  const bearerMatch = /^Bearer\s+(.+)$/i.exec(value);
  if (!bearerMatch) return value;

  const token = bearerMatch[1].trim();
  return token || undefined;
};
