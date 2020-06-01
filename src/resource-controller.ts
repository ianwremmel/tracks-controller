import {Request, Response} from 'express';
import {
  InternalServerError,
  Unauthorized,
} from '@ianwremmel/typed-http-exceptions';

import {get} from './lib/get';
import {IController} from './controllers';

const requests: WeakMap<ResourceController, Request> = new WeakMap();

const responses: WeakMap<ResourceController, Response> = new WeakMap();

export class ResourceController implements IController {
  get discriminator(): true {
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

  get logger() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error I know logger isn't on request, that's why this falls back to
    // console
    return this.req.logger || console;
  }

  get req() {
    return get(requests, this);
  }

  get res() {
    return get(responses, this);
  }
}
