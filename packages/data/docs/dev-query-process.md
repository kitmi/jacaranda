# Query Process

## Relationship Info

- Select Table

```js
{
    '*': true,
    'table1': {
        'table2$': new Set([ field1, field2, { $xr } ])
    },
    'table1$': new Set([ field1, field2, { $xr } ])
}
```

- Order-by Table

```js
{
    'table1': {
        'table2$': [ { f, o, d } ]
    },
    'table1$': [ { f, o, d } ]
}
```

- Associatons Table

```js
$select: [ 'field1', 'field2', { $xr } ], // fields of main entity
$join: {
    rootDoc: {
        type: 'refersTo',
        entity: 'document',
        key: 'id',
        field: 'id',
        on: {
            rootDoc: {
                $xr: 'Column',
                name: 'rootDoc.id',
            },
        },

        $select: [ 'field1', 'field2', { $xr } ], // fields of this entity

        $join: {},

        $agg: { // list = true
            child: {

            }
        }

        $order: [ { f, o, d } ]
    },
},
$agg: { // list = true

}
$order: [ { f, o, d } ]
```
