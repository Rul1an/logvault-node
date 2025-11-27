# LogVault Node.js SDK

[![npm version](https://img.shields.io/npm/v/@logvault/client.svg)](https://www.npmjs.com/package/@logvault/client)
[![Node.js](https://img.shields.io/node/v/@logvault/client.svg)](https://www.npmjs.com/package/@logvault/client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official Node.js/TypeScript client for [LogVault](https://logvault.app) — Audit-Log-as-a-Service for B2B SaaS. SOC 2, GDPR, and ISO 27001 compliant. Hosted in the EU.

## Installation

```bash
npm install @logvault/client
```

## Quick Start

```typescript
import { Client } from '@logvault/client';

const client = new Client('your-api-key');

const event = await client.log({
    action: 'user.login',
    userId: 'user_123',
    resource: 'auth',
    metadata: { ip: '192.168.1.1', method: 'password' }
});

console.log(`Logged: ${event.id}`);
```

## Features

- **TypeScript First** — Full type definitions included
- **Zero Dependencies** — Uses native `fetch` API
- **Automatic Retries** — Exponential backoff with jitter
- **Input Validation** — Action format and payload size checks
- **Fail-Safe Serialization** — Handles circular references

## Usage

### Express Middleware

```typescript
import express from 'express';
import { Client } from '@logvault/client';

const app = express();
const logvault = new Client(process.env.LOGVAULT_API_KEY!);

app.use(async (req, res, next) => {
    if (req.user) {
        await logvault.log({
            action: `api.${req.method.toLowerCase()}`,
            userId: req.user.id,
            resource: req.path,
            metadata: { ip: req.ip }
        });
    }
    next();
});
```

### Next.js Server Action

```typescript
// app/actions/audit.ts
'use server';

import { Client } from '@logvault/client';

const client = new Client(process.env.LOGVAULT_API_KEY!);

export async function logUserAction(action: string, userId: string) {
    await client.log({
        action,
        userId,
        resource: 'web-app'
    });
}
```

### List Events

```typescript
const response = await client.listEvents({
    page: 1,
    pageSize: 50,
    userId: 'user_123'  // Optional filter
});

for (const event of response.events) {
    console.log(`${event.timestamp} - ${event.action}`);
}
```

### Error Handling

```typescript
import { Client, AuthenticationError, RateLimitError, APIError } from '@logvault/client';

const client = new Client('your-api-key');

try {
    await client.log({ action: 'user.login', userId: 'user_123' });
} catch (error) {
    if (error instanceof AuthenticationError) {
        console.error('Invalid API key');
    } else if (error instanceof RateLimitError) {
        console.error(`Rate limited. Retry after ${error.retryAfter}s`);
    } else if (error instanceof APIError) {
        console.error(`API error: ${error.statusCode}`);
    }
}
```

### Configuration Options

```typescript
const client = new Client({
    apiKey: 'your-api-key',
    baseUrl: 'https://api.logvault.eu',  // Default
    timeout: 30000,                       // Request timeout (ms)
    maxRetries: 3                         // Retry attempts
});
```

## Action Format

Actions follow the pattern `entity.verb`:

| Category | Examples |
|----------|----------|
| Auth | `user.login`, `user.logout`, `user.password_reset` |
| Documents | `document.create`, `document.read`, `document.delete` |
| Permissions | `permission.grant`, `permission.revoke`, `role.assign` |
| Data | `data.export`, `data.delete` |

## Requirements

- Node.js 18+ (uses native `fetch`)
- TypeScript 5+ (optional)

## Links

- [Documentation](https://logvault.app/docs)
- [API Reference](https://logvault.app/docs/api)
- [GitHub](https://github.com/Rul1an/logvault-node)
- [npm](https://www.npmjs.com/package/@logvault/client)

## License

MIT — see [LICENSE](LICENSE) for details.
