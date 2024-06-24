# Association Metadata

- Only `refersTo` and `belongsTo` has local field
- Only `refersTo` and `belongsTo` has a type in metadata

## refersTo

```js
createdBy: {            // local field name
    type: 'refersTo',   
    entity: 'admin',    // remote entity name
    key: 'id',          // remote entity key field
    field: 'id',        // remote referenced field
    on: {                               // join condition
        createdBy: {                    // local field name
            $xr: 'Column',              // is a column reference
            name: 'createdBy.id',       // <local-field> == <local-field-as-path>.id
        },
    },
}
```

## belongsTo

```js
category: {                         // local field name
    type: 'belongsTo',
    entity: 'productCategory',      // remote entity name
    key: 'id',                      // remote entity key field
    field: 'id',                    // remote referenced field
    on: {                           // join condition
        category: {                 // local field name
            $xr: 'Column',          // is a column reference
            name: 'category.id',    // <local-field> == <local-field-as-path>.id
        },
    }
}
```

## hasMany

```js
modules: { // propseudo local field (no actual field in this table), can be accessed via ":modules"
    entity: 'learningModule',               // remote entity name
    key: 'id',                              // remote entity key field
    on: {                                   // join condition
        'id': {                             // local field (reverse)
            $xr: 'Column',                  // is a column reference
            name: 'modules.course',         // <local-field> == <local-field-as-path>.course
        },
        'modules.isDeleted': {              // one more thing, 
            $ne: true,                      // ignore logically deleted records
        },
    },
    field: 'course',                        // remote referenced field
    list: true,                             // has many
}
```

## hasOne

```js
user: {
    entity: 'user',
    key: 'id',
    on: {
        'id': {
            $xr: 'Column',
            name: 'user.profile',
        },
        'user.status': {
            $ne: true,
        },
    },
    field: 'profile',           
}
```