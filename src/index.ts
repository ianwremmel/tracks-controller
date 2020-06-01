import assert from 'assert';
import path from 'path';

import express, {Router} from 'express';
import glob from 'glob';

import {mountControllers} from './controllers';
import {controllerize} from './lib/inerits';

export {ResourceController} from './resource-controller';
export {mountController, mountControllers} from './controllers';

interface ConfigureOptions {
  extensions: string[];
  root: string;
}

export async function configure({
  extensions = ['js'],
  root,
}: ConfigureOptions): Promise<Router> {
  const router = express.Router();
  const controllers = loadControllers({extensions, root});
  router.use(mountControllers(controllers));

  return router;
}

function loadControllers({
  root,
  extensions,
}: {
  root: string;
  extensions: string[];
}) {
  let filenames: string[] = [];
  for (const extension of extensions) {
    // remove leading period, if it exists
    const ext = extension.replace(/^\./, '');
    filenames = filenames.concat(
      glob.sync(`**/*.${ext}`, {cwd: root}).map((f) => f.replace(`.${ext}`, ''))
    );
  }

  const controllers = new Map();
  for (const filename of filenames) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const controllerModule = require(path.join(root, filename));
    const Controller = controllerModule.default || controllerModule;
    assert.equal(Controller.name, controllerize(filename));
    controllers.set(filename, Controller);
  }
  return controllers;
}
