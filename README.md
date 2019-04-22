# tracks-controller _(@ianwremmel/tracks-controller)_

<!-- (optional) Put banner here -->

<!-- PROJ: Badges Start -->

[![license](https://img.shields.io/github/license/ianwremmel/tracks-controller.svg)](https://github.com/ianwremmel/tracks-controller/blob/master/LICENSE)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![npm (scoped)](https://img.shields.io/npm/v/@ianwremmel/tracks-controller.svg)](https://www.npmjs.com/package/@ianwremmel/tracks-controller)
[![npm](https://img.shields.io/npm/dm/@ianwremmel/tracks-controller.svg)](https://www.npmjs.com/package/@ianwremmel/tracks-controller)

[![Dependabot badge](https://img.shields.io/badge/Dependabot-active-brightgreen.svg)](https://dependabot.com/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

[![CircleCI](https://circleci.com/gh/ianwremmel/tracks-controller.svg?style=svg)](https://circleci.com/gh/ianwremmel/tracks-controller)

<!-- PROJ: Badges End -->

> Add convention to you express routes

Inspired by
[ActionController](https://guides.rubyonrails.org/action_controller_overview.html),
this library provides the conventions that your express app's route config has
been missing.

One of the key selling points of Ruby on Rails in Convention over Configuration.
It holds strongs opinions and by doing so, if you follow the conventions, your
app will do things automatically. On the other hand, Express docs and tutorials
don't really hold any options at all on how to organize code; in fact, most
tutorials seem to rely on anonymous functions bound directly to routes.

At some point, your app will get too big to just wire anonymous functions to
routes. See [usage](#usage) for how `Controller` can help.

## Table of Contents

<!-- toc -->

-   [Install](#install)
-   [Usage](#usage)
-   [Maintainer](#maintainer)
-   [Contribute](#contribute)
-   [License](#license)

<!-- tocstop -->

## Install

```bash
npm install @ianwremmel/tracks-controller
```

### Typings

In order to grant access to application-specific logic without either a complex
factory pattern or `import`ing configured dependency, controllers assume the
express application has a `services` property that contains your app's
configured helpers. `services` is where you might put your database library,
initialized third-party clients, etc. `services` are any connectors that run for
the duration of the app and not a single request.

You can tell typescript what your services look like by creating a file like the
following and ensuring it's loaded by tsc. (Make sure to make it a `.d.ts` file)

```ts
declare namespace Express {
    export type Services = import('./path-to-my-service-defintion').Services;
}
```

> Typescript is weird. If your controllers don't need services, you'll still
> need to create a file like the one above, but you can just use
> `export type Services = never;` to disable it.

## Usage

This library exports a configuration function that asynchronously produces an
express router. Its `root` parameter points to the directory containing your
controllers

```js
import {configure as configureRouteControllers} from '@ianwremmel/tracks-controller';
import path from 'path';

// Take a look @ianwremmel/tracks-boot for a cleaner way to do async loading
(async function boot() {
    const app = express();
    app.use(
        '/',
        await configureRouteControllers({
            // extensions defaults to '.js', but you might want to incldue '.ts'
            // files, for example, if your dev setup does JIT compilation
            extensions: ['js'],
            root: path.join(__dirname, 'controllers'),
        })
    );

    app.listen(3000);
})();
```

Your controlers should inherit from `ResourceController` for API route or
`ViewController` for routes that serve views. In either case, they'll follow one
of the following routing tables.

Routing is taken directly from the
[rails conventions](https://guides.rubyonrails.org/routing.html#crud-verbs-and-actions).
Unlike rails, `Controller` doesn't let you provide a route config; everything is
routed based on file location.

| HTTP Verb | Path             | Controller#Action | Used for                                     |
| --------- | ---------------- | ----------------- | -------------------------------------------- |
| GET       | /photos          | photos#index      | display a list of all photos                 |
| GET       | /photos/new      | photos#new        | return an HTML form for creating a new photo |
| POST      | /photos          | photos#create     | create a new photo                           |
| GET       | /photos/:id      | photos#show       | display a specific photo                     |
| GET       | /photos/:id/edit | photos#edit       | return an HTML form for editing a photo      |
| PATCH/PUT | /photos/:id      | photos#update     | update a specific photo                      |
| DELETE    | /photos/:id      | photos#destroy    | delete a specific photo                      |

However, we do provide one convenince that rails doesn't. If you set
`Controller.singleton` to `true`, your controller will follow a different
routing table that makes sense for things like the current user's profile page.

Routing is taken directly from the
[rails conventions](https://guides.rubyonrails.org/routing.html#crud-verbs-and-actions).
Unlike rails, `Controller` doesn't let you provide a route config; everything is
routed based on file location.

| HTTP Verb | Path  | Controller#Action | Used for                                                   |
| --------- | ----- | ----------------- | ---------------------------------------------------------- |
| GET       | /new  | profile#new       | Return an HTML form for creating a new profile             |
| POST      | /     | profile#create    | Create a new profile                                       |
| GET       | /     | profile#show      | Display the current user's profile                         |
| GET       | /edit | profile#show      | Return an HTML form for editing the current user's profile |
| PATCH/PUT | /     | profile#update    | Update the current user's profile                          |
| DELETE    | /     | profile#destroy   | Delete the current user's profile                          |

To create a controller and automatically route to it, simply add a file at the
corresponding path location in your controllers directory and inherit from
`ResourceController`. Then, implement the above-mentioned methods to begin
serving pages.

> Your controller must be the default export and must be named according to its
> path: remove the slashes, make everything PascalCase, and put "Controller" on
> the end.

```js
/**
 * @file 'users/photos.js'
 */
import {ResourceController} from '@ianwremmel/tracks-controller';

export default UserPhotosController extends ResourceController() {
    async create(req, res) {
        // TODO something with the photo
        res.status.send(201).end
    }
}
```

## Maintainer

[Ian Remmel](https://github.com/ianwremmel)

## Contribute

PRs Welcome

## License

[MIT](LICENSE) &copy; [Ian Remmel](https://github.com/ianwremmel) 2019 until at
least now
