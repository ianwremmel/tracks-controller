export interface Logger {
  error: LogMethod;
  warn: LogMethod;
  info: LogMethod;
  debug: LogMethod;
  child?: (meta: Record<string, any>) => Logger;
}

export type LogMethod = typeof console.log;
