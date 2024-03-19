# @kitmi/utils

## JavaScript Utility Library

`@kitmi/utils` is a JavaScript utility library delivering consistency, customization, performance, and extra features. It's built on top of lodash, providing a suppliment of functions for manipulating text, URLs, arrays, objects, and names.

## Features

-   _: universal lodash
-   lang: `sleep_`, `waitUntil_`, `pipeAsync_`, `Box`, `fxargs`, type checks, ...
-   array: `arrayToCsv`, `arrayToObject`, `zipAndFlat`, immutable operations, ...
-   object: `objectToArray`, `pushIntoBucket`, `remap`, `keyAt`, ...
-   collection: `findKey`, `batchAsync_`, `eachAsync_`, async collection operations, ...
-   string
    -   common text processing: `quote`, `unquote`, `unwrap`, ...
    -   naming: `camelCase`, `kebabCase`, `pascalCase`, `snakeCase`
    -   url: `join`, `appendQuery`, `objectToQueryString`, `queryStringToObject`

## Installation

To install `@kitmi/utils`, run the following command:

```bash
bun install @kitmi/utils
```

Or if you're using npm:

```bash
npm install @kitmi/utils
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
require('@kitmi/utils/testRegister');

(() => {}).should.throw(...);
```

### some difference between should and chai

```
// left: should, right: chai
should.be.true() => should.be.true
should.be.false() => should.be.false
should.be.ok() => should.be.ok
```
