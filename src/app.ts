import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import path from 'path';
import config from './config';
import error from './middlewares/error.middleware';
import log from './middlewares/log.middleware';
import notfound from './middlewares/not-found.middleware';
import { globalRateLimiter } from './middlewares/rate-limit.middleware';
import sanitize from './middlewares/sanitize.middleware';
import router from './routes';

dotenv.config();
const app: Application = express();

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

// Apply global rate limiting
app.use(globalRateLimiter);

app.set('trust proxy', true);

app.use(express.json({ limit: '1mb' }));

app.use(sanitize);

app.use(cookieParser());

app.use(
  session({
    secret: config.session_secret,
    resave: false,
    saveUninitialized: false,
    // store: MongoStore.create({
    //   mongoUrl: config.database_url,
    //   ttl: 60 * 60 * 24 * 30,
    // }),
    cookie: {
      secure: config.node_env === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  }),
);

// Log request middleware
app.use(log);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api', router);

// Health check endpoint for Vercel
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static file serving for frontend (SPA)
app.use(express.static(path.join(__dirname, '../public/dist')));

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/dist/index.html'));
});

// Fallback for SPA routing - serves index.html for all unmatched routes
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, '../public/dist', 'index.html'));
});

// Error handling middleware
app.use(error);
app.use(notfound);

export default app;
