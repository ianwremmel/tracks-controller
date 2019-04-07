import 'connect-flash';
import 'express-session';

export interface Logger {
  error: LogMethod;
  warn: LogMethod;
  info: LogMethod;
  debug: LogMethod;
  child?: (meta: Record<string, any>) => Logger;
}

export type LogMethod = typeof console.log;

declare global {
  namespace Express {
    interface Response {
      logger?: Logger;
      user?: {};
    }

    interface Request {
      logger?: Logger;
      user?: {};
    }

    interface Application {
      services?: Record<string, any>;
    }
  }
}
