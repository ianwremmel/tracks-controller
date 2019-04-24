import express, {Request, Response, NextFunction} from 'express';
import supertest from 'supertest';

import {ResourceController} from './resource-controller';
import {
  ControllerPathMap,
  IControllerStatic,
  mountControllers,
  IController,
} from './controllers';
import {RouteActionName, RouteVerb} from './actions';

describe('Controllers', () => {
  class MockCompleteController extends ResourceController {
    async index(req: express.Request, res: express.Response) {
      res
        .status(200)
        .send({controller: this.constructor.name, method: 'index'})
        .end();
    }
    async new(req: express.Request, res: express.Response) {
      res
        .status(200)
        .send({controller: this.constructor.name, method: 'new'})
        .end();
    }
    async create(req: express.Request, res: express.Response) {
      res
        .status(200)
        .send({controller: this.constructor.name, method: 'create'})
        .end();
    }
    async show(req: express.Request, res: express.Response) {
      res
        .status(200)
        .send({controller: this.constructor.name, method: 'show'})
        .end();
    }
    async edit(req: express.Request, res: express.Response) {
      res
        .status(200)
        .send({controller: this.constructor.name, method: 'edit'})
        .end();
    }
    async update(req: express.Request, res: express.Response) {
      res
        .status(200)
        .send({controller: this.constructor.name, method: 'update'})
        .end();
    }
    async destroy(req: express.Request, res: express.Response) {
      res
        .status(200)
        .send({controller: this.constructor.name, method: 'destroy'})
        .end();
    }
  }

  function makeTestBody(
    controllers: Map<string, IControllerStatic>,
    method: RouteVerb,
    path: string,
    expected: {controller: string; method: RouteActionName}
  ) {
    return () => {
      const app = express();
      app.use(mountControllers(controllers));
      return supertest(app)
        [method](path)
        .expect(200)
        .expect(expected);
    };
  }

  it('warns the consumer of controller collisions', () => {
    class NestedController extends ResourceController {}
    class NestedIndexController extends ResourceController {}

    const controllers: ControllerPathMap = new Map();
    controllers.set('nested', NestedController);
    controllers.set('nested/index', NestedIndexController);

    expect(() => mountControllers(controllers)).toThrow(
      `Attempted to register colliding controllers NestedController and NestedIndexController`
    );
  });

  describe('Singleton Resource', () => {
    class SingletonController extends MockCompleteController {
      static get singleton() {
        return true;
      }
    }

    const controllers: ControllerPathMap = new Map([
      ['singleton', SingletonController],
    ]);

    it(
      'routes GET /new to new',
      makeTestBody(controllers, 'get', '/singleton/new', {
        controller: 'SingletonController',
        method: 'new',
      })
    );
    it(
      'routes POST / to create',
      makeTestBody(controllers, 'post', '/singleton/', {
        controller: 'SingletonController',
        method: 'create',
      })
    );
    it(
      'routes GET / to show',
      makeTestBody(controllers, 'get', '/singleton/', {
        controller: 'SingletonController',
        method: 'show',
      })
    );
    it(
      'routes GET /edit to edit',
      makeTestBody(controllers, 'get', '/singleton/edit', {
        controller: 'SingletonController',
        method: 'edit',
      })
    );
    it(
      'routes PATCH / to update',
      makeTestBody(controllers, 'patch', '/singleton/', {
        controller: 'SingletonController',
        method: 'update',
      })
    );
    it(
      'routes PUT / to update',
      makeTestBody(controllers, 'put', '/singleton/', {
        controller: 'SingletonController',
        method: 'update',
      })
    );
    it(
      'routes DELETE / to destroy',
      makeTestBody(controllers, 'delete', '/singleton/', {
        controller: 'SingletonController',
        method: 'destroy',
      })
    );
  });

  describe('Routing', () => {
    class IndexController extends MockCompleteController {}
    class NotNestedController extends MockCompleteController {}
    class NestedController extends MockCompleteController {}
    class NestedIndexController extends MockCompleteController {}
    class NestedSiblingController extends MockCompleteController {}

    const commonControllers: ControllerPathMap = new Map([
      ['index', IndexController],
      ['not-nested', NotNestedController],
      ['nested', NestedController],
      // ['nested/index', NestedIndexController],
      ['nested/sibling', NestedSiblingController],
    ]);

    describe('IndexController', () => {
      it(
        'routes GET / to index',
        makeTestBody(commonControllers, 'get', '/', {
          controller: 'IndexController',
          method: 'index',
        })
      );
      it(
        'routes GET /new to new',
        makeTestBody(commonControllers, 'get', '/new', {
          controller: 'IndexController',
          method: 'new',
        })
      );
      it(
        'routes POST / to create',
        makeTestBody(commonControllers, 'post', '/', {
          controller: 'IndexController',
          method: 'create',
        })
      );
      it(
        'routes GET /:id to show',
        makeTestBody(commonControllers, 'get', '/1', {
          controller: 'IndexController',
          method: 'show',
        })
      );
      it(
        'routes GET /:id/edit to edit',
        makeTestBody(commonControllers, 'get', '/1/edit', {
          controller: 'IndexController',
          method: 'edit',
        })
      );
      it(
        'routes PATCH /:id to update',
        makeTestBody(commonControllers, 'patch', '/1', {
          controller: 'IndexController',
          method: 'update',
        })
      );
      it(
        'routes PUT /:id to update',
        makeTestBody(commonControllers, 'put', '/1', {
          controller: 'IndexController',
          method: 'update',
        })
      );
      it(
        'routes DELETE /:id to destroy',
        makeTestBody(commonControllers, 'delete', '/1', {
          controller: 'IndexController',
          method: 'destroy',
        })
      );
    });

    describe('NotNestedController()', () => {
      it(
        'routes GET /not-nested/ to index',
        makeTestBody(commonControllers, 'get', '/not-nested/', {
          controller: 'NotNestedController',
          method: 'index',
        })
      );
      it(
        'routes GET /not-nested/new to new',
        makeTestBody(commonControllers, 'get', '/not-nested/new', {
          controller: 'NotNestedController',
          method: 'new',
        })
      );
      it(
        'routes POST /not-nested/ to create',
        makeTestBody(commonControllers, 'post', '/not-nested/', {
          controller: 'NotNestedController',
          method: 'create',
        })
      );
      it(
        'routes GET /not-nested/:id to show',
        makeTestBody(commonControllers, 'get', '/not-nested/1', {
          controller: 'NotNestedController',
          method: 'show',
        })
      );
      it(
        'routes GET /not-nested/:id/edit to edit',
        makeTestBody(commonControllers, 'get', '/not-nested/1/edit', {
          controller: 'NotNestedController',
          method: 'edit',
        })
      );
      it(
        'routes PATCH /not-nested/:id to update',
        makeTestBody(commonControllers, 'patch', '/not-nested/1', {
          controller: 'NotNestedController',
          method: 'update',
        })
      );
      it(
        'routes PUT /not-nested/:id to update',
        makeTestBody(commonControllers, 'put', '/not-nested/1', {
          controller: 'NotNestedController',
          method: 'update',
        })
      );
      it(
        'routes DELETE /not-nested/:id to destroy',
        makeTestBody(commonControllers, 'delete', '/not-nested/1', {
          controller: 'NotNestedController',
          method: 'destroy',
        })
      );
    });

    describe('NestedController', () => {
      it(
        'routes /not-nested/ to index',
        makeTestBody(commonControllers, 'get', '/nested/', {
          controller: 'NestedController',
          method: 'index',
        })
      );
      it(
        'routes GET /nested/new to new',
        makeTestBody(commonControllers, 'get', '/nested/new', {
          controller: 'NestedController',
          method: 'new',
        })
      );
      it(
        'routes POST /nested/ to create',
        makeTestBody(commonControllers, 'post', '/nested/', {
          controller: 'NestedController',
          method: 'create',
        })
      );
      it(
        'routes GET /nested/:id to show',
        makeTestBody(commonControllers, 'get', '/nested/1', {
          controller: 'NestedController',
          method: 'show',
        })
      );
      it(
        'routes GET /nested/:id/edit to edit',
        makeTestBody(commonControllers, 'get', '/nested/1/edit', {
          controller: 'NestedController',
          method: 'edit',
        })
      );
      it(
        'routes PATCH /nested/:id to update',
        makeTestBody(commonControllers, 'patch', '/nested/1', {
          controller: 'NestedController',
          method: 'update',
        })
      );
      it(
        'routes PUT /nested/:id to update',
        makeTestBody(commonControllers, 'put', '/nested/1', {
          controller: 'NestedController',
          method: 'update',
        })
      );
      it(
        'routes DELETE /nested/:id to destroy',
        makeTestBody(commonControllers, 'delete', '/nested/1', {
          controller: 'NestedController',
          method: 'destroy',
        })
      );
    });

    describe('NestedSiblingController', () => {
      it(
        'routes GET /nested/sibling to index',
        makeTestBody(commonControllers, 'get', '/nested/sibling/', {
          controller: 'NestedSiblingController',
          method: 'index',
        })
      );
      it(
        'routes GET /nested/sibling/new to new',
        makeTestBody(commonControllers, 'get', '/nested/sibling/new', {
          controller: 'NestedSiblingController',
          method: 'new',
        })
      );
      it(
        'routes POST /nested/sibling/ to create',
        makeTestBody(commonControllers, 'post', '/nested/sibling/', {
          controller: 'NestedSiblingController',
          method: 'create',
        })
      );
      it(
        'routes GET /nested/sibling/:id to show',
        makeTestBody(commonControllers, 'get', '/nested/sibling/1', {
          controller: 'NestedSiblingController',
          method: 'show',
        })
      );
      it(
        'routes GET /nested/sibling/:id/edit to edit',
        makeTestBody(commonControllers, 'get', '/nested/sibling/1/edit', {
          controller: 'NestedSiblingController',
          method: 'edit',
        })
      );
      it(
        'routes PATCH /nested/sibling/:id to update',
        makeTestBody(commonControllers, 'patch', '/nested/sibling/1', {
          controller: 'NestedSiblingController',
          method: 'update',
        })
      );
      it(
        'routes PUT /nested/sibling/:id to update',
        makeTestBody(commonControllers, 'put', '/nested/sibling/1', {
          controller: 'NestedSiblingController',
          method: 'update',
        })
      );
      it(
        'routes DELETE /nested/sibling/:id to destroy',
        makeTestBody(commonControllers, 'delete', '/nested/sibling/1', {
          controller: 'NestedSiblingController',
          method: 'destroy',
        })
      );
    });
  });

  describe('filters', () => {
    describe('beforeFilter', () => {
      it('adds a single middleware before an action', () => {
        class FilteredController extends ResourceController
          implements IController {
          get beforeAction() {
            return [
              (req: Request, res: Response, next: NextFunction) => {
                res.write('a');
                next();
              },
            ];
          }
          async create(req: express.Request, res: express.Response) {
            res.write('b');
            res.end();
          }
        }

        const app = express();
        app.use(
          // the beforeAction doesn't get detected as a proper beforeAction,
          // but it is. The outside of tests, tsc won't have the chance to
          // complain to consumers
          // @ts-ignore
          mountControllers(new Map([['filtered', FilteredController]]))
        );
        return supertest(app)
          .post('/filtered')
          .expect(200)
          .expect('ab');
      });

      it('adds several middleware before an action', () => {
        class FilteredController extends ResourceController
          implements IController {
          get beforeAction() {
            return [
              (req: Request, res: Response, next: NextFunction) => {
                res.write('a');
                next();
              },
              (req: Request, res: Response, next: NextFunction) => {
                res.write('b');
                next();
              },
            ];
          }
          async create(req: express.Request, res: express.Response) {
            res.write('c');
            res.end();
          }
        }

        const app = express();
        app.use(
          // the beforeAction doesn't get detected as a proper beforeAction,
          // but it is. The outside of tests, tsc won't have the chance to

          // complain to consumers
          // @ts-ignore
          mountControllers(new Map([['filtered', FilteredController]]))
        );
        return supertest(app)
          .post('/filtered')
          .expect(200)
          .expect('abc');
      });
    });
  });
});
