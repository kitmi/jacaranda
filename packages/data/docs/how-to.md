# @kitmi/data How-To

## INSERT INTO ... SELECT ...

```js
await ClosureTable.createFrom_(    
    {
        $select: [
            'ancestorId',
            'anyNode.descendantId',
            xrAlias(xrExpr(xrExpr(xrCol('depth'), '+', xrCol('anyNode.depth')), '+', 1), 'depth'),
        ],
        $where: { 'descendantId': parentId, 'anyNode.ancestorId': childId },
        $relation: [{ alias: 'anyNode', entity: 'tagCategoryTree', joinType: 'CROSS JOIN', on: null }], // on == null will make the join before directly from        
    }, {
        'ancestorId': 'ancestorId',
        'anyNode.descendantId': 'descendantId',
        '::depth': 'depth', // ::<column-name> means this an alias not a column of any existing table
    }
);
// INSERT INTO "tagCategoryTree" ("ancestorId","descendantId","depth") SELECT A."ancestorId", anyNode."descendantId", ((A."depth" + anyNode."depth") + $1) AS "depth" FROM "tagCategoryTree" A , "tagCategoryTree" anyNode WHERE A."descendantId" = $2 AND anyNode."ancestorId" = $3
```

## WHERE xxx IN (SELECT ...)

```js
await TagCategoryTree.deleteMany_({
    $where: {
        descendantId: {
            $in: xrDataSet(TagCategoryTree.meta.name, {
                $select: ['descendantId'],
                $where: { ancestorId: keyValue },
            }),
        },
    }
});
// DELETE FROM "tagCategoryTree" WHERE "descendantId" IN (SELECT "descendantId" FROM "tagCategoryTree" WHERE "ancestorId" = $1)
```

