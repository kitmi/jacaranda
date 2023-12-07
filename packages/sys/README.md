# @kitmi/sys

## JavaScript Local System Utilities

`@kitmi/sys` is a small collection of utility functions designed to interact with the local system using JavaScript. It is designed to work with `node.js`/`bun.sh`.

## Features

- cmd helpers: `run_`, `runLive_`, `runSync`
- require from specified location and throw friendly error: `tryRequire`
- fs utils: `isDir`, `isDirEmpty`, fs from fs-extra
- reboot: `reboot`
- eval: `interpolate`, `evaluate`

## Installation

To install `@kitmi/sys`, run the following command:

```bash
bun install @kitmi/sys
```

Or if you're using npm:

```bash
npm install @kitmi/sys
```

## License
- MIT
- Copyright (c) 2023 KITMI PTY LTD