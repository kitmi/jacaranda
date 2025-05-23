# Common Mistakes

## @kitmi/data

### Operation result

For historic compatibility reasons, all DB operations except `findOne_` return an object containing the result `data` and the `affectedRows`, while `findOne_` directly returns the result `data`. 

For examples:

- **findOne_**

```js
// find one
const targetApp = await UserAuthorizedApp.findOne_({
    $select: ['id'],
    $where: {
        user: user.id,
        app: appId,
    },
});
```

- **others**

```js
// updateOne_ with get updated
const { data: session } = await UserSession.updateOne_(..., { $getUpdated: true });

// findMany_
const { data: apps } = await App.findMany_({ $view: 'appListItem', $relation: ['users'], $where: where });

// findManyByPage_
const { data, totalCount } = await Project.findManyByPage_({ $view: 'listItem', $where: where }, page, records);
```

### Query options

- **$relation**: no tailing `s`
 
### Transactions

When an EntityModel is referenced within parallel loops, implicit transactions within the EntityModel can cause the EntityModel’s connection to be taken over by the transaction, thus affecting other parallel EntityModel references. The correct handling methods include:

1.	Always use db.entity('EntityName') to create a new EntityModel instance. This ensures that even if a dynamically created EntityModel within parallel logic becomes transactional, it won’t affect other parallel calls.
2.	It is recommended to avoid using implicit or explicit transactional calls within concurrency. Instead, convert parallel execution into sequential execution.

