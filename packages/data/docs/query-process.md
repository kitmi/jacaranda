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

- Sample

```js
{
  '$select': [],
  '$order': [ { o: 0, d: false, f: 'id' } ],
  '$agg': {
    asset: {
      entity: 'productAsset',
      key: 'id',
      on: {
        id: { '$xr': 'Column', name: 'asset.product' },
        'asset.isDeleted': { '$ne': true }
      },
      field: 'product',
      '$select': [],
      '$order': {
        resources: { 'resource$': [ { o: 1, d: true, f: 'id' } ] }
      },
      '$agg': {
        resources: {
          entity: 'productAssetResource',
          key: 'id',
          on: { id: { '$xr': 'Column', name: 'resources.productAsset' } },
          field: 'productAsset',
          list: true,
          assoc: 'resource',
          '$select': [ 'id' ],
          '$order': { 'resource$': [ { o: 1, d: true, f: 'id' } ] }
        }
      }
    },
    attributes: {
      entity: 'productAttribute',
      key: 'id',
      on: { id: { '$xr': 'Column', name: 'attributes.product' } },
      field: 'product',
      list: true,
      '$select': [ 'id' ]
    },
    variants: {
      entity: 'productVariant',
      key: 'id',
      on: {
        id: { '$xr': 'Column', name: 'variants.product' },
        'variants.isDeleted': { '$ne': true }
      },
      field: 'product',
      list: true,
      '$select': [ 'id' ],
      '$order': { 'variant$': [ { o: 2, d: true, f: 'id' } ] }
    }
  },
  '$join': {
    category: {
      type: 'belongsTo',
      entity: 'productCategory',
      key: 'id',
      field: 'id',
      on: { category: { '$xr': 'Column', name: 'category.id' } },
      '$select': [],
      '$agg': {
        attributeTypes: {
          entity: 'productCategoryAttributeType',
          key: 'id',
          on: { id: { '$xr': 'Column', name: 'attributeTypes.category' } },
          field: 'category',
          list: true,
          '$select': [ 'id' ]
        }
      }
    }
  }
};

{
  '$select': [],
  '$order': [ { o: 0, d: false, f: 'id' } ],
  '$agg': {
    asset: {
      entity: 'productAsset',
      key: 'id',
      on: {
        id: { '$xr': 'Column', name: 'asset.product' },
        'asset.isDeleted': { '$ne': true }
      },
      field: 'product',
      '$select': [ 'id' ],
      '$agg': {
        resources: {
          entity: 'productAssetResource',
          key: 'id',
          on: { id: { '$xr': 'Column', name: 'resources.productAsset' } },
          field: 'productAsset',
          list: true,
          assoc: 'resource',
          '$select': [ 'id', 'createdAt', 'productAsset', 'resource' ]
        }
      }
    },
    attributes: {
      entity: 'productAttribute',
      key: 'id',
      on: { id: { '$xr': 'Column', name: 'attributes.product' } },
      field: 'product',
      list: true,
      '$select': [ 'id', 'value', 'createdAt', 'updatedAt', 'product', 'type' ]
    },
    variants: {
      entity: 'productVariant',
      key: 'id',
      on: {
        id: { '$xr': 'Column', name: 'variants.product' },
        'variants.isDeleted': { '$ne': true }
      },
      field: 'product',
      list: true,
      '$select': []
    }
  },
  '$join': {
    category: {
      type: 'belongsTo',
      entity: 'productCategory',
      key: 'id',
      field: 'id',
      on: { category: { '$xr': 'Column', name: 'category.id' } },
      '$select': [ 'id' ],
      '$agg': {
        attributeTypes: {
          entity: 'productCategoryAttributeType',
          key: 'id',
          on: { id: { '$xr': 'Column', name: 'attributeTypes.category' } },
          field: 'category',
          list: true,
          '$select': [ 'id', 'createdAt', 'category', 'attributeType' ]
        }
      }
    }
  }
};
```