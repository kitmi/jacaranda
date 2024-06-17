# XGENT Entity Modeling Language

## Commands

* build: Generate database migration scripts and entity models.
* graphql: Generate graphql schemas.
* migrate: Create database structure.        
* import: Import data set.
* export: Export data from database.
* reverse: Reverse engineering from a databse.

## Config

```yaml
dataModel:
    schemaSet:
        schemaName:
            dataSource: postgres.connectorName
    dependencies:
        commons: '@xgent/xem-common'
        base: 'wj-db-base'
        auth: 'wj-api-auth'
        crm: 'wj-api-crm'
        cms: 'wj-api-cms'
        lms: 'wj-api-lms'
        psi: 'wj-api-psi'
        sso: 'wj-api-sso'
```

