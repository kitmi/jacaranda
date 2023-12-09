# @kitmi/validators

## Dynamic Validator

`@kitmi/validators` is a comprehensive validation library designed to validate objects using a declarative syntax known as Jacaranda Object Modifiers Syntax (JOMS). It allows for dynamic validation strategies by using various types of modifiers that can be combined to form complex validation rules.

## Installation

To install `@kitmi/validators`, please use one of the following package managers:

### Using Bun:

```bash
bun install @kitmi/validators
```

### Using npm:

```bash
npm install @kitmi/validators
```

## Modifier Syntax

Modifiers in JOMS can be expressed in different formats, depending on whether they require arguments:

- Standalone Modifiers: These are simply strings that consist of a modifier prefix followed by the modifier's name.
  
- Modifiers with Arguments: These can be expressed either as objects or arrays:
  - Object Style:
    - `name`: Modifier name (e.g., `~mobile`)
    - `options`: Arguments for the modifier (e.g., `{ locale: 'en-US' }`)
  - Array Style:
    - Index 0: Modifier
    - Index 1: Modifier options argument

## Types of Modifiers

Modifiers are categorized based on their prefix:

- Validator (`~`): Validates the value.
- Processor (`|`): Transforms the value.
- Activator (`=`): Provides a default value if the current value is null.

## Modifier Handlers

Each type of modifier utilizes a different handler function with a specific signature:

- Validator Handler: `(value, options, meta, context) => [true/false, null/failed reason]`
  - A validator that returns false will halt the modifier pipeline and raise a `ValidationError`.

- Processor Handler: `(value, options, meta, context) => transformedValue`

- Activator Handler: `(options, meta, context) => defaultValue`
  - An activator is invoked only if the current value is null.

## Sample Usage

Here is an example demonstrating how to use `@kitmi/validators`:

```js
import validator from '@kitmi/validators';

const result = validator.sanitize(obj, {
    type: 'object',
    schema: {
        key1: {
            type: 'integer',
            mod: [
                ['~max', 30],
                ['~min', 10],
            ],
        },
        key2: {
            type: 'integer',
            mod: [
                ['~max', 20],
                ['~min', 10],
            ],
        },
    },
    optional: true,
    mod: [
        {
            name: '~jsv',
            options: {
                key1: {
                    $gt: '$$.key2',
                },
            },
        },
        [
            '|jsx',
            {
                $toArray: { name: '$$KEY', value: '$$CURRENT' },
            },
        ],
        '=default',
    ],
});

console.log(result);
// Output: [{ name: 'key1', value: 20 }, { name: 'key2', value: 15 }]
```

## Synchronous and Asynchronous Usage

### Synchronous Mode

```js
import validator, { Types } from '@kitmi/validators';

validator.addValidator('isEmail', () => [true/false, 'reason if false']);
validator.addProcessor('escape', () => {});
validator.addActivator('randomFill', () => {});
const sanitizedValue = validator.sanitize(obj, schema);
```

### Asynchronous Mode

```js
import validator, { Types } from '@kitmi/validators/async';

validator.addValidator('isEmail', async () => [true/false, 'reason if false']);
validator.addProcessor('escape', async () => {});
validator.addActivator('randomFill', async () => {});
const sanitizedValue = await validator.sanitize_(obj, schema);
```

### Including All Modifiers

For convenience, you can import versions of the library that include all built-in modifiers:

- Synchronous: `import validator from '@kitmi/validators/allSync';`
- Asynchronous: `import validator from '@kitmi/validators/allAsync';`

## License

This project is licensed under the MIT License.

Copyright (c) 2023 KITMI PTY LTD

Written by GPT-4