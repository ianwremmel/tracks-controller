import {NextFunction, Request, Response, RequestHandler} from 'express';

import {IController} from './controllers';
import {RouteActionName, actions} from './actions';

export interface AsyncStyleBeforeOrAfterFilter {
  (this: IController, req: Request, res: Response): Promise<void>;
}
export interface CallbackStyleBeforeOrAfterFilter {
  (this: IController, req: Request, res: Response, next: NextFunction): void;
}
export type BeforeOrAfterFilter =
  | CallbackStyleBeforeOrAfterFilter
  | AsyncStyleBeforeOrAfterFilter;

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

export async function applyFilters(
  filters: BeforeActionList | AfterActionList | undefined,
  action: RouteActionName,
  controller: IController,
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
        // @ts-expect-error
        await filter.call(controller, req, res);
      } else {
        await new Promise((resolve, reject) => {
          // @ts-expect-error typescript can't tell this is fine
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
