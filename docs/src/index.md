# Jacaranda Bundle

- 蓝花楹全家桶
- Jacaranda is a monorepo for `@kitmi/jacaranda` JavaScript application framework & its relavant utility libraries.
- 70%+ of the documents are generated or modified by GPT-4. 

## Packages

- `@kitmi/jacaranda`
    - A rich-feature JavaScript CLI application and http server application framework with plugable features. It supports to run by both `node.js` and `bun.sh`, and switch between `koa.js` (stable) and `hono.js` (high performance) as the http engine freely.
    - See [Manual](@kitmi/jacaranda/index.html)

- `@kitmi/validators`
    - A dynamic validation library designed to validate objects using a declarative syntax known as Jacaranda Object Modifiers Syntax (JOMS). It allows for dynamic validation strategies by using various types of modifiers that can be combined to form complex validation rules.
    - See [Manual](@kitmi/validators/index.html)

- `@kitmi/tester`
    - A JavaScript unit test tool with in-server code coverage, benchmark, profiling, test report generation, async dump and etc.
    - See [Manual](@kitmi/tester/index.html)

- `@kitmi/config`
    - This library provides a simple and flexible way to manage configuration settings for applications across different environments. It supports both JSON and YAML file formats and automatically selects the appropriate configuration based on the current environment. It also supports config values interpolation.
    - See [Manual](@kitmi/config/index.html)

- `@kitmi/utils`
    - A JavaScript common utilities library that enhances lodash with additional functions for manipulating text, URLs, arrays, objects, and names.
    - See [Manual](@kitmi/utils/index.html)

- `@kitmi/types`
    - This is a fundamental library that defines semantic data types with serialization, validation and sanitization. It also contains common errors definition.
    - See [Manual](@kitmi/types/index.html)

- `@kitmi/sys`
    - This is a small collection of utility functions designed to interact with the local system using JavaScript. It is designed to work with both `node.js` and `bun.sh`.
    - See [Manual](@kitmi/sys/index.html)

- `@kitmi/algo`
    - A lightweight JavaScript library for various algorithms and data structures, focusing on graph and tree operations. It provides efficient implementations of Breadth-First Search (BFS), Depth-First Search (DFS), Topological Sorting, Finite State Machines (FSM), and representations for graphs and trees, among other utilities.
    - See [Manual](@kitmi/algo/index.html)

- `@kitmi/jsonv`
    - JSON Validation Syntax library
    - See [Manual](@kitmi/jsonv/index.html)

- `@kitmi/jsonx`
    - JSON Expression Syntax library
    - See [Manual](@kitmi/jsonx/index.html)

- `@kitmi/adapters`
    - This library provides a unified interface for interacting with various components that share similar functionalities but may have different underlying implementations or interfaces. By using this library, developers can switch between different components such as HTTP clients or JavaScript package managers without changing the consuming codebase, making the code more modular and easier to maintain. 
    - See [Manual](@kitmi/adapters/index.html)
