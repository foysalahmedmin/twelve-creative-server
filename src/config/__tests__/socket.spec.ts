import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';
import { User } from '../../modules/user/user.model';
import {
  authenticateSocket,
  isAllowedSocketOrigin,
  normalizeCustomRoomId,
  registerSocketEvents,
  resolveSocketAccessToken,
} from '../socket';

const USER_ID = '507f1f77bcf86cd799439011';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET!;

const makeToken = (overrides: Record<string, unknown> = {}): string =>
  jwt.sign(
    {
      _id: USER_ID,
      name: 'Socket Admin',
      email: 'admin@example.com',
      role: 'admin',
      token_version: 3,
      ...overrides,
    },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  _id: { toString: () => USER_ID },
  name: 'Current Admin',
  email: 'current-admin@example.com',
  image: undefined,
  role: 'admin',
  status: 'in-progress',
  is_verified: true,
  is_deleted: false,
  token_version: 3,
  password_changed_at: new Date(Date.now() - 60_000),
  ...overrides,
});

const makeHandshakeSocket = (
  options: { token?: unknown; cookie?: string } = {},
) =>
  ({
    handshake: {
      auth: options.token === undefined ? {} : { token: options.token },
      headers: { cookie: options.cookie },
    },
    data: {},
  }) as unknown as Pick<Socket, 'handshake' | 'data'>;

describe('Socket.IO authentication', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('accepts a current access token and stores database-backed identity', async () => {
    jest.spyOn(User, 'isUserExist').mockResolvedValue(makeUser() as never);
    const socket = makeHandshakeSocket({ token: makeToken() });

    const authenticated = await authenticateSocket(socket);

    expect(authenticated).toMatchObject({
      _id: USER_ID,
      name: 'Current Admin',
      email: 'current-admin@example.com',
      role: 'admin',
      token_version: 3,
    });
    expect(socket.data.user).toEqual(authenticated);
  });

  it('supports the same-origin httpOnly admin access cookie', async () => {
    jest.spyOn(User, 'isUserExist').mockResolvedValue(makeUser() as never);
    const token = makeToken();
    const socket = makeHandshakeSocket({
      cookie: `theme=dark; tc_admin_access=${encodeURIComponent(token)}`,
    });

    await expect(authenticateSocket(socket)).resolves.toMatchObject({
      _id: USER_ID,
      role: 'admin',
    });
  });

  it('accepts the standard Bearer access-token form', async () => {
    jest.spyOn(User, 'isUserExist').mockResolvedValue(makeUser() as never);
    const socket = makeHandshakeSocket({ token: `Bearer ${makeToken()}` });

    await expect(authenticateSocket(socket)).resolves.toMatchObject({
      _id: USER_ID,
      role: 'admin',
    });
  });

  it('rejects missing and invalid credentials before a database lookup', async () => {
    const lookup = jest.spyOn(User, 'isUserExist');

    await expect(authenticateSocket(makeHandshakeSocket())).rejects.toThrow(
      'Missing access token',
    );
    await expect(
      authenticateSocket(makeHandshakeSocket({ token: 'not-a-jwt' })),
    ).rejects.toThrow();
    expect(lookup).not.toHaveBeenCalled();
  });

  it.each([
    ['missing user', null],
    ['blocked user', makeUser({ status: 'blocked' })],
    ['deleted user', makeUser({ is_deleted: true })],
  ])('rejects a %s', async (_label, user) => {
    jest.spyOn(User, 'isUserExist').mockResolvedValue(user as never);

    await expect(
      authenticateSocket(makeHandshakeSocket({ token: makeToken() })),
    ).rejects.toThrow('User is not allowed to connect');
  });

  it('rejects stale token versions and stale roles', async () => {
    const lookup = jest.spyOn(User, 'isUserExist');
    lookup.mockResolvedValueOnce(makeUser({ token_version: 4 }) as never);

    await expect(
      authenticateSocket(makeHandshakeSocket({ token: makeToken() })),
    ).rejects.toThrow('Session has been invalidated');

    lookup.mockResolvedValueOnce(makeUser({ role: 'editor' }) as never);
    await expect(
      authenticateSocket(makeHandshakeSocket({ token: makeToken() })),
    ).rejects.toThrow('User role has changed');
  });

  it('rejects a token issued before the current password', async () => {
    const issuedAt = Math.floor(Date.now() / 1000) - 20;
    const token = makeToken({ iat: issuedAt });
    jest.spyOn(User, 'isUserExist').mockResolvedValue(
      makeUser({
        password_changed_at: new Date((issuedAt + 10) * 1000),
      }) as never,
    );

    await expect(
      authenticateSocket(makeHandshakeSocket({ token })),
    ).rejects.toThrow('Password has changed since token issuance');
  });
});

describe('Socket.IO handshake and room validation', () => {
  it('accepts configured origins and rejects foreign or malformed origins', () => {
    const allowed = ['https://twelvecreative.io'];

    expect(isAllowedSocketOrigin('https://twelvecreative.io', allowed)).toBe(
      true,
    );
    expect(isAllowedSocketOrigin(undefined, allowed)).toBe(true);
    expect(isAllowedSocketOrigin('https://evil.example', allowed)).toBe(false);
    expect(isAllowedSocketOrigin('null', allowed)).toBe(false);
  });

  it('prefers an explicit token and reads the admin cookie as fallback', () => {
    expect(
      resolveSocketAccessToken(' explicit ', 'tc_admin_access=cookie'),
    ).toBe('explicit');
    expect(resolveSocketAccessToken(undefined, 'tc_admin_access=cookie')).toBe(
      'cookie',
    );
    expect(resolveSocketAccessToken('Bearer bearer-token')).toBe(
      'bearer-token',
    );
    expect(resolveSocketAccessToken('bearer   bearer-token')).toBe(
      'bearer-token',
    );
    expect(
      resolveSocketAccessToken({}, 'tc_admin_access=cookie'),
    ).toBeUndefined();
  });

  it.each([
    ['user:507f1f77bcf86cd799439011'],
    ['ROLE:admin'],
    ['project:alpha'],
    ['contains spaces'],
    [''],
    ['a'.repeat(65)],
    [null],
  ])('rejects a reserved or invalid custom room: %p', (roomId) => {
    expect(normalizeCustomRoomId(roomId)).toBeNull();
  });

  it('normalizes a bounded custom room', () => {
    expect(normalizeCustomRoomId('  custom:project-alpha-1  ')).toBe(
      'custom:project-alpha-1',
    );
  });
});

type SocketEventHandler = (...args: unknown[]) => unknown;

const makeEventSocket = () => {
  const handlers = new Map<string, SocketEventHandler>();
  const rooms = new Set(['socket-id', `user:${USER_ID}`, 'role:admin']);
  const roomEmit = jest.fn();
  const socket = {
    id: 'socket-id',
    data: { user: { _id: USER_ID, role: 'admin' } },
    rooms,
    on: jest.fn((event: string, handler: SocketEventHandler) => {
      handlers.set(event, handler);
      return socket;
    }),
    emit: jest.fn(),
    join: jest.fn(async (roomId: string) => {
      rooms.add(roomId);
    }),
    leave: jest.fn(async (roomId: string) => {
      rooms.delete(roomId);
    }),
    to: jest.fn(() => ({ emit: roomEmit })),
  } as unknown as Socket;

  registerSocketEvents(socket);

  const invoke = async (event: string, ...args: unknown[]) => {
    const handler = handlers.get(event);
    if (!handler) throw new Error(`Missing handler for ${event}`);
    await handler(...args);
  };

  return { invoke, roomEmit, rooms, socket };
};

describe('Socket.IO custom room events', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('never lets a client join or leave a reserved identity room', async () => {
    const { invoke, socket } = makeEventSocket();

    await invoke('join-room', 'role:admin');
    await invoke('leave-room', `user:${USER_ID}`);

    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.leave).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(
      'socket-error',
      expect.objectContaining({ code: 'INVALID_SOCKET_EVENT' }),
    );
  });

  it('only sends bounded messages to a custom room the socket joined', async () => {
    const { invoke, roomEmit, socket } = makeEventSocket();

    await invoke('room-message', {
      roomId: 'custom:project-alpha',
      message: 'not joined',
    });
    expect(socket.to).not.toHaveBeenCalled();

    await invoke('join-room', 'custom:project-alpha');
    await invoke('room-message', {
      roomId: 'custom:project-alpha',
      message: '  hello  ',
    });

    expect(socket.to).toHaveBeenCalledWith('custom:project-alpha');
    expect(roomEmit).toHaveBeenCalledWith(
      'room-message',
      expect.objectContaining({ from: USER_ID, message: 'hello' }),
    );

    await invoke('room-message', {
      roomId: 'custom:project-alpha',
      message: 'x'.repeat(2001),
    });
    expect(roomEmit).toHaveBeenCalledTimes(1);
  });

  it('caps each connection at twenty custom rooms', async () => {
    const { invoke, socket } = makeEventSocket();

    for (let index = 0; index < 20; index += 1) {
      await invoke('join-room', `custom:project-${index}`);
    }
    await invoke('join-room', 'custom:project-overflow');

    expect(socket.join).toHaveBeenCalledTimes(20);
    expect(socket.emit).toHaveBeenLastCalledWith('socket-error', {
      event: 'join-room',
      code: 'INVALID_SOCKET_EVENT',
      message: 'Custom room limit reached',
    });
  });

  it('counts concurrent in-flight joins toward the room cap', async () => {
    const { invoke, socket } = makeEventSocket();
    const resolvers: Array<() => void> = [];
    (socket.join as jest.Mock).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvers.push(resolve);
        }),
    );

    const joins = Array.from({ length: 21 }, (_, index) =>
      invoke('join-room', `custom:parallel-${index}`),
    );

    expect(socket.join).toHaveBeenCalledTimes(20);
    expect(socket.emit).toHaveBeenCalledWith('socket-error', {
      event: 'join-room',
      code: 'INVALID_SOCKET_EVENT',
      message: 'Custom room limit reached',
    });

    resolvers.forEach((resolve) => resolve());
    await Promise.all(joins);
  });

  it('rate limits repeated custom events on a connection', async () => {
    const { invoke, socket } = makeEventSocket();

    for (let index = 0; index < 31; index += 1) {
      await invoke('room-message', null);
    }

    expect(socket.emit).toHaveBeenLastCalledWith('socket-error', {
      event: 'room-message',
      code: 'SOCKET_RATE_LIMITED',
      message: 'Too many socket events',
    });
  });
});
