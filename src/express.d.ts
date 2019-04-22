import 'connect-flash';
import 'express-session';

import {Logger} from './types';

declare global {
  namespace Express {
    export type Services = Record<string, any>;
    interface Response {
      logger?: Logger;
      user?: {};
    }

    interface Request {
      logger?: Logger;
      user?: {};
    }

    interface Application {
      services?: Services;
    }
  }
}
