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
const { data: apps } = await App.findMany_({ $view: 'appListItem', $relations: ['users'], $where: where });

// findManyByPage_
const { data, totalCount } = await Project.findManyByPage_({ $view: 'listItem', $where: where }, page, records);
```

### Query options

- **$relation**: no tailing `s`