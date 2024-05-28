# Entity Model

## static members

* db
    * connector - Getter
    * createNewConnector - Create a new connector, usually used for transaction
* meta - Metadata about the enttiy
    * knowledge 
        * dependsOnExisting
* i18n - I18n object

## operation context

There are predefined context properties which can be accessed in an entity operation as listed below.

* operation - 'create/retrieve/update/delete'
* raw - Raw input data. 
* latest - Validated and sanitized data.
* existing - Existing data from database.
* i18n - I18n object.
* connector - Existing connector for chained operation.
* result - Operation result.
* return - Data to return, if retrieveCreated or retrieveUpdated or retrieveDeleted is true, return will be the just create/updated/deleted data.
* entities - Access other entity models in the same schema
* schemas - Access other schema models in the same application
* state - Current request state

## opertion helper

queryFunction
queryBinExpr
queryColumn

## operation options

* connector - Transaction connector.
* $projection
* $association
* $relationships
* $query - Query condition
* $variables - Variables to interpolate into query condition
* $features - Custom feature options override
* $orderBy - Order by condition, map of column to ascend?
* $groupBy - Group by condition
* $offset
* $limit
* $totalCount - Returns total record count when used with $limit
* $includeDeleted - {boolean}
* $skipOrm - {boolean}
* $custom - User defined operation control data
* $retrieveCreated
* $retrieveUpdated
* $retrieveDeleted
* $retrieveExisting
* $bypassReadOnly
* $physicalDeletion - {boolean}
* $existing
* $requireSplitColumns
* $bypassEnsureUnique
* $toDictionary
* $migration - {boolean}

## operation sequence

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

## semantic symbols

* supported symbols 
    * @@now - Current datetime value

## special tokens

* oolType

    Oolong Language Syntax Types (design time)

    * General Value Types
        * ObjectReference
        * ConstReference
        * StringTemplate
        * PipedValue
        * FunctionCall
        * RegExp
        * JavaScript

    * Modifiers    
        * Validator - |~, read as "Ensure"
        * Processor - |>, read as "Transform to"
        * Activator - |=, read as "Set to"   

    * Data Operations
        * findOne
        * DoStatement

    * Statements & Expressions
        * cases
        * ConditionalStatement
        * ReturnExpression    
        * ThrowExpression
        * UnaryExpression
        * ValidateExpression
        * BinaryExpression
        * LogicalExpression

* oorType

    Oolong Runtime Types (run time)

    * SymbolToken
    * SessionVariable
    * QueryVariable

## fieldDependency

* fieldName: ifAnyExist: [ a1, a2, ... ] - If any of a1, a2, ... exists, all become dependency (need existing values)
    
    For activator that references to other fields
    When creating

* fieldName: 

    For processor that references to other fields and 

* dependsOnExisting: [ a1, a2 ] - 

## known issues

* retrieveUpdated - The previous query maybe affected by updating


