# @kitmi/jsonv

## JSON Validation (JSV) Syntax

The JSON Validation Syntax is a specification for validating JSON-like data structures. It allows users to define validation rules using a JSON-like syntax and provides mechanisms to validate data against these rules. This document outlines the syntax rules used for validation within the JSV framework.

## Installation

To install `@kitmi/jsonv`, run the following command:

```bash
bun install @kitmi/jsonv
```

Or if you're using npm:

```bash
npm install @kitmi/jsonv
```
## Syntax Rules

### Basic Validation

- **Equality (`$eq` or `$equal`)**: Checks if the value is equal to the specified value.
- **Inequality (`$ne` or `$neq` or `$notEqual`)**: Checks if the value is not equal to the specified value.
- **Greater Than (`$gt` or `$greaterThan`)**: Checks if the value is greater than the specified value.
- **Greater Than or Equal (`$gte` or `$greaterThanOrEqual` or `$min`)**: Checks if the value is greater than or equal to the specified value.
- **Less Than (`$lt` or `$lessThan`)**: Checks if the value is less than the specified value.
- **Less Than or Equal (`$lte` or `$lessThanOrEqual` or `$max`)**: Checks if the value is less than or equal to the specified value.
- **Exists (`$exists`)**: Checks if the value exists (is not null or undefined).
- **Required (`$required`)**: Checks if the value is present and not null or undefined.

### Advanced Validation

- **Match (`$match`)**: Validates the value against all specified validation rules.
- **Match Any (`$any` or `$or` or `$either`)**: Validates the value against any of the specified validation rules.
- **All Match (`$allMatch` or `|>$all` or `|>$match`)**: Checks if all elements in an array satisfy the specified validation rule.
- **Any One Match (`$anyOneMatch` or `|*$any` or `|*$match` or `|*$either`)**: Checks if at least one element in an array satisfies the specified validation rule.
- **Type (`$typeOf`)**: Checks if the value is of the specified type.
- **Has Keys (`$hasKey` or `$hasKeys`)**: Checks if the object has all the specified keys.
- **Start With (`$startWith` or `$startsWith`)**: Checks if the string value starts with the specified substring.
- **End With (`$endWith` or `$endsWith`)**: Checks if the string value ends with the specified substring.
- **Match Pattern (`$pattern` or `$matchPattern` or `$matchRegex`)**: Checks if the string value matches the specified regular expression pattern.
- **Contains (`$contain` or `$contains`)**: Checks if the string value contains the specified substring.
- **Same As (`$sameAs`)**: Checks if the value is the same as the value of the specified field in the parent object.

### Special Cases

- **Validation with `null`**: Invoking `Jsv.match(value, null)` will always return `true`. It means the jsv is null, nothing to validate. To explicitly match `null`, use `{ $exist: false }`.
- **Validation with Array**: Using `Jsv.match(value, [ ... ])` will validate the value against all JSV objects in the array. To check for equality with an array, use `{ $eq: [ ... ] }`. To check whether the value matches one of the element in the array, use `{ $in: [ ... ] }`.

### Context Variables

- **`$$`**: Represents the root value being validated.
- **`$$C`**: Represents the current value being validated.
- **`$$P`**: Represents the parent object of the current value being validated.
- **`$$K`**: Represents the current key being validated.
- **`$$E`**: Represents the error during validation.

### Validation Options

- **`throwError`**: If set to `true`, throws an error when validation fails.
- **`abortEarly`**: If set to `true`, stops validation on the first failure.
- **`plainError`**: If set to `true`, returns a plain error message instead of an error object.
- **`asPredicate`**: If set to `true`, returns a boolean result instead of throwing an error or returning an error message.

## Usage Examples

```js
// Validate that 'key1' is greater than 1000
Jsv.match(obj, { key1: { $gt: 1000 } });

// Validate that 'key4' does not exist
Jsv.match(obj, { key4: { $exists: false } });

// Validate that 'key8' has all specified keys: 'name', 'type'
Jsv.match(obj, { key8: { $hasKeys: [ 'name', 'type' ] } });
```

Note that the JSV framework is designed to be extensible and can be customized with additional validation rules and operators as needed. The syntax rules outlined in this document represent the core set of validation capabilities provided by the JSV framework.

## License
- MIT
- Copyright (c) 2023 KITMI PTY LTD