import { ForecastPoint, StormGlass } from '@src/clients/stormGlass';

import { Beach } from '@src/models/beach';
import { InternalError } from '@src/util/errors/internal-error';
import { Rating } from './rating';
import logger from '@src/logger';

export interface TimeForeCast {
  time: string;
  forecast: BeachForecast[];
}

export interface BeachForecast extends Omit<Beach, 'user'>, ForecastPoint {}

export class ForecastProcessingInternetError extends InternalError {
  constructor(message: string) {
    super(`Unexpected error during the forecast procesing: ${message}`);
  }
}

export class Forecast {
  constructor(
    protected stormGlass = new StormGlass(),
    protected RatingService: typeof Rating = Rating
  ) {}

  public async processForecastForBeaches(
    beaches: Beach[]
  ): Promise<TimeForeCast[]> {
    const pointsWithCorrectSources: BeachForecast[] = [];
    logger.info(`Preparing the forecast for ${beaches.length} beachs`);
    try {
      for (const beach of beaches) {
        const rating = new this.RatingService(beach);
        const points = await this.stormGlass.fetchPoints(beach.lat, beach.lng);
        const enrichedBeachData = this.enrichBeachData(points, beach, rating);
        pointsWithCorrectSources.push(...enrichedBeachData);
      }
      return this.mapForecastByTime(pointsWithCorrectSources);
    } catch (error) {
      logger.error(error);
      throw new ForecastProcessingInternetError(error.message);
    }
  }

  private mapForecastByTime(forecast: BeachForecast[]): TimeForeCast[] {
    const forecastByTime: TimeForeCast[] = [];
    for (const point of forecast) {
      const timePoint = forecastByTime.find((f) => f.time === point.time);
      if (timePoint) {
        timePoint.forecast.push(point);
      } else {
        forecastByTime.push({
          time: point.time,
          forecast: [point],
        });
      }
    }
    return forecastByTime;
  }

  private enrichBeachData(
    points: ForecastPoint[],
    beach: Beach,
    rating: Rating
  ): BeachForecast[] {
    return points.map((point) => ({
      ...{},
      ...{
        lat: beach.lat,
        lng: beach.lng,
        name: beach.name,
        position: beach.position,
        rating: rating.getRateForPoint(point),
      },
      ...point,
    }));
  }
}
