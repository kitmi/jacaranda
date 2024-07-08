# @kitmi/feat-db

## Jacaranda Framework Database Add-on Features

`@kitmi/feat-db`

## Features

-   dbImporter

## Helpers

-   excel
    -   writeExcelTemplate\_
    -   loadExcelFile\_

## Usage

### Features

1. Export the feature in the app module

```js
import { dbImporter } from '@kitmi/feat-db';

export default {
    dbImporter,
};
```

2. Add the feature into config

```yaml
dbImporter:
    service: 'prisma'
```

3. Use anywhere

```js
const dbImporter = app.getService('dbImporter');
await dbImporter.importList_();
// it dbImporter.import_();
```

### Helpers

```js
import { writeExcelTemplate_ } from '@kitmi/feat-db';

export default {
    dbImporter,
};
```

## License

-   MIT
-   Copyright (c) 2023 KITMI PTY LTD
