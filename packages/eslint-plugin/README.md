# @logvault/eslint-plugin

ESLint plugin for **Shift-Left Compliance** - detect audit logging gaps during development, not during audits.

[![npm version](https://img.shields.io/npm/v/@logvault/eslint-plugin.svg)](https://www.npmjs.com/package/@logvault/eslint-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @logvault/eslint-plugin --save-dev
# or
pnpm add -D @logvault/eslint-plugin
```

## Usage (ESLint v9 Flat Config)

```javascript
// eslint.config.js
import logvault from "@logvault/eslint-plugin";

export default [
  logvault.configs.recommended,
  // or logvault.configs.strict for stricter enforcement
];
```

### Custom Configuration

```javascript
// eslint.config.js
import logvault from "@logvault/eslint-plugin";

export default [
  {
    plugins: {
      logvault,
    },
    rules: {
      "logvault/require-audit-in-catch": ["warn", {
        allowConsoleError: false,
        auditFunctions: ["client.log", "logger.audit"],
      }],
      "logvault/require-audit-in-mutations": ["warn", {
        methods: ["DELETE", "PUT", "POST", "PATCH"],
        ignorePaths: ["**/health/**"],
      }],
      "logvault/no-pii-in-logs": ["error", {
        piiFields: ["email", "phone", "ssn"],
        transformers: ["hashedEmail", "maskedString"],
      }],
    },
  },
];
```

## Rules

### `logvault/require-audit-in-catch`

Ensures catch blocks include audit logging for compliance tracking.

❌ **Bad:**
```typescript
try {
  await db.user.delete(id);
} catch (error) {
  console.error(error); // No audit trail!
}
```

✅ **Good:**
```typescript
try {
  await db.user.delete(id);
} catch (error) {
  await client.log({ action: 'user.delete.failed', error });
  throw error;
}
```

**Options:**
- `allowConsoleError` (boolean, default: `false`) - Allow console.error as substitute
- `auditFunctions` (string[], default: `["client.log", "logvault.log", "audit.log"]`)

---

### `logvault/require-audit-in-mutations`

Ensures mutation handlers (DELETE, PUT, POST, PATCH) include audit logging.

❌ **Bad:**
```typescript
export async function DELETE(req) {
  await db.user.delete(id);
  return Response.json({ success: true });
}
```

✅ **Good:**
```typescript
export async function DELETE(req) {
  await client.log({ action: 'user.deleted', userId: id });
  await db.user.delete(id);
  return Response.json({ success: true });
}
```

**Options:**
- `methods` (string[], default: `["DELETE", "PUT", "POST", "PATCH"]`)
- `auditFunctions` (string[], default: `["client.log", "logvault.log", "audit.log"]`)
- `ignorePaths` (string[], default: `[]`) - Glob patterns to ignore

---

### `logvault/no-pii-in-logs`

Prevents logging PII fields directly without transformation.

❌ **Bad:**
```typescript
await client.log({
  action: 'user.created',
  metadata: { email: user.email } // PII exposed!
});
```

✅ **Good:**
```typescript
import { hashedEmail } from '@logvault/schemas';

await client.log({
  action: 'user.created',
  metadata: { email: hashedEmail.parse(user.email) }
});
```

**Options:**
- `piiFields` (string[]) - Fields to detect as PII
- `transformers` (string[]) - Functions that safely transform PII
- `auditFunctions` (string[])

## Presets

| Preset | Description |
|--------|-------------|
| `recommended` | Warns on missing audits, errors on PII |
| `strict` | Errors on all violations |

## Integration with @logvault/schemas

This plugin works seamlessly with [@logvault/schemas](https://www.npmjs.com/package/@logvault/schemas) for:

- PII-safe transformers (`hashedEmail`, `maskedString`, `anonymizedIp`)
- Type-safe event schemas
- Validation at development time

## Why Shift-Left Compliance?

Traditional compliance audits find issues **after deployment**. This plugin catches audit gaps **during development**:

- ⏱️ **Earlier detection** - Find issues in your IDE, not in audits
- 💰 **Lower cost** - Fix problems before they reach production
- 🔒 **Better security** - PII protection enforced by tooling
- ✅ **Audit readiness** - Be confident your logging is complete

## License

MIT © LogVault

