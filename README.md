# LogVault Developer Tools

Open source developer tools for audit logging best practices. Used internally at [LogVault](https://logvault.eu).

[![npm version](https://badge.fury.io/js/%40logvault%2Fclient.svg)](https://www.npmjs.com/package/@logvault/client)
[![npm version](https://badge.fury.io/js/%40logvault%2Feslint-plugin.svg)](https://www.npmjs.com/package/@logvault/eslint-plugin)
[![npm version](https://badge.fury.io/js/%40logvault%2Fschemas.svg)](https://www.npmjs.com/package/@logvault/schemas)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What's Included

| Tool                                                       | Purpose                          | npm                                                                                                      |
| ---------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [ESLint Plugin](./packages/eslint-plugin)                  | Catch audit gaps during dev      | [![npm](https://img.shields.io/npm/v/@logvault/eslint-plugin)](https://npmjs.com/package/@logvault/eslint-plugin) |
| [Schemas](./packages/schemas)                              | Type-safe Zod validation         | [![npm](https://img.shields.io/npm/v/@logvault/schemas)](https://npmjs.com/package/@logvault/schemas)   |
| [Client SDK](./packages/client)                            | Core audit logging SDK           | [![npm](https://img.shields.io/npm/v/@logvault/client)](https://npmjs.com/package/@logvault/client)     |
| [CLI](./packages/cli)                                      | Quick setup & authentication     | [![npm](https://img.shields.io/npm/v/@logvault/cli)](https://npmjs.com/package/@logvault/cli)           |
| [Examples](./examples)                                     | Templates & integration guides   | -                                                                                                        |

---

## 🔍 ESLint Plugin - Shift-Left Compliance

Catch missing audit logs during development, not during compliance audits.

```bash
npm install -D @logvault/eslint-plugin
```

```javascript
// eslint.config.mjs
import logvault from "@logvault/eslint-plugin";

export default [logvault.configs.recommended];
```

### Rules

| Rule                         | Description                              |
| ---------------------------- | ---------------------------------------- |
| `require-audit-in-catch`     | Warns on catch blocks without audit logs |
| `require-audit-in-mutations` | Warns on mutation handlers without logs  |
| `no-pii-in-logs`             | Prevents PII in log metadata             |

[📖 Full ESLint Plugin Docs →](./packages/eslint-plugin)

---

## 📋 Type-Safe Schemas

Zod schemas for validated, type-safe audit events.

```bash
npm install @logvault/schemas zod
```

```typescript
import { AuthLoginSchema } from "@logvault/schemas";

// Full TypeScript autocomplete
const event = AuthLoginSchema.parse({
  action: "auth.login",
  userId: "user_123",
  metadata: {
    method: "password", // Autocomplete: 'password' | 'oauth' | 'sso'
    ip: "192.168.1.1",
  },
});
```

[📖 Full Schemas Docs →](./packages/schemas)

---

## 🚀 Quick Start

### Option 1: CLI (Fastest)

```bash
npx @logvault/cli init
```

Authenticates via browser and prints your API key.

### Option 2: Manual

```bash
npm install @logvault/client
```

```typescript
import { LogVault } from "@logvault/client";

const client = new LogVault("your-api-key");

await client.log({
  action: "user.login",
  actorId: "user_123",
  metadata: { ip: "192.168.1.1" },
});
```

---

## 📝 Examples & Templates

We provide ready-to-use templates for common integrations:

| Template                                               | Description                      |
| ------------------------------------------------------ | -------------------------------- |
| [events.template.ts](./examples/events.template.ts)    | Type-safe event definitions      |
| [vscode-tasks.json](./examples/vscode-tasks.json)      | VS Code task configuration       |
| [Next.js Integration](./examples/nextjs-integration)   | Complete App Router example      |

---

## 🏗️ Used by LogVault

These are the same tools we use internally at LogVault. By open-sourcing them, we aim to:

1. **Build trust** - See exactly how we approach audit logging
2. **Enable contributions** - Help us improve these tools
3. **Set standards** - Define best practices for audit events

**Want managed audit logging?** → [logvault.eu](https://logvault.eu)

---

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
