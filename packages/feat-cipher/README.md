# @kitmi/feat-cipher

## Jacaranda Framework AI Features

`@kitmi/feat-cipher` 

## Features

- cipher

## Installation

To install `@kitmi/feat-cipher`, run the following command:

```bash
bun add @kitmi/feat-cipher
```

Or if you're using npm:

```bash
npm install @kitmi/feat-cipher
```

## Usage

1. Export the feature in the app module
```js
import cipher from '@kitmi/feat-cipher';

export default {
    cipher
};
```

2. Add the feature into config
```yaml
cipher:
    key: '' # optional
    hashAlgorithm: '' # optional
    # ...
```

3. Use anywhere 
```js
const cipher = app.getService('cipher');
cipher.hash();
```

## License
- MIT
- Copyright (c) 2023 KITMI PTY LTD