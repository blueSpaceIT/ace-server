import { NextFunction, Request, Response } from 'express';
import { ZodObject } from 'zod';

const validateRequest =
  (schema: ZodObject) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        cookies: req.cookies,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      next(error);
    }
  };

export default validateRequest;
