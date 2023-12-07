# @kit/utils

## JavaScript Utility Library

`@kit/utils` is a JavaScript utility library delivering consistency, customization, performance, and extra features. It's built on top of lodash, providing a suppliment of functions for manipulating text, URLs, arrays, objects, and names.

## Features

-   _: universal lodash
-   lang: `sleep_`, `waitUntil_`, `pipeAsync_`, type checks, ...
-   array: `arrayToCsv`, `arrayToObject`, `zipAndFlat`, immutable operations, ...
-   object: `objectToArray`, `pushIntoBucket`, `remap`, ...
-   collection: `findKey`, `batchAsync_`, `eachAsync_`, async collection operations, ...
-   string
    -   common text processing: `quote`, `unquote`, `unwrap`, ...
    -   naming: `camelCase`, `kebabCase`, `pascalCase`, `snakeCase`
    -   url: `join`, `appendQuery`, `objectToQueryString`, `queryStringToObject`

## Installation

To install `@kit/utils`, run the following command:

```bash
bun install @kit/utils
```

Or if you're using npm:

```bash
npm install @kit/utils
```

## License
- MIT
- Copyright (c) 2023 KITMI PTY LTD

## Test helper (not exposed in index)

### test register for adding missing should assertion helpers into chai

Add below lines in `.mocharc.js` after `@babel/register` or `@swc-node/register`

E.g.
```
require('@swc-node/register');
require('@kit/utils/testRegister');
```

### some difference between should and chai

```
// left: should, right: chai
should.be.true() => should.be.true
should.be.false() => should.be.false
should.be.ok() => should.be.ok
```
