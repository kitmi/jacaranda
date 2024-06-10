# Entity Model

## Basic Usage

```js
    const db = app.db('db name'); // or app.db() for default db configured in app's settings
    // ctx.db is a shorthand of ctx.module.db, ctx.module is the app instance serving the request

    const User = db.entity('User'); // or db.entity('user') or db.User
    const user = await User.findOne_({ $where: { id: 1011 } });  // or await User.findOne_({ id: 1011 });

    // if id is the key of User, it can be called as below
    const user = await User.findOne_(1011);
    // ...
```

## CRUD Operations 

-   async findOne_(findOptions)
-   async findAll_(findOptions)
-   async create_(data, createOptions)
-   async updateOne_(data, updateOptions)
-   async upsertOne_(data, updateOptions)
-   async updateMany_(data, updateOptions)
-   async replaceOne_(data, updateOptions)
-   async deleteOne_(deleteOptions)
-   async deleteMany_(deleteOptions)
   


-   async cached_(key, associations)
-   async retryCreateOnDuplicate_(dataGenerator_, maxRery, createOptions, connOptions)
    - Regenerate creation data and try again if duplicate record exists
-   async ensureFields_(entityObject, fields)
    - Ensure the entity object containing required fields, if not, it will automatically fetched from db and return.

## Operation options

### common options

#### $fullResult

Return full db operation result which may includes fields & and operation status.

### findOptions

#### $select

- Select by dot-separated field name (syntax: [<association-name>.]<field-name>)

```javascript
$select: [
    '*',
    'offices.bookableResources.type'
]
// SELECT A.*, X.`type` ... JOIN `OfficeBookableResource` as X
```

Note: The output columns may have some automatically added fields especially keys of different layers for building the hierachy structure

- Select by function

```javascript
$select: [ { type: 'function', name: 'MAX', alias: 'max', args: ['order'] } ]
// SELECT MAX(`order`) as max
```

#### $relation

No trailing (s).

- Use anchor name as the relationship

```javascript
// use an anchor 
$relation [ 'profile', 'roles' ];
```

#### $variables 

Variables to interpolate into query condition, will be passed on to associated operation.

- session
- query

#### $features

Custom feature options override

#### $orderBy

Order by condition

#### $groupBy

Group by condition

```javascript
const numDeals = await this.findAll_({
    $projection: ["status", this.db.connector.queryCount(null, "status")],
    $query: {
        agent: agentId,
        $or_0: this.db.connector.nullOrIs("fellOver", false),
    },
    $groupBy: "status",
});

```

-   $offset
-   $limit
-   $totalCount - Returns total record count when used with $limit, should provide the distinct field name

    - Used without association or with reference association which only joins record, just use $totalCount: true
    ```javascript
        const { totalItems /* integer */, items /* array */ } = await findAll_({
            '$query': { template: 1 },
            '$association': [ 'template' ],
            '$orderBy': { createdAt: false },
            '$totalCount': true,
            '$limit': 5,
            '$offset': 0    
        });
    ```

    - Used without association which may joins multiple records, should specify a unqiue field for preventing from counting duplicate records brought by joining, **otherwise the returned totalItems may include duplicate records**
    ```javascript
        const { totalItems /* integer */, items /* array */ } = await findAll_({
            '$query': { template: 1 },
            '$association': [ 'tags.tag', 'template' ],
            '$orderBy': { createdAt: false },
            '$totalCount': 'id',
            '$limit': 5,
            '$offset': 0    
        });
    ```

-   $includeDeleted - {boolean}, for find only, include logical deleted records
-   $skipOrm - {boolean}
-   $objectMapper - {string} Object mapper , flat or hiarachy (not used yet)
-   $custom - User defined operation control data, used by user program only and will be passed on to associated operation

-   $retrieveActualUpdated - {findOptions|boolean}, for updateOne_ only, retrieve only when the row is actually updated
-   $retrieveNotUpdate - {findOptions|boolean}, for updateOne_ only, retrieve only when the row is not actually updated
-   

-   $retrieveExisting

-   $bypassReadOnly - Internal option, cannot be set by user
-   $physicalDeletion - {boolean}
-   $existing
-   $requireSplitColumns - {boolean}, for udpate only, will be auto set while input has function or expression
   
#### $skipUniqueCheck 

To skip unique check for $where object when performing `xxxOne_` operation. 

-   $toDictionary
-   $migration - {boolean}, set by migration program, will be passed on to associated operation
-   $upsert - {boolean|object}, for create_ only, insert or update on duplicate, pass object if insert extra data
-   $nestedKeyGetter - a getter function to transform the key of nested object, default as ':'+anchor for mysql
-   $skipFeatures - an array of features to skip
-   $skipModifiers - Skip field modifiers, usually set upon importing backup data which are exported from db and already been processed by modifiers before
   

#### $jsx - Transform results with jsx syntax before returning

```js
$jsx: {
    user: [ '$$CURRENT.:user', { $pick: [ 'email' ] } ],
    agency: [ '$$CURRENT.:agency', { $pick: [ 'name' ] } ]
}
```

-   $dryRun - for create only, 
-   $key - specify the primary key field of and main query table for complex SQL situation, e.g. pagination
#### $asArray

Return result as array, i.e. array mode.

#### $getFields

To return a fields array.

### createOptions

#### $ignore

If already exist (unique key conclicts), just ignore the operation.     

#### $upsert

If already exist (unique key conclicts), just update the record.     

#### $getCreated

### createOptions & updateOptions

#### $skipModifiers


#### $dryRun

Just do the entity pre-process and skip the actual db creation call.


## Static members

-   db - instance of the @genx/data/DbModel class
    -   app - The owner app (instance of @genx/app/ServiceContainer)
    -   connector - The driver-specific db connector
    -   driver - Getter for the dbms name, e.g. mysql or mongodb
    -   i18n - Internationalization
    -   model(name) - Getter for entity model
    -   entitiesOfType(subClass) - Get an array of entities with one of the subClasses as specified
    -   async retry_(closure(ok, failed), [times], [interval]) - Try several times (default: 3) to do a transaction in case rollbacked due to competition
    -   async doTransaction_(closure({connection}), errorHandler(error)) - Wrap a transaction block

```javascript
    // Model usage

  // inside a entity model
  let User = this.db.User;

  // inside a controll or anywhere the app instance is applicable
  let User = app.db('dbName').model('User');

  // call CRUD
  await User.create_(...);


  // Transaction
  return this.db.doTransaction_(async (connOpts) => {

      let ret = await this.sendToGroup_(senderId, group.id, msg, connOpts);
      await this.sendToGroup_(senderId, group.peer, msg, connOpts);

      return ret;
  });


  // Retry and transaction combination usage

  return this.db.retry_('transaction name for logging', async (ok, failed) => {
      return this.db.doTransaction_(async (connOpts) => {
          //...operations need to compute
          // result set

          return ok(result);
      }, failed);
  });

  // Use SQL expression

```

-   meta - Metadata about the enttiy

    -   name
    -   keyField
    -   schemaName
    -   fields
    -   features
    -   uniqueKeys
    -   indexes
    -   associations
    -   fieldDependencies

-   i18n - I18n object

## Customize entity model

Write a mixer for customizing a entity model

```javascript
module.exports = Base => class extends Base {
    static async getStreetTypes_() {
        const streetTypes = require('../../data/streetTypes.json');
        return streetTypes;
    }
};
```

### Triggers 

-   beforeCreate_
-   beforeUpdate_
-   beforeUpdateMany_
-   beforeDelete_
-   beforeDeleteMany_

-   afterCreate_
-   afterUpdate_
-   afterUpdateMany_
-   afterDelete_
-   afterDeleteMany_



## Helper methods

-   fieldSchema(fieldName, options), returns the field schema for input validation, options can be used to override the default auto generated schema
    - $addEnumValues, for enum values to add some fake value which not accepted by db but can be consumed by business logic, e.g. all, none
    - $orAsArray, accept an array of the specified type

```javascript
    // returns a schema object which can be used by @genx/data Types sanitizer
    Message.fieldSchema('type', { optional: true, default: 'info' });
```    

-   inputSchema(inputSetName, options), returns an input schema object 

-   assocFrom(extraArray, fields), returns a unique array combine the extraArray and the associations inferred from fields

-   getUniqueKeyValuePairsFrom(data)

-   getUniqueKeyFieldsFrom(data)


## Complex usage

### Using functions in projection

```javascript
{
    $projection: [
        News.meta.keyField,
        {
            type: 'function',
            name: 'ROW_NUMBER',
            alias: 'row_num',
            args: [], // ROW_NUMBER()
            over: {
                $partitionBy: 'reference',
                $orderBy: News.meta.keyField,
            }, // ROW_NUMBER() OVER(PARTITION BY `reference` ORDER BY id)
        },
    ]
}
```

### Using function as the value of a field to update

```javascript
const updated = await this.updateOne_({ // data to update
    score: Lang.$expr(Lang.$col('score'), '+', scoreDelta) // `score` = `score` + scoreDelta
}, { 
    $query: { // where
        id: opportunity.id 
    }, 
    $retrieveUpdated: true // select the updated record after update finished
}, connOpts);
```

### Using expressions in query

```javascript
const queryObj = {
    $query: {
        status: 'published',
        $and: [ // `reference` IS NOT NULL AND (TRIM(`reference`) != '')
            {
                reference: { $exist: true }
            },
            Lang.$expr(Lang.$func('TRIM', Lang.$col('reference')), '!=', '')
        ]
    },
    $orderBy: {
        createdAt: false
    }
};
```

## Connector options

-   insertIgnore - {boolean}, for create only
-   connection - for transactions, reused the transactional session
-   returnUpdated - return the exact updated rows id [supplement for retrieveUpdated]

### Connector

-   aggregate_ - [new feature] aggregation by pipeline of stages

MySQLConnector

```
const result = await connector.aggregate_('t3' /* table name of starting query */, [
    { // stage 0, select from t3
        $projection: [
            'c',
            {
                type: 'function',
                name: 'COUNT',
                alias: 'count',
                args: ['c'],
            },
        ],
        $groupBy: 'c',
    },
    { // stage 1, select from stage 0
        $projection: [
            'c',
            'count',
            {
                type: 'function',
                name: 'SUM',
                alias: 'cumulative',
                args: ['count'],
                over: {
                    $orderBy: 'c',
                },
            },
        ],
    },
]);
```

--- 

## operation context [for @genx/data dev only]

There are predefined context properties which can be accessed in an entity operation as listed below.

-   operation - 'create/retrieve/update/delete'
-   raw - Raw input data.
-   latest - Validated and sanitized data.
-   existing - Existing data from database.
-   i18n - I18n object.
-   connector - Existing connector for chained operation.
-   result - Operation result.
-   return - Data to return, if retrieveCreated or retrieveUpdated or retrieveDeleted is true, return will be the just create/updated/deleted data.
-   entities - Access other entity models in the same schema
-   schemas - Access other schema models in the same application
-   state - Current request state

## cascade creation / update

```
await EntityA.create_({
    key: 'value',
    ":children": [
        { childKey: 'keyValue1', ... },
        { childKey: 'keyValue2', ... }
    ],
    ":entityB": {
        key1: 'value1',
        key2: 'value2'
    },
    "@entityC:" {
        unikey: "a entity C id"
    }
});

//1. the above call will create a record of entity B
//2. then get the the id of entity C with a group of unique keys (1 or more field pairs) of entity C
//3. then create a record of entity A with a reference to the id of newly created entity B and the id of entity C fetched at step 2
//4. then create a list of children of entity A with a reference to entity A stored in each child records
```

## operation helper [for @genx/data dev only]

-   queryFunction
-   queryBinExpr
-   queryColumn

## operation execution sequence [for @genx/data dev only]

1. prepare query & context
2. sub-class before hooks
3. wrap in transaction-safe closure
4. pre-process data
5. features before hooks
6. driver-specific pre-process
7. execute the operation
8. driver-specific post-process
9. store query key
10. features after hooks
11. end transaction-safe closure
12. sub-class after hooks

# Types
## Sanitize Object
#### Example
```
const schema = {
    a: { type: 'text' },
    b: {
        type: 'array', elementSchema: {
        type: 'object',
        schema: {
            c: { type: 'text', optional: true },
            d: { type: 'text', optional: true },
            e: { validator:()=>{},convertor:()=>{}}
            }
        }
    }
}
```

## known issues

-   hierachy projection - The key field of each layer of the hierachy structure is required for deep populating the target object
-   retrieveCreated - The query for newly created maybe affected by parrallel updating
-   retrieveUpdated - The previous query maybe affected by parrallel updating
-   retrieveDeleted - The deleted returned may differ from actual deletion (when data changes between find and delete)

## change logs since Apr 2020

1. Add -1 for descent sorting for mysql connector, and now both false and -1 for ORDER BY DESC.
2. Support custom validator and convertor to object sanitize.
3. Add more runtime operator for database
4. Add non-kv-pair query support
5. Fix bugs
6. [15 Oct 2022] Fix incorrect number of records returned, when using limit, offset and counting on multiple joining