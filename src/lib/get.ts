import {TypeNarrowingError} from './type-narrowing-error';

/** Used in getters to make type inferrence work correctly */
export function get<IT extends Record<string, any>, T>(
  map: WeakMap<IT, T>,
  instance: IT
) {
  const ret = map.get(instance);
  if (!ret) {
    throw new TypeNarrowingError();
  }
  return ret;
}
