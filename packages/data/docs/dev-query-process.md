# Query Process

## Relationship Info

- Select Table

```js
{
    'table1': {
        'table2$': [ field1, field2 ]
    },
    'table1$': [ field1, field2 ]
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
$select: [ 'field1', 'field2' ], // fields of main entity
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

        $select: [ 'field1', 'field2' ], // fields of this entity

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
