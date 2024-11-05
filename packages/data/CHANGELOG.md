# @kitmi/data

## 0.8.1

### Patch Changes

-   Add fromServer for db feature
-   Refine error message for using entity model

## 0.8.0

### Minor Changes

-   Add predefined dataset schema
-   Add view use

## 0.7.10

### Patch Changes

-   Fix sub-object mapping bug

## 0.7.9

### Patch Changes

-   Fix update many dependency check

## 0.7.8

### Patch Changes

-   Fix alias conflicts with reserved keywords

## 0.7.7

### Patch Changes

-   Fix bug directly using entity processor

## 0.7.6

### Patch Changes

-   Fix error info during dry run

## 0.7.5

### Patch Changes

-   Fix orm result overlapping bug

## 0.7.4

### Patch Changes

-   Add skipProcessor, skipValidator helpers

## 0.7.3

### Patch Changes

-   Fix $set error for string value

## 0.7.2

### Patch Changes

-   Refine $set operator for JSON type and array type

## 0.7.1

### Patch Changes

-   Add $upsert option for createFrom\_
-   Fix db.transaction\_ bug.

## 0.7.0

### Minor Changes

-   Add $countBy operator
-   Add findManyByPage\_ method
-   Add createMany\_ method for directly inserting multiple records

## 0.6.4

### Patch Changes

-   Add get, set operator for array, json field

## 0.6.3

### Patch Changes

-   Fix dry run mode multi errors detection bug

## 0.6.2

### Patch Changes

-   Fix: datetime auto value
-   Add pg driver loading from project node_modules
-   Remove console log

## 0.6.1

### Patch Changes

-   Fix: activator during creation should not be called if dependencies not exist

## 0.6.0

### Minor Changes

-   Fix: sub query with relations not correct
-   Support multiple errors detection in dry run mode

## 0.5.6

### Patch Changes

-   Fix: wrong orm mapping of query result in some cases.

## 0.5.5

### Patch Changes

-   Fix: add topo sorting for custom joining clauses

## 0.5.4

### Patch Changes

-   Fix: insert with function call

## 0.5.3

### Patch Changes

-   Bug fixes

## 0.5.2

### Patch Changes

-   Add closureTable methods
    -   getAllDescendants\_,
    -   getAllAncestors\_,
    -   addChildNode\_,
    -   getTopNodes\_,
-   Add noORM query
-   Minor bug fixes

## 0.5.1

### Patch Changes

-   Fix query builder bugs

## 0.5.0

### Minor Changes

-   Add $delete, $update & $create for associated update
-   Add $filter query operator for JSON field
-   Remove associated update for updateMany\_
-   Fix xrCol helper bug
-   Update manual

## 0.4.5

### Patch Changes

-   Fix assoicated updates

## 0.4.4

### Patch Changes

-   Fix $like, $in query operator bugs
-   Updated dependencies
    -   @kitmi/jacaranda@3.1.2

## 0.4.3

### Patch Changes

-   Fix select with exclusive columns.

## 0.4.2

### Patch Changes

-   Add $between and $notBetween operators.

## 0.4.1

### Patch Changes

-   Bug fixes.

## 0.4.0

### Minor Changes

-   Complete postgres ORM feature.

### Patch Changes

-   Updated dependencies
    -   @kitmi/jacaranda@3.1.1

## 0.3.1

### Patch Changes

-   Add createBefore and createAfter entity features.

## 0.3.0

### Minor Changes

-   40a3a30: cmd runner, logger, data access model bugs fix and xeml cli bugs fix

### Patch Changes

-   Updated dependencies [40a3a30]
    -   @kitmi/validators@1.3.0
    -   @kitmi/jacaranda@3.1.0
    -   @kitmi/sys@1.2.2

## 0.2.1

### Patch Changes

-   fix db feature dependency bug.
-   @kitmi/jacaranda@3.0.1

## 0.2.0

### Minor Changes

-   48cb18d: Refactor xeml and data package and minor bug fixing and change on utility libs

### Patch Changes

-   Updated dependencies [48cb18d]
    -   @kitmi/types@1.3.0
    -   @kitmi/validators@1.2.0
    -   @kitmi/jacaranda@3.0.0
    -   @kitmi/sys@1.2.1
    -   @kitmi/utils@1.2.1

## 0.1.0

### Minor Changes

-   Split features from server package into separate packages

### Patch Changes

-   Updated dependencies
    -   @kitmi/jacaranda@2.0.0
    -   @kitmi/sys@1.2.0
    -   @kitmi/utils@1.2.0
