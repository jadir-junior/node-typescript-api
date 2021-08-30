import './util/module-alias';

import * as OpenApiValidator from 'express-openapi-validator';
import * as database from '@src/database';
import * as http from 'http';

import express, { Application } from 'express';

import { BeachesController } from './controllers/beaches';
import { ForecastController } from './controllers/forecast';
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import { Server } from '@overnightjs/core';
import { UsersController } from './controllers/users';
import apiSchema from './api.schema.json';
import cors from 'cors';
import expressPino from 'express-pino-logger';
import logger from './logger';
import swaggerUi from 'swagger-ui-express';

export class SetupServer extends Server {
  private server?: http.Server;

  constructor(private port = 3000) {
    super();
  }

  public async init(): Promise<void> {
    this.setupExpress();
    await this.docsSetup();
    this.setupControllers();
    await this.databaseSetup();
  }

  private setupExpress(): void {
    this.app.use(express.json());
    this.app.use(
      expressPino({
        logger,
      })
    );
    this.app.use(
      cors({
        origin: '*',
      })
    );
  }

  private setupControllers(): void {
    const forecastController = new ForecastController();
    const beachesController = new BeachesController();
    const usersController = new UsersController();
    this.addControllers([
      forecastController,
      beachesController,
      usersController,
    ]);
  }

  private async docsSetup(): Promise<void> {
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(apiSchema));
    this.app.use(
      OpenApiValidator.middleware({
        apiSpec: apiSchema as OpenAPIV3.Document,
        validateRequests: true,
        validateResponses: true,
      })
    );
  }

  public getApp(): Application {
    return this.app;
  }

  private async databaseSetup(): Promise<void> {
    await database.connect();
  }

  public async close(): Promise<void> {
    await database.close();
    if (this.server) {
      await new Promise((resolve, reject) => {
        this.server?.close((err) => {
          if (err) {
            return reject(err);
          }

          resolve(true);
        });
      });
    }
  }

  public start(): void {
    this.server = this.app.listen(this.port, () => {
      logger.info('Server listing on port: ' + this.port);
    });
  }
}
