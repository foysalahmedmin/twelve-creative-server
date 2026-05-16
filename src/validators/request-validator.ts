import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { AnyZodObject, ZodError } from 'zod';

const validateRequest =
  (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next({
          statusCode: httpStatus.BAD_REQUEST,
          message: error.errors.map((e) => e.message).join(', '),
          errors: error.errors,
        });
      } else {
        next(error);
      }
    }
  };

export default validateRequest;
