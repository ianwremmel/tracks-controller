import assert from 'assert';
import path from 'path';

import express, {Router, RequestHandler, Request, Response} from 'express';
import glob from 'glob';
import {MethodNotAllowed} from '@ianwremmel/typed-http-exceptions';
import methodOverride from 'method-override';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';

import {controllerize, inherits} from './lib/inerits';
import {TypeNarrowingError} from './lib/type-narrowing-error';
import {
  RouteConfig,
  ResourceControllerConstructor,
  ResourceControllerInstance,
  RouteActionName,
  BeforeActionList,
  AfterActionList,
  FilterOrConfiguredFilter,
  ConfiguredFilter,
} from './types';
import {ViewController} from './view-controller';

export {ResourceController} from './resource-controller';
export {ViewController} from './view-controller';
export * from './types';

interface RouteMap {
  [key: string]: RouteMap | ResourceControllerConstructor;
}

export const normalActionMap: RouteConfig[] = [
  {action: 'index', segment: '/', verb: 'get'},
  {action: 'new', segment: '/new', verb: 'get'},
  {action: 'create', segment: '/', verb: 'post'},
  {action: 'show', segment: '/:id', verb: 'get'},
  {action: 'edit', segment: '/:id/edit', verb: 'get'},
  {action: 'update', segment: '/:id', verb: 'patch'},
  {action: 'update', segment: '/:id', verb: 'put'},
  {action: 'destroy', segment: '/:id', verb: 'delete'},
];

export const singletonActionMap: RouteConfig[] = [
  {action: 'new', segment: '/new', verb: 'get'},
  {action: 'create', segment: '/', verb: 'post'},
  {action: 'show', segment: '/', verb: 'get'},
  {action: 'edit', segment: '/edit', verb: 'get'},
  {action: 'update', segment: '/', verb: 'patch'},
  {action: 'update', segment: '/', verb: 'put'},
  {action: 'destroy', segment: '/', verb: 'delete'},
];

export const actions = normalActionMap.map(({action}) => action);

interface ConfigureOptions {
  extensions: string[];
  root: string;
}

export async function configure({
  extensions = ['js'],
  root,
}: ConfigureOptions): Promise<Router> {
  const initialMiddleware = [cookieParser(), csurf({cookie: true})];

  const router = express.Router();
  router.use(bodyParser.urlencoded());
  router.use(
    methodOverride((req) => {
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        const method = req.body._method;
        delete req.body._method;
        return method;
      }
    })
  );

  const controllers = loadControllers({extensions, root});
  router.use(mountControllers(controllers, initialMiddleware));

  return router;
}

export function isRouteAction(str: any): str is RouteActionName {
  return actions.includes(str);
}

function loadControllers({
  root,
  extensions,
}: {
  root: string;
  extensions: string[];
}) {
  let filenames: string[] = [];
  for (const extension of extensions) {
    // remove leading period, if it exists
    const ext = extension.replace(/^\./, '');
    filenames = filenames.concat(
      glob.sync(`**/*.${ext}`, {cwd: root}).map((f) => f.replace(`.${ext}`, ''))
    );
  }

  const controllers = new Map();
  for (const filename of filenames) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const controllerModule = require(path.join(root, filename));
    const Controller = controllerModule.default || controllerModule;
    assert.equal(Controller.name, controllerize(filename));
    controllers.set(filename, Controller);
  }
  return controllers;
}

type ControllerPathMap = Map<string, ResourceControllerConstructor>;

export function mountControllers(
  controllers: ControllerPathMap,
  initialMiddleware: RequestHandler[] = []
): Router {
  const router = express.Router();

  // Mount the leaf controllers first, then sort alphabetically
  const filenames = Array.from(controllers.keys()).sort((a, b) => {
    const alength = a.split('/').length;
    const blength = b.split('/').length;
    if (alength < blength) {
      return 1;
    }

    if (alength > blength) {
      return -1;
    }

    if (a.endsWith('index')) {
      return 1;
    }

    if (a > b) {
      return 1;
    }

    if (a < b) {
      return -1;
    }

    return 0;
  });

  filenames
    .filter((filename) => filename.endsWith('index') && filename !== 'index')
    .map((filename) => filename.replace(/\/index$/, ''))
    .forEach((filename) => {
      if (controllers.has(filename)) {
        const c = controllers.get(filename);
        if (!c) {
          throw new TypeNarrowingError();
        }
        const ic = controllers.get(path.join(filename, 'index'));
        if (!ic) {
          throw new TypeNarrowingError();
        }
        throw new Error(
          `Attempted to register colliding controllers ${c.name} and ${ic.name}`
        );
      }
    });

  for (const filename of filenames) {
    const mountPoint = filename.replace(/index$/, '');
    const Controller = controllers.get(filename);
    if (!Controller) {
      throw new TypeNarrowingError();
    }
    router.use(
      `/${mountPoint}`,
      mountController(
        Controller,
        inherits(Controller, ViewController) ? initialMiddleware : []
      )
    );
  }
  return router;
}

function mountController(
  Controller: ResourceControllerConstructor,
  initialMiddleware: RequestHandler[] = []
): Router {
  const router = express.Router();

  for (const middleware of initialMiddleware) {
    router.use(middleware);
  }

  for (const middleware of Controller.middleware || []) {
    router.use(middleware());
  }

  const actionMap = Controller.singleton ? singletonActionMap : normalActionMap;

  for (const {action, segment, verb} of actionMap) {
    router[verb](segment, async (req, res, next) => {
      try {
        // We'll check the instance instead of the prototype for `action` so
        // that Controllers may inherit or mixin other action sources
        const controller = await Controller.init(req, res);
        // this assignment is necessary for typescript to infer correctley after
        // the throw
        const func = controller[action];
        if (!func) {
          throw new MethodNotAllowed(verb);
        }

        await applyFilters(
          controller.beforeAction,
          action,
          controller,
          req,
          res
        );

        await func.call(controller, req, res);

        await applyFilters(
          controller.afterAction,
          action,
          controller,
          req,
          res
        );
      } catch (err) {
        next(err);
      }
    });
  }
  return router;
}

async function applyFilters(
  filters: BeforeActionList | AfterActionList | undefined,
  action: RouteActionName,
  controller: ResourceControllerInstance,
  req: Request,
  res: Response
) {
  if (!filters) {
    return;
  }
  for (const configured of filters) {
    const [filter, config] = parseFilter(configured);
    if (config.only.includes(action)) {
      if (filter.length === 2) {
        // tsc can't tell this is ok. maybe need a two different filter defs,
        // one for promises and one for callbacks plus a typeguard function
        // @ts-ignore
        await filter.call(controller, req, res);
      } else {
        await new Promise((resolve, reject) => {
          filter.call(controller, req, res, (err: Error) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });
        });
      }
    }
  }
}

function parseFilter<T>(
  filter: FilterOrConfiguredFilter<T>
): ConfiguredFilter<T> {
  if (Array.isArray(filter)) {
    return filter;
  }
  return [filter, {only: actions}];
}
