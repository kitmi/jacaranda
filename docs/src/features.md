# Reflection-Based Features in `@kitmi/jacaranda`

The `@kitmi/jacaranda` framework is an advanced JavaScript application framework designed to facilitate the development of both command-line interface (CLI) and HTTP server applications. It is compatible with `node.js` and `bun.sh`, and offers the flexibility to choose between `koa.js` and `hono.js` for the HTTP engine, catering to the needs for stability and high performance respectively.

## Core Concepts

At the heart of `@kitmi/jacaranda` lies a reflection-based feature system coupled with a dependency-injection pattern. This design philosophy ensures modularity and a clear separation of concerns, which are essential for building scalable and maintainable applications.

### Reflection-Based Feature System

The framework treats each top-level node in the configuration file as a distinct feature. This approach allows developers to modularize their application by encapsulating specific functionalities within self-contained features. Each feature is responsible for a particular aspect of the application, such as configuration, logging, or internationalization.

Features in `@kitmi/jacaranda` are loaded in a specific order, following the stages of `Config`, `Initial`, `Services`, `Plugins`, and `Final`. This ordered loading is further refined by dependency relations declared among features, ensuring that dependencies are resolved before a feature is initialized. Topological sorting is employed to manage the loading sequence of features that share the same stage.

Moreover, the framework supports both built-in features and custom features placed under the application's features directory. This directory is configurable, allowing developers to structure their application as they see fit. Features can also declare their required npm packages, and the framework provides a script to install these dependencies using the developer's preferred package manager.

### Dependency Injection Pattern

`@kitmi/jacaranda` embraces dependency injection as a core pattern for managing feature dependencies. Each feature acts as an injected dependency, which can be consumed by other parts of the application. This pattern promotes loose coupling and high cohesion, making the application easier to test and maintain.

A feature can either register a service or extend the app prototype. Registering a service is the recommended approach as it aligns with the principles of dependency injection and service-oriented architecture. By registering services, features expose their functionalities to the rest of the application in a decoupled manner.

The service registry is a critical component of the dependency injection system. It maintains a registry of all available services, allowing features to declare their dependencies explicitly. When a feature requires a service, it retrieves the service instance from the registry, rather than creating a direct dependency. This approach simplifies the management of feature interactions and dependencies.
