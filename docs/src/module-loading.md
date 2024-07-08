# @kitmi/jacaranda Module Loading Helper

## Overview

In the **Jacaranda Framework**, managing and loading modules can be complex, especially when dealing with different package management tools and the modular structure of projects. Modules might reside outside the project's working directory, creating challenges in locating and loading them efficiently. The `Module Loader Helper` in `Jacaranda` addresses these challenges by providing a unified way to load modules from various sources.

## Module Loader Helper

### Usage

The `loadModuleFrom_` function is the core utility provided by the **Jacaranda Framework** for loading modules. It supports various sources, ensuring that modules can be loaded from different locations as needed.

```js
import { loadModuleFrom_ } from '@kitmi/jacaranda';

const moduleToLoad = await loadModuleFrom_(app, source, moduleName, payloadPath);

// source can be 'runtime', 'registry', 'direct', 'project'
```

### Parameters

- `app`: The current application instance.
- `source`: The source from which the module should be loaded. It can be one of 'runtime', 'registry', 'direct', or 'project'.
- `moduleName`: The name of the module to load.
- `payloadPath`: The path to the module's payload, if applicable.

## From Different Sources

### runtime

Load module from the [Global Runtime Registry](https://kitmi.github.io/jacaranda/registry.html#global-runtime-registry).

Server calls `runtime.loadModule` during bootstrapping to inject the module instance into the **global runtime registry**.

```js
runtime.loadModule('<module-full-path>', module);
```

### registry

Load module from the [App Module Specific Registry](https://kitmi.github.io/jacaranda/registry.html#module-specific-registry).

The app module itself preloads module instances into the app's own registry in the module entry file.

```js
export default {
    ...,

    registry: {
        ...,        
    },
};
```

### direct

Load module directly by calling `require` with `esmCheck`.

### project

Load module from the project's working path.
