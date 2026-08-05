/* eslint-disable no-console */
import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import config from '../config/env';
import AppError from '../builder/app-error';
import handleCastError from '../errors/handle-cast-error';
import handleDuplicateError from '../errors/handle-duplicate-error';
import handleValidationError from '../errors/handle-validation-error';
import handleZodError from '../errors/handle-zod-error';
import { SystemLog } from '../modules/system-log/system-log.model';
import { TErrorSources } from '../types/error-response.type';

const error: ErrorRequestHandler = (error, req, res, _next) => {
  let status = 500;
  let message = 'Something went wrong!';
  let sources: TErrorSources = [
    {
      path: '',
      message: 'Something went wrong',
    },
  ];

  if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    status = simplifiedError?.status;
    message = simplifiedError?.message;
    sources = simplifiedError?.sources;
  } else if (error?.name === 'ValidationError') {
    const simplifiedError = handleValidationError(error);
    status = simplifiedError?.status;
    message = simplifiedError?.message;
    sources = simplifiedError?.sources;
  } else if (error?.name === 'CastError') {
    const simplifiedError = handleCastError(error);
    status = simplifiedError?.status;
    message = simplifiedError?.message;
    sources = simplifiedError?.sources;
  } else if (error?.code === 11000) {
    const simplifiedError = handleDuplicateError(error);
    status = simplifiedError?.status;
    message = simplifiedError?.message;
    sources = simplifiedError?.sources;
  } else if (error instanceof AppError) {
    status = error?.status;
    message = error.message;
    sources = [
      {
        path: '',
        message: error?.message,
      },
    ];
  } else if (error instanceof Error) {
    // Unknown/unexpected error. Log it server-side but never leak the raw
    // message (may contain internal details) to clients in production.
    if (config.node_env === 'development') {
      message = error.message;
      sources = [
        {
          path: '',
          message: error?.message,
        },
      ];
    } else {
      console.error('Unhandled error:', error);
    }
  }

  // Unexpected failures previously only reached the pm2 log, so nothing
  // surfaced them in the admin panel — a route could stay broken for days
  // before anyone noticed. Record 5xx only: 4xx is normal traffic (validation,
  // auth, not-found) and would drown the log. Fire-and-forget because
  // SystemLog.log swallows its own errors and must never delay the response.
  if (status >= 500) {
    // Belt and braces: this is the last line of defence in the request
    // pipeline, so writing the log must not be able to break it. The try
    // guards a synchronous throw and the .catch guards a rejected promise —
    // an unhandled rejection here could take the whole process down.
    try {
      Promise.resolve(
        SystemLog.log(
          'error',
          `${req.method} ${req.originalUrl} → ${status}: ${
            error instanceof Error ? error.message : String(error)
          }`.slice(0, 1000),
          req.user?.email,
          {
            status,
            method: req.method,
            path: req.originalUrl,
            name: error?.name,
            // Stack is the whole point of recording this; it stays
            // server-side and is only shown in the admin System Logs screen.
            stack:
              error instanceof Error ? error.stack?.slice(0, 4000) : undefined,
          },
        ),
      ).catch(() => {});
    } catch {
      // Losing a log entry is acceptable; losing the response is not.
    }
  }

  res.status(status).json({
    success: false,
    status,
    message,
    errorSources: sources,
    // Retained temporarily for backwards compatibility with existing clients.
    sources,
    // Never expose the raw error object or stack outside development.
    ...(config.node_env === 'development' && { error, stack: error?.stack }),
  });
  return;
};

export default error;
