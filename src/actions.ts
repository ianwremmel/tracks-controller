import {Request, Response} from 'express';

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

export interface Action {
  (req: Request, res: Response): Promise<void>;
}

export const actions = normalActionMap.map(({action}) => action);

export function isRouteAction(raw: any): raw is RouteActionName {
  return actions.includes(raw);
}
