import {Router, Request, Response} from 'express';
import {MethodNotAllowed} from '@ianwremmel/typed-http-exceptions';

import {Action, normalActionMap, singletonActionMap} from './actions';
import {controllerComparator, validateIndexControllerNames} from './lib';
import {TypeNarrowingError} from './lib/type-narrowing-error';
import {applyFilters, BeforeActionList, AfterActionList} from './filters';

declare global {
  namespace Express {
    export type Services = Record<string, any>;

    interface Application {
      services?: Services;
    }
  }
}

export interface IControllerStatic {
  singleton?: boolean;
  new (req: Request, res: Response): IController;
  init(req: Request, res: Response): Promise<IController>;
}

export interface IController {
  // discriminator is here so that there's *something* for ResourceController to
  // actually implement so that typescript sees they're the same type.
  discriminator: true;
  beforeAction?: BeforeActionList;
  afterAction?: AfterActionList;
  index?: Action;
  new?: Action;
  create?: Action;
  show?: Action;
  edit?: Action;
  update?: Action;
  destroy?: Action;
}

export type ControllerPathMap = Map<string, IControllerStatic>;

const indexPattern = /index$/;

/**
 * Turns a set of controllers into an Express Router
 */
export function mountControllers(controllers: ControllerPathMap): Router {
  const router = Router();
  const filenames = Array.from(controllers.keys()).sort(controllerComparator);

  validateIndexControllerNames(filenames, controllers);

  for (const filename of filenames) {
    const mountPount = filename.replace(indexPattern, '');
    const Controller = controllers.get(filename);
    if (!Controller) {
      throw new TypeNarrowingError();
    }
    router.use(`/${mountPount}`, mountController(Controller));
  }
  return router;
}

/**
 * Turns a single controller into an Express Router.
 */
export function mountController(Controller: IControllerStatic): Router {
  const router = Router();

  const actionMap = Controller.singleton ? singletonActionMap : normalActionMap;

  for (const {action, segment, verb} of actionMap) {
    router[verb](segment, async (req, res, next) => {
      try {
        const controller = await Controller.init(req, res);
        const func = controller[action];
        // We'll check the instance instead of the prototype for `action` so
        // that Controllers may inherit or mixin other action sources
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
