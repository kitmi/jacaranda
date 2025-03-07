# @kitmi/xeml

## 0.10.5

### Patch Changes

-   Added missing dependencies

## 0.10.4

### Patch Changes

-   Added support for apiExtends

## 0.10.3

### Patch Changes

-   Fixed missing peer deps

## 0.10.2

### Patch Changes

-   Refined validation schema generation

## 0.10.1

### Patch Changes

-   Removed version info requirement while generating api

## 0.10.0

### Minor Changes

-   add migration file reference from xem package

## 0.9.4

### Patch Changes

-   add `this` context reference in entity definition 
-   fix: api generation bug for nested path

## 0.9.3

### Patch Changes

-   Fixed migration bug.
-   Fixed api generation bug.

## 0.9.2

### Patch Changes

-   Bug fixing
-   Add custom fields (which does not belong to an entity) for predefined schema with "+" prefix
-   Add separate build-api command for app module

## 0.9.1

### Patch Changes

-   Add app reference as context in entity modifiers definition.

## 0.9.0

### Minor Changes

-   Add API generation feature.
-   Separate dataset schema from entity definition into dedicated yaml files.

## 0.8.0

### Minor Changes

-   Use constant as modifier argument

## 0.7.4

### Patch Changes

-   Fix migration bug

## 0.7.3

### Patch Changes

-   Fix migration bug

## 0.7.2

### Patch Changes

-   Fix bug when using two schemas in one project.

## 0.7.1

### Patch Changes

-   Fix migration bug.

## 0.7.0

### Minor Changes

-   Add incremental migration.

## 0.6.1

### Patch Changes

-   Fix cloneSubTree\_ bug.

## 0.6.0

### Minor Changes

-   Add more closureTable methods, e.g. removeSubTree*, cloneSubTree*
-   Add index remove via overriding
-   Minor bug fixes

## 0.5.2

### Patch Changes

-   Add GIN index for json column

## 0.5.1

### Patch Changes

-   Fix js data file

## 0.5.0

### Minor Changes

-   Add messageQueue methods
-   Add deferredQueue methods
-   Bug fixes

## 0.4.2

### Patch Changes

-   Bug fixes

## 0.4.1

### Patch Changes

-   Bug fixes

## 0.4.0

### Minor Changes

-   Add closureTable methods.
-   Updated dependencies
    -   @kitmi/data@0.5.2

## 0.3.3

### Patch Changes

-   Add auto update timestamp trigger.
-   Updated dependencies
    -   @kitmi/data@0.4.2

## 0.3.2

### Patch Changes

-   Complete postgres ORM feature.
-   Updated dependencies
    -   @kitmi/data@0.4.0
    -   @kitmi/jacaranda@3.1.1

## 0.3.1

### Patch Changes

-   Add createBefore and createAfter entity features.
-   Updated dependencies
    -   @kitmi/data@0.3.1

## 0.3.0

### Minor Changes

-   40a3a30: cmd runner, logger, data access model bugs fix and xeml cli bugs fix

### Patch Changes

-   Updated dependencies [40a3a30]
    -   @kitmi/validators@1.3.0
    -   @kitmi/jacaranda@3.1.0
    -   @kitmi/data@0.3.0
    -   @kitmi/sys@1.2.2

## 0.2.0

### Minor Changes

-   48cb18d: Refactor xeml and data package and minor bug fixing and change on utility libs

### Patch Changes

-   Updated dependencies [48cb18d]
    -   @kitmi/data@0.2.0
    -   @kitmi/validators@1.2.0
    -   @kitmi/jacaranda@3.0.0
    -   @kitmi/sys@1.2.1
    -   @kitmi/utils@1.2.1
    -   @kitmi/feat-cipher@2.0.0

## 0.1.0

### Minor Changes

-   Split features from server package into separate packages

### Patch Changes

-   Updated dependencies
    -   @kitmi/feat-db@0.1.0
    -   @kitmi/sys@1.2.0
    -   @kitmi/utils@1.2.0
