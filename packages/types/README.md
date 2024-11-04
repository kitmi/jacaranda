# @kitmi/types

## JavaScript Semantic Data Types

`@kitmi/types` defines semantic data types with validation and sanitization.

## Installation

To install `@kitmi/types`, run the following command:

```bash
bun install @kitmi/types
```

Or if you're using npm:

```bash
npm install @kitmi/types
```

## Conventions

### Types

- any
- array
- bigint
- binary
- boolean
- datetime
- integer
- number
- object
- text

### Type Interface

```
name: "type name",
alias: ["type alias"],
defaultValue: null,

sanitize: (value, meta, i18n, context) => sanitized,
serialize: (value, meta) => string
```

### Common Type Meta

-   {boolean} plain - Keep raw value, don't try to type cast before post processing
-   {boolean} optional - No error throw if value is null and default is null
-   {any} default - Default value if value is null
-   {array} enum - An array of values which the value of a enumerable type should be one of it

### Enumerable Types

-   bigint
-   integer
-   number
-   text

### Validation Error

-   message
-   status = 400
-   code = E_INVALID_DATA
-   info = { value, meta, [i18n], [path] }

### Plugins

-   datetimeParser
-   bigintWriter
-   preProcess - [sync/async] (value, meta, opts: { rawValue, i18n, path }) => [ finished, processedValue ] or [ false ]
-   postProcess - [sync/async] (value, meta, opts: { rawValue, i18n, path }) => processedValue

Note: if preProcess or postProcess is async function, sanitize_ should be called instead of sanitize

See `@kitmi/validators` for semantic validation. 

### Notes

- Object sanitization

Use `keepUnsanitized` for keeping those entries not defined in the object schema.

## License
- MIT
- Copyright (c) 2023 KITMI PTY LTD