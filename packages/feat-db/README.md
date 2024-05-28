# @kitmi/feat-db

## Jacaranda Framework Database Features

`@kitmi/feat-db` 

## Features

- prisma
- dbImporter

## Installation

To install `@kitmi/feat-db`, run the following command:

```bash
bun add @kitmi/feat-db
```

Or if you're using npm:

```bash
npm install @kitmi/feat-db
```

## Usage

1. Export the feature in the app module
```js
import { prisma, dbImporter } from '@kitmi/feat-db';

export default {
    prisma,
    dbImporter,
};
```

2. Add the feature into config
```yaml
prisma:
    
    # ...

dbImporter:
    service: 'prisma'
```

3. Use anywhere 
```js
const cipher = app.getService('cipher');
cipher.hash();
```

## License
- MIT
- Copyright (c) 2023 KITMI PTY LTD