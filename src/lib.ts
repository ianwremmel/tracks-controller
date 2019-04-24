import path from 'path';

import {TypeNarrowingError} from './lib/type-narrowing-error';
import {ControllerPathMap} from './controllers';

export function controllerComparator(a: string, b: string) {
  const alength = a.split('/').length;
  const blength = b.split('/').length;
  if (alength < blength) {
    return 1;
  }

  if (alength > blength) {
    return -1;
  }

  if (a.endsWith('index')) {
    return 1;
  }

  if (a > b) {
    return 1;
  }

  if (a < b) {
    return -1;
  }

  return 0;
}

export function validateIndexControllerNames(
  filenames: string[],
  controllers: ControllerPathMap
) {
  filenames
    .filter((filename) => filename.endsWith('index') && filename !== 'index')
    .map((filename) => filename.replace(/\/index$/, ''))
    .forEach((filename) => {
      if (controllers.has(filename)) {
        const c = controllers.get(filename);
        if (!c) {
          throw new TypeNarrowingError();
        }
        const ic = controllers.get(path.join(filename, 'index'));
        if (!ic) {
          throw new TypeNarrowingError();
        }
        throw new Error(
          `Attempted to register colliding controllers ${c.name} and ${ic.name}`
        );
      }
    });
}
