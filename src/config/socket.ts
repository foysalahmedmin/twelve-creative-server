import { createAdapter } from '@socket.io/redis-adapter';
import http from 'http';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Server as IOServer, Socket } from 'socket.io';
import config from './env';
import { pubClient, subClient } from './redis';
import { User } from '../modules/user/user.model';
import { TJwtPayload, TRole } from '../types/jsonwebtoken.type';
import { extractAuthorizationToken } from '../utils/authorization-token';

export let io: IOServer;

const SOCKET_PATH = '/socket.io';
const ADMIN_ACCESS_COOKIE = 'tc_admin_access';
const MAX_CUSTOM_ROOMS = 20;
const MAX_ROOM_ID_LENGTH = 64;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_CUSTOM_EVENTS_PER_WINDOW = 30;
const CUSTOM_EVENT_WINDOW_MS = 10_000;
// Keep client-created rooms in a dedicated namespace so they can never
// collide with Socket.IO's private socket-id rooms or server identity rooms.
const CUSTOM_ROOM_PATTERN = /^custom:[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
const RESERVED_ROOM_PATTERN = /^(?:user|role):/i;

type TAuthenticatedSocketUser = TJwtPayload & {
  role: TRole;
  token_version: number;
  iat: number;
};

const configuredSocketOrigins = [
  config.url,
  config.adminpanel_url,
  config.website_url,
  ...config.cors_origins,
]
  .map((value) => normalizeOrigin(value))
  .filter((value): value is string => Boolean(value));

function normalizeOrigin(value?: string): string | undefined {
  if (!value?.trim()) return undefined;

  try {
    return new URL(value.trim()).origin;
  } catch {
    return undefined;
  }
}

export const isAllowedSocketOrigin = (
  origin: string | undefined,
  allowedOrigins: readonly string[] = configuredSocketOrigins,
): boolean => {
  // Native/server-to-server clients do not necessarily send an Origin header.
  // They must still authenticate in the Socket.IO namespace middleware below.
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  return Boolean(normalizedOrigin && allowedOrigins.includes(normalizedOrigin));
};

const getCookie = (
  cookieHeader: string | undefined,
  cookieName: string,
): string | undefined => {
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;

    const name = part.slice(0, separator).trim();
    if (name !== cookieName) continue;

    const value = part.slice(separator + 1).trim();
    if (!value) return undefined;

    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
  }

  return undefined;
};

export const resolveSocketAccessToken = (
  authToken: unknown,
  cookieHeader?: string,
): string | undefined => {
  // An explicitly supplied auth token takes precedence. If it is malformed,
  // reject it rather than silently falling back to another credential.
  if (authToken !== undefined) {
    return typeof authToken === 'string'
      ? extractAuthorizationToken(authToken)
      : undefined;
  }

  return getCookie(cookieHeader, ADMIN_ACCESS_COOKIE);
};

const verifyAccessToken = (token: string): TAuthenticatedSocketUser => {
  if (!config.jwt_access_secret) {
    throw new Error('Socket authentication is not configured');
  }

  const decoded = jwt.verify(token, config.jwt_access_secret, {
    algorithms: ['HS256'],
  });
  if (typeof decoded === 'string') {
    throw new Error('Invalid access token payload');
  }

  const payload = decoded as JwtPayload & TJwtPayload;
  if (
    typeof payload._id !== 'string' ||
    !payload._id ||
    (payload.role !== 'admin' && payload.role !== 'editor') ||
    typeof payload.token_version !== 'number' ||
    typeof payload.iat !== 'number'
  ) {
    throw new Error('Invalid access token payload');
  }

  return payload as TAuthenticatedSocketUser;
};

export const authenticateSocket = async (
  socket: Pick<Socket, 'handshake' | 'data'>,
): Promise<TAuthenticatedSocketUser> => {
  const token = resolveSocketAccessToken(
    socket.handshake.auth?.token,
    socket.handshake.headers.cookie,
  );
  if (!token) {
    throw new Error('Missing access token');
  }

  const decoded = verifyAccessToken(token);
  const user = await User.isUserExist(decoded._id);

  if (!user || user.is_deleted || user.status === 'blocked') {
    throw new Error('User is not allowed to connect');
  }

  if (
    typeof user.token_version !== 'number' ||
    decoded.token_version !== user.token_version
  ) {
    throw new Error('Session has been invalidated');
  }

  if (decoded.role !== user.role) {
    throw new Error('User role has changed');
  }

  if (user.password_changed_at) {
    const passwordChangedAt = Math.floor(
      new Date(user.password_changed_at).getTime() / 1000,
    );
    if (passwordChangedAt > decoded.iat) {
      throw new Error('Password has changed since token issuance');
    }
  }

  const authenticatedUser: TAuthenticatedSocketUser = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    is_verified: user.is_verified,
    token_version: user.token_version,
    iat: decoded.iat,
  };

  socket.data.user = authenticatedUser;
  return authenticatedUser;
};

export const normalizeCustomRoomId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;

  const roomId = value.trim();
  if (
    !roomId ||
    roomId.length > MAX_ROOM_ID_LENGTH ||
    RESERVED_ROOM_PATTERN.test(roomId) ||
    !CUSTOM_ROOM_PATTERN.test(roomId)
  ) {
    return null;
  }

  return roomId;
};

// Initialize Socket.io server
export const initializeSocket = async (
  server: http.Server,
): Promise<IOServer> => {
  try {
    // Create Socket.io server
    io = new IOServer(server, {
      cors: {
        origin: configuredSocketOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: SOCKET_PATH,
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1_000_000,
      allowRequest: (request, callback) => {
        callback(null, isAllowedSocketOrigin(request.headers.origin));
      },
    });

    // Setup Redis adapter if available
    await setupRedisAdapter();

    // Setup authentication middleware
    setupAuthMiddleware();

    // Setup connection handlers
    setupConnectionHandlers();

    console.log(`🔌 Socket.io initialized - PID: ${process.pid}`);
    return io;
  } catch (error) {
    console.error('❌ Socket.io initialization failed:', error);
    throw error;
  }
};

// Setup Redis adapter for clustering
const setupRedisAdapter = async (): Promise<void> => {
  try {
    if (!config.redis_enabled) {
      console.log('🔕 Redis disabled by configuration');
      return;
    }

    if (pubClient && subClient && pubClient.isOpen && subClient.isOpen) {
      io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Socket.io Redis adapter enabled (clustering support)');
    } else {
      console.log(
        'ℹ️ Socket.io running in single-instance mode (Redis unavailable)',
      );
    }
  } catch (error) {
    console.warn(
      '⚠️ Redis adapter setup failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    console.log('ℹ️ Socket.io running in single-instance mode');
  }
};

// Setup authentication middleware
const setupAuthMiddleware = (): void => {
  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);
      console.log(
        `🔐 Authenticated socket connection: ${socket.id} (User: ${user._id})`,
      );
      next();
    } catch (error) {
      console.warn(
        `🔒 Socket authentication rejected: ${socket.id}`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      next(new Error('Authentication failed'));
    }
  });
};

// Setup connection event handlers
const setupConnectionHandlers = (): void => {
  io.on('connection', (socket: Socket) => {
    void handleConnection(socket);
  });
};

// Handle individual socket connections
const handleConnection = async (socket: Socket): Promise<void> => {
  const user = socket.data.user as TAuthenticatedSocketUser;

  try {
    // These are the only reserved rooms a client can join. Both values come
    // from the current database-backed identity, never from a client event.
    await Promise.all([
      socket.join(`user:${user._id}`),
      socket.join(`role:${user.role}`),
    ]);
    console.log(
      `✅ User joined rooms - Socket: ${socket.id}, User: ${user._id}, Role: ${user.role}`,
    );
  } catch (error) {
    console.warn(
      `Failed to join canonical rooms for socket ${socket.id}:`,
      error,
    );
    socket.disconnect(true);
    return;
  }

  // Handle custom events
  registerSocketEvents(socket);

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`❌ Socket error: ${socket.id}`, error);
  });
};

// Setup custom socket event handlers
export const registerSocketEvents = (socket: Socket): void => {
  const customRooms = new Set<string>();
  const pendingRoomJoins = new Map<string, Promise<void>>();
  let eventWindowStartedAt = Date.now();
  let eventsInWindow = 0;

  const emitValidationError = (event: string, message: string): void => {
    socket.emit('socket-error', {
      event,
      code: 'INVALID_SOCKET_EVENT',
      message,
    });
  };

  const consumeEventQuota = (event: string): boolean => {
    const now = Date.now();
    if (now - eventWindowStartedAt >= CUSTOM_EVENT_WINDOW_MS) {
      eventWindowStartedAt = now;
      eventsInWindow = 0;
    }

    eventsInWindow += 1;
    if (eventsInWindow <= MAX_CUSTOM_EVENTS_PER_WINDOW) return true;

    socket.emit('socket-error', {
      event,
      code: 'SOCKET_RATE_LIMITED',
      message: 'Too many socket events',
    });
    return false;
  };

  socket.on('join-room', async (value: unknown) => {
    if (!consumeEventQuota('join-room')) return;

    const roomId = normalizeCustomRoomId(value);
    if (!roomId) {
      emitValidationError('join-room', 'Invalid custom room');
      return;
    }

    if (customRooms.has(roomId)) {
      socket.emit('room-joined', roomId);
      return;
    }

    const existingJoin = pendingRoomJoins.get(roomId);
    if (existingJoin) {
      try {
        await existingJoin;
        if (customRooms.has(roomId)) socket.emit('room-joined', roomId);
      } catch {
        emitValidationError('join-room', 'Could not join custom room');
      }
      return;
    }

    // Count in-flight joins as reservations. Without this, a burst of async
    // joins can all pass the cap before the adapter resolves any one of them.
    if (customRooms.size + pendingRoomJoins.size >= MAX_CUSTOM_ROOMS) {
      emitValidationError('join-room', 'Custom room limit reached');
      return;
    }

    let joinPromise: Promise<void>;
    try {
      joinPromise = Promise.resolve(socket.join(roomId));
      pendingRoomJoins.set(roomId, joinPromise);
      await joinPromise;
      customRooms.add(roomId);
      socket.emit('room-joined', roomId);
      console.log(`📡 Socket ${socket.id} joined room: ${roomId}`);
    } catch (error) {
      console.warn(`Failed to join socket room ${roomId}:`, error);
      emitValidationError('join-room', 'Could not join custom room');
    } finally {
      pendingRoomJoins.delete(roomId);
    }
  });

  socket.on('leave-room', async (value: unknown) => {
    if (!consumeEventQuota('leave-room')) return;

    const roomId = normalizeCustomRoomId(value);
    if (!roomId || !customRooms.has(roomId) || !socket.rooms.has(roomId)) {
      emitValidationError('leave-room', 'Socket is not in this custom room');
      return;
    }

    try {
      await socket.leave(roomId);
      customRooms.delete(roomId);
      socket.emit('room-left', roomId);
      console.log(`📡 Socket ${socket.id} left room: ${roomId}`);
    } catch (error) {
      console.warn(`Failed to leave socket room ${roomId}:`, error);
      emitValidationError('leave-room', 'Could not leave custom room');
    }
  });

  socket.on('room-message', (data: unknown) => {
    if (!consumeEventQuota('room-message')) return;

    if (!data || typeof data !== 'object') {
      emitValidationError('room-message', 'Invalid message payload');
      return;
    }

    const candidate = data as { roomId?: unknown; message?: unknown };
    const roomId = normalizeCustomRoomId(candidate.roomId);
    const message =
      typeof candidate.message === 'string' ? candidate.message.trim() : '';

    if (
      !roomId ||
      !message ||
      message.length > MAX_MESSAGE_LENGTH ||
      !customRooms.has(roomId) ||
      !socket.rooms.has(roomId)
    ) {
      emitValidationError(
        'room-message',
        'Message or custom room membership is invalid',
      );
      return;
    }

    socket.to(roomId).emit('room-message', {
      from: socket.data.user._id,
      message,
      timestamp: new Date().toISOString(),
    });
  });
};

// Utility functions for emitting events

// Emit to specific user
export const emitToUser = (
  userId: string,
  event: string,
  data: unknown,
): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Emit to users with specific role
export const emitToRole = (
  role: string,
  event: string,
  data: unknown,
): void => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

// Emit to custom room
export const emitToRoom = (
  roomId: string,
  event: string,
  data: unknown,
): void => {
  if (io) {
    io.to(roomId).emit(event, data);
  }
};

// Broadcast to all connected clients
export const broadcast = (event: string, data: unknown): void => {
  if (io) {
    io.emit(event, data);
  }
};

// Get Socket.io instance (throws if not initialized)
export const getIO = (): IOServer => {
  if (!io) {
    throw new Error(
      'Socket.io not initialized. Call initializeSocket() first.',
    );
  }
  return io;
};

// Get connection count
export const getConnectionCount = async (): Promise<number> => {
  if (!io) return 0;

  try {
    const sockets = await io.fetchSockets();
    return sockets.length;
  } catch (error) {
    console.warn('⚠️ Failed to get connection count:', error);
    return 0;
  }
};

// Close all connections gracefully
export const closeConnections = async (): Promise<void> => {
  if (io) {
    console.log('🔌 Closing all socket connections...');

    try {
      const sockets = await io.fetchSockets();
      console.log(`📊 Closing ${sockets.length} active connections`);

      // Emit shutdown notice to all clients
      io.emit('server-shutdown', { message: 'Server is shutting down' });

      // Close server
      io.close();
      console.log('✅ Socket.io server closed');
    } catch (error) {
      console.warn('⚠️ Error closing socket connections:', error);
    }
  }
};
