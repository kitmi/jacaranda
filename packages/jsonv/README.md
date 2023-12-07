# @kit/jsonv

JSON Validation Syntax

## Installation

To install `@kit/jsonv`, run the following command:

```bash
bun install @kit/jsonv
```

Or if you're using npm:

```bash
npm install @kit/jsonv
```

## Usage that requires special attention

-   `Jvs.match(value, null)` always return true

    It does not mean to match null, which should use `{ $exist: false }` instead.

-   `Jvs.match(value, [ ... ])` means to match all jvs object in the array

    It does not mean the value to be equal to the array, which should use `{ $eq: [ ... ] }` instead.

## License
- MIT
- Copyright (c) 2023 KITMI PTY LTD