import { extractAuthorizationToken } from '../authorization-token';

describe('extractAuthorizationToken', () => {
  it('extracts a standard Bearer token case-insensitively', () => {
    expect(extractAuthorizationToken('Bearer signed.jwt.token')).toBe(
      'signed.jwt.token',
    );
    expect(extractAuthorizationToken('  bearer   signed.jwt.token  ')).toBe(
      'signed.jwt.token',
    );
  });

  it('preserves the legacy raw-token form', () => {
    expect(extractAuthorizationToken('  signed.jwt.token  ')).toBe(
      'signed.jwt.token',
    );
  });

  it.each([undefined, '', '   ', 'Bearer', 'Bearer   '])(
    'returns undefined for an empty or incomplete credential (%p)',
    (value) => {
      expect(extractAuthorizationToken(value)).toBeUndefined();
    },
  );
});
