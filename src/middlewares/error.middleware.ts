/* eslint-disable no-console */
import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import config from '../config/env';
import AppError from '../builder/app-error';
import handleCastError from '../errors/handle-cast-error';
import handleDuplicateError from '../errors/handle-duplicate-error';
import handleValidationError from '../errors/handle-validation-error';
import handleZodError from '../errors/handle-zod-error';
import { TErrorSources } from '../types/error-response.type';

const error: ErrorRequestHandler = (error, _req, res, _next) => {
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
