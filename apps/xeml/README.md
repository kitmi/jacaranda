# @genx/model

## Get Started

### Usage

```
genx-eml -h
```

### Build models

```
genx-eml build -c
```

### Migration

```
genx-eml migrate -c conf/app.default.json
```

## Configuration

```
{
    ...,
    "dataSource": {
        "mysql": {
            "test": {
                "connection": "mysql://..."
            }
        }
    },
    "settings": {
        "geml": {
            "gemlPath": "geml",
            "modelPath": "src/models",
            "scriptPath": "scripts",
            "schemas": {
                "test": {
                    "dataSource": "mysql.test"
                }
            }
        }        
    }
}
```