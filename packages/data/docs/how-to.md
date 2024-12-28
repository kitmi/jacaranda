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
        $relation: [{ alias: 'anyNode', entity: 'tagCategoryTree', joinType: 'CROSS JOIN', on: null }],
        $upsert: { depth: xrCall('LEAST', xrCol('depth'), xrCol('EXCLUDED.depth')) },
    },
    {
        'ancestorId': 'ancestorId',
        'anyNode.descendantId': 'descendantId',
        '::depth': 'depth',
    }
);
// INSERT INTO "tagCategoryTree" ("ancestorId","descendantId","depth") SELECT A."ancestorId", anyNode."descendantId", ((A."depth" + anyNode."depth") + $1) AS "depth" FROM "tagCategoryTree" A , "tagCategoryTree" anyNode WHERE A."descendantId" = $2 AND anyNode."ancestorId" = $3 ON CONFLICT ("ancestorId","descendantId") DO UPDATE SET "depth" = LEAST("tagCategoryTree"."depth",EXCLUDED."depth")
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

## Custom join and group by through skipping orm

```js
const ret = await Video.findMany_({
    $select: [xrCall('COUNT', xrCol('rootDoc.taggings.tag.id'))],
    $relation: [
        'rootDoc.knowledges.knowledge.documents.document',
        'rootDoc.taggings.tag',
        {
            alias: 'course',
            entity: 'course',
            joinType: 'INNER JOIN',
            on: {
                'course.rootDoc': xrCol('rootDoc.knowledges.knowledge.documents.document.id'),
            },
        },
        'course.branches.branch.subject',
    ],
    $where: {
        'rootDoc.taggings.tag.id': { $in: [7, 8] },
        'course.branches.branch.subject.id': { $in: [1, 2] },
        'course.branches.branch.id': { $in: [1, 2] },
        'course.id': { $in: [1, 2] },
    },
    $groupBy: ['rootDoc.taggings.tag.id'],
    $skipOrm: true,
});
// SELECT COUNT(H."id") FROM "video" A LEFT JOIN "document" B ON A."rootDoc" = B."id" LEFT JOIN "documentKnowledge" C ON B."id" = C."document" LEFT JOIN "knowledgeChip" D ON C."knowledge" = D."id" LEFT JOIN "documentKnowledge" E ON D."id" = E."knowledge" LEFT JOIN "document" F ON E."document" = F."id" LEFT JOIN "documentTagging" G ON B."id" = G."entity" LEFT JOIN "tag" H ON G."tag" = H."id" INNER JOIN "course" course ON A."rootDoc" = F."id" LEFT JOIN "branchCourse" I ON course."id" = I."course" LEFT JOIN "subjectBranch" J ON I."branch" = J."id" LEFT JOIN "subject" K ON J."subject" = K."id" WHERE H."id" = ANY ($1) AND K."id" = ANY ($2) AND J."id" = ANY ($3) AND course."id" = ANY ($4) AND A."isDeleted" <> $5 GROUP BY H."id"
```

## UPDATE ... SET xxx = CASE WHEN EXISTS ... END

```js
const { affectedRows } = await UuidSequence.updateOne_(
    {
        status: {
            $case: {
                $when: { $expr: { $exist: xrDataSet(entity, { $select: [1], $where: { [field]: uuid } }) } },
                $then: 'used',
                $else: 'new',
            },
        },
    },
    {
        $where: {
            uuid,
            status: 'fetched',
        },
    }
);
// UPDATE "uuidSequence" SET "status" = CASE WHEN (EXISTS (SELECT 1 FROM "address" WHERE "ref" = $1 AND "isDeleted" <> $2)) THEN $3::uuidSequenceStatus ELSE $4::uuidSequenceStatus END WHERE "uuid" = $5 AND "status" = $6
```
