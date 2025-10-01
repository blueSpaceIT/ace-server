import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../helpers/ApiError';
import catchAsync from '../shared/catchAsync';

export const parseBody = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    // Skip parsing if there's no data field (like in file uploads with no additional data)
    if (!req.body.data) {
      // If this is a file upload without additional data, just continue
      if (req.file) {
        return next();
      }

      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Please provide data in the body under data key',
      );
    }

    // Parse the data field if it exists
    req.body = JSON.parse(req.body.data);

    next();
  },
);
