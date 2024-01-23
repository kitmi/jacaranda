# @kitmi/jsonx

JSON Expression Syntax

## Installation

To install `@kitmi/jsonx`, run the following command:

```bash
bun install @kitmi/jsonx
```

Or if you're using npm:

```bash
npm install @kitmi/jsonx
```

## Rules

-   Each jsx object can only has one $operator at a level

## Usages

-   $size

```js
Jsx.evaluate([1, 2, 3], '$size'); // 3
```

-   $sum

```js
Jsx.evaluate([1, 2, 3], '$sum'); // 1+2+3 = 6
```

-   $type

```js
Jsx.evaluate([1, 2, 3], '$type'); // array
```

-   $findIndex, $findKey

```js
Jsx.evaluate([1, 2, 3], { $findIndex: { $eq: 2 } }); // 1
Jsx.evaluate(
    {
        key1: 10,
        key2: 20,
        key3: 30,
    },
    { $findKey: { $eq: 20 } }
); // 'key2'

// from index
Jsx.evaluate([1, 2, 2], { $findIndex: [{ $eq: 2 }, 2] }); // 2
```

-   $find

```js
Jsx.evaluate([1, 3, 2], { $find: { $and: [{ $gt: 1 }, { $lt: 3 }] } }); // 2
Jsx.evaluate(
    {
        key1: 10,
        key2: 20,
        key3: 30,
    },
    { $find: { $gt: 15 } }
); // 20

// from expr as index
Jsx.evaluate(
    {
        key1: 1,
        key2: 3,
        key3: 4,

        startFrom: 2,
    },
    { $find: [{ $gt: 1 }, { $expr: '$root.startFrom' }] }
); // 4
```

-   $if

```js
let obj = {
    key1: 1.11,
};

// $if: [ <condition-jsx>, <then-jsx>, <else-jsx> ]
Jsx.evaluate(obj, {
    $if: [{ $match: { key1: { $gt: 1 } } }, { $value: 'positive' }, { $value: 'non-positive' }],
}).should.be.eql('positive');

Jsx.evaluate(obj, {
    $if: [{ $match: { key1: { $gt: 2 } } }, { $value: 'positive' }, { $value: 'non-positive' }],
}).should.be.eql('non-positive');
```

-   $castArray

-   $add | $+, $sub | $-, $mul | $\*, $div | $/, $mod | $%, $pow | $^

```js
Jsx.evaluate(10, { $mul: { $expr: [{ $value: 10 }, { $add: 5 }] } }); // 150
Jsx.evaluate(10, { $mul: 15 }); // 150
```

-   $keys, $values, $pairs, $filterNull

-   $toArray

```js
Jsx.evaluate({ key: 'value' }, '$toArray'); // [{ name: 'key', value: 'value' }]
Jsx.evaluate({ key: 'value' }, { $toArray: { myKey: '$key', myValue: '$this' } }); // [{ myKey: 'key', myValue: 'value' }]
```

-   $pick, $omit, $group, $sort, $reverse

-   $concat, $join, $merge

-   $filter, $remap

-   $set | $value

-   $addItem | $append

```js
Jsx.evaluate([1, 2, 3], { $append: 4 }); // [1, 2, 3, 4]
Jsx.evaluate({ key1: 1 }, { $append: ['key2', 2] }); // { key1: 1, key2: 2 }
```

-   $assign

```js
Jsx.evaluate({ key1: 1 }, { $assign: { key2: 2 } }); // { key1: 1, key2: 2 }
Jsx.evaluate(
    {
        key1: 1,
        key2: 2,
    },
    {
        $assign: {
            key2: {
                $expr: {
                    $mul: 10,
                },
            },
        },
    }
); // { key1: 1, key2: 20 }
```

## Wrong usage

```javascript
// If you want to check if key1 is greater than 2, below usage is wrong
// The first element will return { key1: false } which is treated as true, it will throw an error to avoid mistaken usage
Jsx.evaluate(
    {
        key1: 1.5,
    },
    {
        $if: [{ key1: { $match: { $gt: 2 } } }, { $value: 'positive' }, { $value: 'non-positive' }],
    }
).should.be.eql('non-positive');

// Correct usage should be
Jsx.evaluate(
    {
        key1: 1.5,
    },
    {
        $if: [{ $match: { key1: { $gt: 2 } } }, { $value: 'positive' }, { $value: 'non-positive' }],
    }
).should.be.eql('non-positive');
```

## License

-   MIT
-   Copyright (c) 2023 KITMI PTY LTD
