import {Request, Response, RequestHandler} from 'express';

export interface Logger {
  error: LogMethod;
  warn: LogMethod;
  info: LogMethod;
  debug: LogMethod;
  child?: (meta: Record<string, any>) => Logger;
}

export type LogMethod = typeof console.log;

export type RouteActionName =
  | 'index'
  | 'new'
  | 'create'
  | 'show'
  | 'edit'
  | 'update'
  | 'update'
  | 'destroy';

export type RouteSegment = '/' | '/:id' | '/:id/edit' | '/edit' | '/new';
export type RouteVerb = 'delete' | 'get' | 'patch' | 'post' | 'put';

export interface RouteConfig {
  action: RouteActionName;
  segment: RouteSegment;
  verb: RouteVerb;
}

export interface BeforeOrAfterFilter {
  (this: ResourceControllerInstance, req: Request, res: Response): Promise<
    void
  >;
}

export interface FilterConfig {
  only: RouteActionName | RouteActionName[];
}

export type ConfiguredFilter<T> = [T, FilterConfig];
export interface MiddlewareFactory {
  (): RequestHandler;
}

export type FilterOrConfiguredFilter<T> = T | ConfiguredFilter<T>;

export type BeforeActionList = FilterOrConfiguredFilter<BeforeOrAfterFilter>[];

export type AfterActionList = FilterOrConfiguredFilter<BeforeOrAfterFilter>[];

export interface ResourceAction {
  (req: Request, res: Response): Promise<void>;
}

export interface ResourceControllerConstructor {
  singleton: boolean;
  /** @deprecated - use beforeAction/afterAction */
  middleware?: MiddlewareFactory[];
  new (req: Request, res: Response): ResourceControllerInstance;
  init(req: Request, res: Response): Promise<ResourceControllerInstance>;
}

export interface ResourceControllerInstance {
  /** @ignore - this is just here make the typescript compiler happy */
  discriminator: boolean;
  // before and after action should probably be static, but that presents a
  // number of typescript hurdles that I don't want to deal with right now.
  beforeAction?: BeforeActionList;
  afterAction?: AfterActionList;
  index?: ResourceAction;
  new?: ResourceAction;
  create?: ResourceAction;
  show?: ResourceAction;
  edit?: ResourceAction;
  update?: ResourceAction;
  destroy?: ResourceAction;
}
