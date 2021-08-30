import ApiError, { APIError } from '@src/util/errors/api-error';

import { CUSTOM_VALIDATION } from '@src/models/user';
import { Error } from 'mongoose';
import { Response } from 'express';
import logger from '@src/logger';

export abstract class BaseController {
  protected sendCreateUpdateErrorResponse(
    res: Response,
    error: Error.ValidationError
  ): void {
    if (error instanceof Error.ValidationError) {
      const clientErrors = this.handleClientErrors(error);
      res.status(clientErrors.code).send(
        ApiError.format({
          code: clientErrors.code,
          message: clientErrors.error,
        })
      );
    } else {
      logger.error(error);
      res
        .status(500)
        .send(ApiError.format({ code: 500, message: 'Something went wrong' }));
    }
  }

  private handleClientErrors(error: Error.ValidationError): {
    code: number;
    error: string;
  } {
    const duplicatedKingErrors = Object.values(error.errors).filter((error) => {
      if (
        error instanceof Error.ValidatorError ||
        error instanceof Error.CastError
      ) {
        return error.kind === CUSTOM_VALIDATION.DUPLICATED;
      } else {
        return null;
      }
    });

    if (duplicatedKingErrors.length) {
      return { code: 409, error: error.message };
    }

    return { code: 400, error: error.message };
  }

  protected sendErrorResponse(res: Response, apiError: APIError): Response {
    return res.status(apiError.code).send(ApiError.format(apiError));
  }
}
