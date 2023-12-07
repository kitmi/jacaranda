# @kit/types

## JavaScript Semantic Data Types

`@kit/types` defines semantic data types with validation and sanitization.

## Installation

To install `@kit/types`, run the following command:

```bash
bun install @kit/types
```

Or if you're using npm:

```bash
npm install @kit/types
```

## Conventions

### Type Interface

```
name: "type name",
alias: ["type alias"],
defaultValue: null,

sanitize: (value, meta, i18n, path) => sanitized,
serialize: (value, meta) => string
```

### Common Type Meta

-   {boolean} rawValue - Keep raw value, do not transform
-   {boolean} optional - No error throw if value is null and default is null
-   {any} default = Default value if value is null

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

## License
- MIT
- Copyright (c) 2023 KITMI PTY LTD