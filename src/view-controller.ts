import _ from 'lodash';
import {InternalServerError, NotFound} from '@ianwremmel/typed-http-exceptions';
import {Request, Response} from 'express';

import {routify} from './lib/inerits';
import {ResourceController} from './resource-controller';

import {isRouteAction} from '.';

export class ViewController extends ResourceController {
  static async init(req: Request, res: Response) {
    const controller = new this(req, res);
    return new Proxy(controller, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);

        if (isRouteAction(prop)) {
          const viewName = `${routify(target.constructor.name)}/${prop}`;

          return async () => {
            if (!value) {
              throw new NotFound();
            }

            await value.call(target, req, res);

            if (res.headersSent) {
              return;
            }

            target.logger.info(`rendering ${viewName}`);
            target.res.render(viewName, {
              csrfToken: req.csrfToken(),
              isLoggedIn: !!req.user,
              messages: {
                error: req.flash('error') || [],
                info: req.flash('info') || [],
                success: req.flash('success') || [],
                warning: req.flash('warning') || [],
              },
            });
          };
        }

        return value;
      },
    });
  }

  get session() {
    if (!this.req.session) {
      throw new InternalServerError('Sessions are not supported on this route');
    }
    return this.req.session;
  }

  flash(msg: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') {
    if (!this.req.flash) {
      throw new InternalServerError(
        'flash messaging is not support on this route'
      );
    }
    this.req.flash(type, msg);
  }

  set(locals: Record<string, any>) {
    Object.assign(this.res.locals, locals);
  }

  redirect(controllerName: string) {
    this.res.redirect(`/${routify(controllerName)}`);
  }
}
