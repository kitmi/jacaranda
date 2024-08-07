# Jacaranda Bundle

- 蓝花楹全家桶
- Jacaranda is a monorepo for `@kitmi/jacaranda` JavaScript application framework & its relavant utility libraries.
- 70%+ of the documents are generated or modified by GPT-4. 

## Packages

- `@kitmi/jacaranda`
    - A rich-feature JavaScript CLI application and http server application framework with plugable features. It supports to run by both `node.js` and `bun.sh`, and switch between `koa.js` (stable) and `hono.js` (high performance) as the http engine freely.
    - See [Manual](https://kitmi.github.io/jacaranda/@kitmi/jacaranda/index.html)

- `@kitmi/validators`
    - A dynamic validation library designed to validate objects using a declarative syntax known as Jacaranda Object Modifiers Syntax (JOMS). It allows for dynamic validation strategies by using various types of modifiers that can be combined to form complex validation rules.
    - See [Manual](https://kitmi.github.io/jacaranda/@kitmi/validators/index.html)

- `@kitmi/tester`
    - A JavaScript unit test tool with in-server code coverage, benchmark, profiling, test report generation, async dump and etc.
    - See [Manual](https://kitmi.github.io/jacaranda/@kitmi/tester/index.html)

- `@kitmi/config`
    - This library provides a simple and flexible way to manage configuration settings for applications across different environments. It supports both JSON and YAML file formats and automatically selects the appropriate configuration based on the current environment. It also supports config values interpolation.
    - See [Manual](https://kitmi.github.io/jacaranda/@kitmi/config/index.html)

- `@kitmi/utils`
    - A JavaScript common utilities library that enhances lodash with additional functions for manipulating text, URLs, arrays, objects, and names.
    - See [Manual](https://kitmi.github.io/jacaranda/@kitmi/utils/index.html)

- `@kitmi/types`
    - This is a fundamental library that defines semantic data types with serialization, validation and sanitization. It also contains common errors definition.
    - See [Manual](https://kitmi.github.io/jacaranda/@kitmi/types/index.html)

- `@kitmi/sys`
    - This is a small collection of utility functions designed to interact with the local system using JavaScript. It is designed to work with both `node.js` and `bun.sh`.
    - See [Manual](https://kitmi.github.io/jacaranda/@kitmi/sys/index.html)

- `@kitmi/algo`
    - A lightweight JavaScript library for various algorithms and data structures, focusing on graph and tree operations. It provides efficient implementations of Breadth-First Search (BFS), Depth-First Search (DFS), Topological Sorting, Finite State Machines (FSM), and representations for graphs and trees, among other utilities.
    - See [Manual](https://kitmi.github.io/jacaranda/@kitmi/algo/index.html)

- `@kitmi/jsonv`
    - JSON Validation Syntax library
    - See [Manual](https://kitmi.github.io/jacaranda/@kitmi/jsonv/index.html)

- `@kitmi/jsonx`
    - JSON Expression Syntax library
    - See [Manual](https://kitmi.github.io/jacaranda/@kitmi/jsonx/index.html)

- `@kitmi/adapters`
    - This library provides a unified interface for interacting with various components that share similar functionalities but may have different underlying implementations or interfaces. By using this library, developers can switch between different components such as HTTP clients or JavaScript package managers without changing the consuming codebase, making the code more modular and easier to maintain. 
    - See [Manual](https://kitmi.github.io/jacaranda/@kitmi/adapters/index.html)

- `@kitmi/data`
    - This library is the data access layer of the Jacaranda Framework, designed to provide both ORM and non-ORM approaches for database interactions. It encapsulates SQL operations, connection pool management, and routine CRUD (Create, Read, Update, Delete) operations, ensuring efficient and scalable data handling. By offering a flexible and powerful API, @kitmi/data simplifies the complexities of database management, allowing developers to focus on building robust applications without worrying about underlying data access intricacies.
    - See [Manual](https://kitmi.github.io/jacaranda/data-manual.html)

## Command-lines

- `@kitmi/xeml`
  - Jacaranda data entity modeling tool
  - See [Manual](https://kitmi.github.io/jacaranda/@kitmi/xeml/index.html)

## License
- MIT
- Copyright (c) 2023 KITMI PTY LTD