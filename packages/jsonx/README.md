# @kit/jsonx

JSON Expression Syntax

## Installation

To install `@kit/jsonx`, run the following command:

```bash
bun install @kit/jsonx
```

Or if you're using npm:

```bash
npm install @kit/jsonx
```

## Rules

-   Each jxs object can only has one $operator at a level

## Wrong usage

```javascript
// If you want to check if key1 is greater than 2, below usage is wrong
// The first element will return { key1: false } which is treated as true, thus the result will be 'positive'
Jxs.evaluate(
    {
        key1: 1.5,
    },
    {
        $if: [{ key1: { $match: { $gt: 2 } } }, { $value: 'positive' }, { $value: 'non-positive' }],
    }
).should.be.eql('non-positive');

// Correct usage should be
Jxs.evaluate(
    {
        key1: 1.5,
    },
    {
        $if: [{ $match: { key1: { $gt: 2 } } }, { $value: 'positive' }, { $value: 'non-positive' }],
    }
).should.be.eql('non-positive');
```

## License
- MIT
- Copyright (c) 2023 KITMI PTY LTD