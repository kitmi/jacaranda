## Db operation context 

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