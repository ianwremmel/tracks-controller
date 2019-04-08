import {Request, Response} from 'express';
import {
  InternalServerError,
  Unauthorized,
} from '@ianwremmel/typed-http-exceptions';

import {get} from './lib/get';
import {ResourceControllerInstance, Logger} from './types';

const requests: WeakMap<ResourceController, Request> = new WeakMap();

const responses: WeakMap<ResourceController, Response> = new WeakMap();

export class ResourceController implements ResourceControllerInstance {
  /** @ignore - this is just here make the typescript compiler happy */
  get discriminator() {
    return true;
  }
  constructor(req: Request, res: Response) {
    requests.set(this, req);
    responses.set(this, res);
  }

  static async init(req: Request, res: Response) {
    return new this(req, res);
  }

  static get singleton(): boolean {
    return false;
  }

  get logger(): Logger | typeof console {
    return this.req.logger || console;
  }

  get req() {
    return get(requests, this);
  }

  get res() {
    return get(responses, this);
  }

  get services() {
    const srvcs = this.req.app.services;
    if (!srvcs) {
      throw new InternalServerError(
        'Services have not been configured for this app'
      );
    }
    return srvcs;
  }

  get user(): {} {
    if (!this.req.user) {
      throw new Unauthorized();
    }
    return this.req.user;
  }
}
