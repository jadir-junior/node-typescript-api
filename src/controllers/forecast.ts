import { ClassMiddleware, Controller, Get } from '@overnightjs/core';
import { Request, Response } from 'express';

import { BaseController } from '.';
import { Beach } from '@src/models/beach';
import { Forecast } from '@src/services/forecast';
import { authMiddleware } from '@src/middlewares/auth';
import logger from '@src/logger';

const forecast = new Forecast();
@Controller('forecast')
@ClassMiddleware(authMiddleware)
export class ForecastController extends BaseController {
  @Get('')
  public async getForecastForLoggedUser(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const beaches = await Beach.find({ user: req.decoded?.id });
      const forecastData = await forecast.processsForecastForBeaches(beaches);
      res.status(200).send(forecastData);
    } catch (error) {
      logger.error(error);
      this.sendErrorResponse(res, {
        code: 500,
        message: 'Something went wrong',
      });
    }
  }
}
