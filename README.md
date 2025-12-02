# LogVault JavaScript/TypeScript SDKs

Official JavaScript and TypeScript SDKs for [LogVault](https://logvault.eu) - Audit logging for compliance.

[![npm version](https://badge.fury.io/js/%40logvault%2Fclient.svg)](https://www.npmjs.com/package/@logvault/client)
[![npm version](https://badge.fury.io/js/%40logvault%2Fschemas.svg)](https://www.npmjs.com/package/@logvault/schemas)
[![npm version](https://badge.fury.io/js/%40logvault%2Fcli.svg)](https://www.npmjs.com/package/@logvault/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Packages

This monorepo contains the following packages:

| Package | Description | npm |
|---------|-------------|-----|
| [`@logvault/client`](./packages/client) | Core SDK for audit logging | [![npm](https://img.shields.io/npm/v/@logvault/client)](https://www.npmjs.com/package/@logvault/client) |
| [`@logvault/schemas`](./packages/schemas) | Type-safe Zod schemas | [![npm](https://img.shields.io/npm/v/@logvault/schemas)](https://www.npmjs.com/package/@logvault/schemas) |
| [`@logvault/cli`](./packages/cli) | CLI for quick setup | [![npm](https://img.shields.io/npm/v/@logvault/cli)](https://www.npmjs.com/package/@logvault/cli) |

## Quick Start

### Option 1: CLI (Recommended)

```bash
npx @logvault/cli init
```

This will:
1. Open your browser to authenticate
2. Fetch your API key
3. Print it to the terminal

### Option 2: Manual Installation

```bash
# Core client
npm install @logvault/client

# Optional: Type-safe schemas
npm install @logvault/schemas zod
```

## Usage

### Basic Usage

```typescript
import { LogVault } from '@logvault/client';

const client = new LogVault('your-api-key');

await client.log({
  action: 'user.login',
  userId: 'user_123',
  metadata: {
    ip: '192.168.1.1',
    browser: 'Chrome'
  }
});
```

### Type-Safe Logging (Recommended)

```typescript
import { TypedClient } from '@logvault/client';
import { AuthLoginSchema } from '@logvault/schemas';

const client = new TypedClient({ apiKey: 'your-api-key' });

// Full TypeScript autocomplete and validation
await client.logTyped(AuthLoginSchema, {
  action: 'auth.login',
  userId: 'user_123',
  metadata: {
    method: 'password', // Autocomplete: 'password' | 'oauth' | 'sso' | ...
    ip: '192.168.1.1',
  },
});
```

### Local Mode (Development)

```typescript
import { Client } from '@logvault/client';

const client = new Client({
  apiKey: process.env.LOGVAULT_API_KEY || '',
  localMode: 'auto', // Enabled when NODE_ENV === 'development'
});

// Events logged to console, no API calls
await client.log({
  action: 'user.login',
  userId: 'user_123',
});
```

## Documentation

- [Quick Start Guide](https://logvault.eu/docs/quickstart)
- [JavaScript SDK Reference](https://logvault.eu/docs/sdks/javascript)
- [API Reference](https://logvault.eu/docs/api)
- [Type-Safe Schemas](https://logvault.eu/docs/schemas)

## Development

This monorepo uses [pnpm](https://pnpm.io/) and [Turborepo](https://turbo.build/).

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [LogVault](https://logvault.eu)
