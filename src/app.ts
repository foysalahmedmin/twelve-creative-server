import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import path from 'path';
import config from './config';
import { configureTrustProxy } from './config/trust-proxy';
import error from './middlewares/error.middleware';
import log from './middlewares/log.middleware';
import notfound from './middlewares/not-found.middleware';
import { globalRateLimiter } from './middlewares/rate-limit.middleware';
import sanitize from './middlewares/sanitize.middleware';
import { livenessHandler, readinessHandler } from './routes/health.route';
import router from './routes';

dotenv.config();
const app: Application = express();

// The production topology has exactly one reverse-proxy hop (Nginx). Keep the
// application port private so forwarded client IPs/protocols can only come
// through that trusted hop.
configureTrustProxy(app);

// CORS must be first so preflight OPTIONS requests are handled before any other middleware
app.use(
  cors({
    origin: [
      config.url,
      config.adminpanel_url,
      config.website_url,
      ...config.cors_origins,
    ]?.filter(Boolean),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  }),
);

app.use(helmet());

// Probes bypass application throttling so an unhealthy or heavily loaded
// instance reports its real state instead of an unrelated 429 response.
app.get('/health', livenessHandler);
app.get('/ready', readinessHandler);

// Apply global rate limiting
app.use(globalRateLimiter);

app.use(express.json({ limit: '1mb' }));

app.use(sanitize);

app.use(cookieParser());

app.use(
  session({
    name: 'tc.sid',
    secret: config.session_secret,
    resave: false,
    saveUninitialized: false,
    ...(config.node_env === 'production' && {
      proxy: true,
      store: MongoStore.create({
        mongoUrl: config.database_url,
        ttl: 60 * 60 * 24 * 30,
        touchAfter: 24 * 60 * 60,
        autoRemove: 'native',
      }),
    }),
    cookie: {
      secure: config.node_env === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  }),
);

// Log request middleware
app.use(log);

// API routes
app.use('/api', router);

// Root endpoint
app.get('/', (_req, res) => {
  res.send('Welcome to TwelveCreative API');
});

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(notfound);
app.use(error);

export default app;
