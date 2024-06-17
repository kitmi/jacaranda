# Registry system

## Global runtime registry

```js
import { runtime } from '@kitmi/jacaranda';
import koaPassport from 'koa-passport';
import pg from 'pg';

runtime.loadModule('pg', pg);
runtime.loadModule('koa-passport', koaPassport);
```

## Module-specific registry

In the export default entries of each app modules.

```js
export default {
    ...,
    registry: {
        models,
        features: {
            ...features,
        },
        middlewares: appMiddlewares,
        controllers: {
            actions,
            resources,
        },
    },
};
```