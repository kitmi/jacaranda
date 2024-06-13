# Gen-X Entity Modeling Language

## Commands

* build: Generate database scripts and entity models.
* graphql: Generate graphql schemas.
* migrate: Create database structure.        
* import: Import data set.
* export: Export data from database.
* reverse: Reverse engineering from a databse.

## Config

```
"geml": {
    "modelPath": "src/models",
    "gemlPath": "geml",
    "scriptPath": "scripts",
    "manifestPath": "manifests",
    "useJsonSource": false,
    "saveIntermediate": false,
    "schemas": { 
        "teamlink": {
            "dataSource": "mysql.teamlink"
        }
    }
}
```

## reverse

geml reverse 

## export

