# @kitmi/adapters

## Jacaranda Framework Adapters

`@kitmi/adapters` provides a unified interface for interacting with various components that share similar functionalities but may have different underlying implementations or interfaces. By using this library, developers can switch between different components such as HTTP clients or JavaScript package managers without changing the consuming codebase, making the code more modular and easier to maintain.

## Features

-   **HTTP Client Adapters**: Abstract the differences between various HTTP clients like Fetch API, or SuperAgent, allowing for easy interchangeability.
-   **JS Package Manager Adapters**: Seamlessly switch between package managers like npm, Yarn, or pnpm without altering the workflow scripts.

## Installation

To install `@kitmi/adapters`, run the following command:

```bash
bun install @kitmi/adapters
```

Or if you're using npm:

```bash
npm install @kitmi/adapters
```

## Usage

#### HTTP Client Adapter Example

```javascript
import { superagent, supertest, fetchagent } from '@kitmi/adapters';
import { HttpClient } from '@kitmi/jacaranda';
// Instantiate the adapter with your preferred client
let httpClient = new HttpClient(superagent() /** supertest(), fetchagent() */, 'https://dummyjson.com');
const result = await httpClient.get('/products');
console.log(result);
```

#### JS Package Manager Adapter Example

```javascript
import { packageManagers } from '@kitmi/adapters';

// Instantiate the adapter with your preferred package manager
const pkgManager = packageManagers['npm']; // or 'yarn', 'pnpm'

// Use the adapter to install package and save to package.json
await pkgManager.addPackage_('express');
```

## License

-   MIT
-   Copyright (c) 2023 KITMI PTY LTD
