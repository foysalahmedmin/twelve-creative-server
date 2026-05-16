import { NextFunction, Request, Response } from 'express';
import mongoSanitize from 'mongo-sanitize';

const sanitize = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    const sanitized = mongoSanitize(req.body);
    // Directly reassigning req.body is usually safe in Express
    req.body = sanitized;
  }

  if (req.params && typeof req.params === 'object') {
    const sanitized = mongoSanitize(req.params);
    // params can be a getter in some versions/routers
    try {
      req.params = sanitized;
    } catch (_e) {
      Object.keys(req.params).forEach((key) => delete req.params[key]);
      Object.assign(req.params, sanitized);
    }
  }

  if (req.query && typeof req.query === 'object') {
    const sanitized = mongoSanitize(req.query);
    // query is a getter in Express 5 and cannot be reassigned directly
    try {
      (req as unknown as { query: unknown }).query = sanitized;
    } catch (_e) {
      Object.keys(req.query).forEach((key) => delete req.query[key]);
      Object.assign(req.query, sanitized);
    }
  }

  next();
};

export default sanitize;
