import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import express, {Request, Response} from 'express';
import supertest from 'supertest';

import {ResourceController} from './resource-controller';
import {IControllerStatic} from './controllers';

import {mountControllers, ViewController} from '.';

describe('Controllers', () => {
  describe('ViewController', () => {
    it.todo(
      'automatically renders the corresponding view for the invoked actions'
    );
    it('applies CSURF to mutable actions', () => {
      const app = express();

      class VController extends ViewController {
        async index(req: Request, res: Response) {}
        async create(req: Request, res: Response) {}
      }

      const controllers: Map<string, IControllerStatic> = new Map([
        ['v', VController],
      ]);
      app.use(mountControllers(controllers));

      return supertest(app)
        .post('/v')
        .expect(403);
    });

    it('does not cause CSURF to be applied to non-ViewController resource controllers', () => {
      const app = express();

      class VController extends ViewController {
        async index(req: Request, res: Response) {}
      }

      class RController extends ResourceController {
        async create(req: Request, res: Response) {
          res.status(201).end();
        }
      }

      const controllers: Map<string, IControllerStatic> = new Map();
      controllers.set('r', RController);
      controllers.set('v', VController);

      app.use(mountControllers(controllers));

      return supertest(app)
        .post('/r')
        .expect(201);
    });
  });
});
