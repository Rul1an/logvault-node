# LogVault Node.js SDK

[![npm version](https://img.shields.io/npm/v/@logvault/client.svg)](https://www.npmjs.com/package/@logvault/client)
[![Node.js](https://img.shields.io/node/v/@logvault/client.svg)](https://www.npmjs.com/package/@logvault/client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official Node.js/TypeScript client for [LogVault](https://logvault.eu) — Audit-Log-as-a-Service for B2B SaaS. SOC 2, GDPR, and ISO 27001 compliant. Hosted in the EU.

## Installation

```bash
npm install @logvault/client
```

## Quick Start

```typescript
import { Client } from "@logvault/client";

const client = new Client("your-api-key");

const event = await client.log({
  action: "user.login",
  userId: "user_123",
  resource: "auth",
  metadata: { ip: "192.168.1.1", method: "password" },
});

console.log(`Logged: ${event.id}`);
```

## Features

- **TypeScript First** — Full type definitions included
- **Type-Safe Events** — Optional Zod schema validation with `@logvault/schemas`
- **Zero Dependencies** — Uses native `fetch` API
- **Automatic Retries** — Exponential backoff with jitter
- **Input Validation** — Action format and payload size checks
- **Fail-Safe Serialization** — Handles circular references
- **Local Mode** — Console logging for development (no API calls)
- **PII Detection** — Warns about potential PII in metadata

## Usage

### Express Middleware

```typescript
import express from "express";
import { Client } from "@logvault/client";

const app = express();
const logvault = new Client(process.env.LOGVAULT_API_KEY!);

app.use(async (req, res, next) => {
  if (req.user) {
    await logvault.log({
      action: `api.${req.method.toLowerCase()}`,
      userId: req.user.id,
      resource: req.path,
      metadata: { ip: req.ip },
    });
  }
  next();
});
```

### Next.js Server Action

```typescript
// app/actions/audit.ts
"use server";

import { Client } from "@logvault/client";

const client = new Client(process.env.LOGVAULT_API_KEY!);

export async function logUserAction(action: string, userId: string) {
  await client.log({
    action,
    userId,
    resource: "web-app",
  });
}
```

### List Events

```typescript
const response = await client.listEvents({
  page: 1,
  pageSize: 50,
  userId: "user_123", // Optional filter
});

for (const event of response.events) {
  console.log(`${event.timestamp} - ${event.action}`);
}
```

### Error Handling

```typescript
import {
  Client,
  AuthenticationError,
  RateLimitError,
  APIError,
} from "@logvault/client";

const client = new Client("your-api-key");

try {
  await client.log({ action: "user.login", userId: "user_123" });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key");
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
  apiKey: "your-api-key",
  baseUrl: "https://api.logvault.eu", // Default
  timeout: 30000, // Request timeout (ms)
  maxRetries: 3, // Retry attempts
});
```

### Local Mode (Development)

During development, use local mode to log events to the console instead of making API calls:

```typescript
import { Client } from "@logvault/client";

const client = new Client({
  apiKey: process.env.LOGVAULT_API_KEY || "",
  localMode: "auto", // Auto-detect NODE_ENV === 'development'
});

// Or explicitly enable:
const devClient = new Client({
  apiKey: "",
  localMode: true,
  localModeOptions: {
    colors: true, // ANSI colors in output
    prettyPrint: true, // Box formatting
    piiWarnings: true, // Warn about potential PII
    showCompliance: true, // Show GDPR/SOC2 status
  },
});
```

Console output in local mode:

```
╔════════════════════════════════════════════════════╗
║  🔒 LogVault Local Mode Active                     ║
║  Events logged to console (no API calls)           ║
╚════════════════════════════════════════════════════╝

[LogVault Local] ✓ user.login
┌────────────────────────────────────────────────────┐
│ Action:     user.login                             │
│ User ID:    user_123                               │
│ Resource:   dashboard                              │
├────────────────────────────────────────────────────┤
│ Action:     ✓ Valid                                │
│ User ID:    ✓                                      │
│ Compliance: ✓ GDPR ✓ SOC2                          │
└────────────────────────────────────────────────────┘
```

## Type-Safe Events with @logvault/schemas

For compile-time type safety and validation, install the optional schemas package:

```bash
npm install @logvault/schemas zod
```

### Using TypedClient

```typescript
import { TypedClient } from "@logvault/client";
import { AuthLoginSchema, UserCreatedSchema } from "@logvault/schemas";

const client = new TypedClient({
  apiKey: process.env.LOGVAULT_API_KEY!,
  validateEvents: true, // Runtime validation (default: true)
});

// Full type safety - TypeScript knows the exact shape
await client.logTyped(AuthLoginSchema, {
  action: "auth.login",
  userId: "user_123",
  metadata: {
    method: "password", // Autocomplete: 'password' | 'oauth' | 'sso' | ...
    ip: "192.168.1.1",
    mfaUsed: true,
  },
});

// TypeScript error if you use wrong values:
await client.logTyped(AuthLoginSchema, {
  action: "auth.login",
  userId: "user_123",
  metadata: {
    method: "invalid", // ❌ Error: Type '"invalid"' is not assignable
  },
});
```

### Using createTypedLogger

```typescript
import { Client, createTypedLogger } from "@logvault/client";
import {
  AuthLoginSchema,
  AuthLogoutSchema,
  UserCreatedSchema,
} from "@logvault/schemas";

const client = new Client({ apiKey: process.env.LOGVAULT_API_KEY! });

// Create specialized loggers
const logLogin = createTypedLogger(client, AuthLoginSchema);
const logLogout = createTypedLogger(client, AuthLogoutSchema);
const logUserCreated = createTypedLogger(client, UserCreatedSchema);

// Use with full type safety
await logLogin({
  action: "auth.login",
  userId: "user_123",
  metadata: { method: "oauth", provider: "google" },
});

await logUserCreated({
  action: "user.created",
  userId: "user_456",
  metadata: { source: "invite", role: "member" },
});
```

### Available Event Schemas

| Category | Events                                                                     |
| -------- | -------------------------------------------------------------------------- |
| Auth     | `auth.login`, `auth.logout`, `auth.password_changed`, `auth.mfa_enabled`   |
| User     | `user.created`, `user.updated`, `user.deleted`, `user.role_changed`        |
| Access   | `access.granted`, `access.revoked`, `access.denied`                        |
| Document | `document.created`, `document.read`, `document.deleted`, `document.shared` |
| Data     | `data.exported`, `data.imported`, `data.deleted`, `data.anonymized`        |
| Billing  | `billing.payment_succeeded`, `billing.subscription_cancelled`              |
| System   | `system.api_key_created`, `system.config_changed`                          |

See [@logvault/schemas](https://www.npmjs.com/package/@logvault/schemas) for the full list of 50+ event schemas.

## Action Format

Actions follow the pattern `entity.verb`:

| Category    | Examples                                               |
| ----------- | ------------------------------------------------------ |
| Auth        | `user.login`, `user.logout`, `user.password_reset`     |
| Documents   | `document.create`, `document.read`, `document.delete`  |
| Permissions | `permission.grant`, `permission.revoke`, `role.assign` |
| Data        | `data.export`, `data.delete`                           |

## Requirements

- Node.js 18+ (uses native `fetch`)
- TypeScript 5+ (optional)

## Links

- [Documentation](https://logvault.eu/docs)
- [API Reference](https://logvault.eu/docs/api)
- [GitHub](https://github.com/Rul1an/logvault-node)
- [npm](https://www.npmjs.com/package/@logvault/client)

## License

MIT — see [LICENSE](LICENSE) for details.
