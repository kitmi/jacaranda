# @kitmi/config

## JavaScript Env-aware Config

`@kitmi/config` provides a simple and flexible way to manage configuration settings for applications across different environments. It supports both JSON and YAML file formats and automatically selects the appropriate configuration based on the current environment.

## Features

- Environment-aware: Automatically loads configuration files based on the environment setting.
- Supports JSON and YAML: Seamlessly works with both JSON and YAML configuration files.
- Easy to use: Provides a straight forward API to access configuration values.
- Customizable: Allows custom environment variable names and custom configuration file paths.
- Fallbacks: Supports default configuration for unspecified environments.

## Installation

To install `@kitmi/config`, run the following command:

```bash
bun install @kitmi/config
```

Or if you're using npm:

```bash
npm install @kitmi/config
```

## Usage

1. Create configuration files for your environments, e.g., `config.development.json`, `config.production.json`, `config.default.yaml`.

2. Import the library and use it to access your configuration settings:

```javascript
import ConfigLoader from '@kitmi/config';

const configLoader = ConfigLoader.createEnvAwareJsonLoader(<config path>, 'config', <development|production>);
await configLoader.load_();
```

3. Variables referenced in config

- Reference to `settings.jwtSecret` node in the same config file.
```json
{
    "jwt": "#!jsv: $this.settings.jwtSecret"
}
```

- Reference to a env variable using ES string template.
```yaml
dataSource:
  postgres:
    wisley:
      connection: "${env.WISLEY_DB_URL}"
      logStatement: true
```

## License
- MIT
- Copyright (c) 2023 KITMI PTY LTD