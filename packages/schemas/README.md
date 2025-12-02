# @logvault/schemas

Type-safe Zod schemas for LogVault audit events. Get compile-time validation, IDE autocomplete, and documentation-as-code for your audit logging.

[![npm version](https://badge.fury.io/js/%40logvault%2Fschemas.svg)](https://www.npmjs.com/package/@logvault/schemas)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔒 **Type-safe** - Catch errors at compile time, not runtime
- 🎯 **IDE Autocomplete** - See available events and their required fields
- 📚 **Self-documenting** - Schemas serve as documentation
- 🛡️ **Compliance** - Built-in support for GDPR, SOC2 requirements
- 🔄 **JSON Schema Export** - Use with Python and other languages
- 🌳 **Tree-shakeable** - Only import what you need

## Installation

```bash
npm install @logvault/schemas zod
# or
pnpm add @logvault/schemas zod
# or
yarn add @logvault/schemas zod
```

## Quick Start

```typescript
import { validateEvent, type AuthLoginEvent } from "@logvault/schemas";

// Type-safe event creation
const loginEvent: AuthLoginEvent = {
  action: "auth.login",
  userId: "user_123",
  metadata: {
    method: "password",
    ip: "192.168.1.1",
    mfaUsed: true,
  },
};

// Runtime validation
const validated = validateEvent(loginEvent);
```

## Event Categories

### Authentication (`auth.*`)

```typescript
import { AuthLoginSchema, AuthLogoutSchema } from "@logvault/schemas";

// Login event
const login = AuthLoginSchema.parse({
  action: "auth.login",
  userId: "user_123",
  metadata: {
    method: "oauth", // 'password' | 'oauth' | 'sso' | 'magic_link' | 'passkey'
    provider: "google",
    mfaUsed: true,
  },
});

// All auth events:
// auth.login, auth.logout, auth.login_failed, auth.password_changed,
// auth.password_reset_requested, auth.mfa_enabled, auth.mfa_disabled,
// auth.session_created, auth.session_revoked
```

### User Management (`user.*`)

```typescript
import { UserCreatedSchema, UserDeletedSchema } from "@logvault/schemas";

// User created
const userCreated = UserCreatedSchema.parse({
  action: "user.created",
  userId: "user_123",
  resource: "org_456",
  metadata: {
    source: "invite", // 'signup' | 'invite' | 'import' | 'api'
    role: "member",
    invitedBy: "user_admin",
  },
});

// User deleted (GDPR compliant)
const userDeleted = UserDeletedSchema.parse({
  action: "user.deleted",
  userId: "user_123",
  metadata: {
    deletedBy: "admin_456",
    dataRetention: "anonymized",
    gdprRequest: true,
  },
});

// All user events:
// user.created, user.updated, user.deleted, user.suspended,
// user.reactivated, user.role_changed, user.email_verified, user.invited
```

### Access Control (`access.*`)

```typescript
import { AccessGrantedSchema, AccessDeniedSchema } from "@logvault/schemas";

// Access granted
const accessGranted = AccessGrantedSchema.parse({
  action: "access.granted",
  userId: "user_123",
  resource: "doc_456",
  metadata: {
    permission: "write",
    grantedBy: "user_admin",
    expiresAt: "2024-12-31T23:59:59Z",
  },
});

// All access events:
// access.granted, access.revoked, access.denied, access.requested,
// access.approved, access.rejected, access.expired
```

### Documents (`document.*`)

```typescript
import { DocumentCreatedSchema, DocumentSharedSchema } from "@logvault/schemas";

// Document shared
const docShared = DocumentSharedSchema.parse({
  action: "document.shared",
  userId: "user_123",
  resource: "doc_456",
  metadata: {
    sharedWith: ["user_789", "user_012"],
    permission: "edit",
    linkSharing: false,
  },
});

// All document events:
// document.created, document.read, document.updated, document.deleted,
// document.shared, document.unshared, document.moved, document.copied,
// document.restored, document.exported
```

### Data Operations (`data.*`)

```typescript
import { DataExportedSchema, DataDeletedSchema } from "@logvault/schemas";

// Data export (GDPR)
const dataExport = DataExportedSchema.parse({
  action: "data.exported",
  userId: "user_123",
  metadata: {
    format: "json",
    scope: "user_profile",
    recordCount: 150,
    gdprRequest: true,
  },
});

// All data events:
// data.exported, data.imported, data.deleted, data.anonymized,
// data.accessed, data.backup_created, data.restored
```

### Billing (`billing.*`)

```typescript
import { BillingPaymentSucceededSchema } from "@logvault/schemas";

// Payment succeeded
const payment = BillingPaymentSucceededSchema.parse({
  action: "billing.payment_succeeded",
  userId: "user_123",
  metadata: {
    amount: 9900, // cents
    currency: "EUR",
    paymentMethod: "card",
  },
});

// All billing events:
// billing.subscription_created, billing.subscription_updated,
// billing.subscription_cancelled, billing.payment_succeeded,
// billing.payment_failed, billing.invoice_created,
// billing.refund_issued, billing.plan_changed
```

### System (`system.*`)

```typescript
import { SystemApiKeyCreatedSchema } from "@logvault/schemas";

// API key created
const apiKey = SystemApiKeyCreatedSchema.parse({
  action: "system.api_key_created",
  userId: "user_123",
  metadata: {
    keyPrefix: "lv_live_abc",
    name: "Production API Key",
    scopes: ["events:write", "events:read"],
  },
});

// All system events:
// system.api_key_created, system.api_key_revoked, system.config_changed,
// system.webhook_created, system.webhook_deleted, system.integration_enabled,
// system.integration_disabled, system.error_occurred,
// system.maintenance_started, system.maintenance_ended
```

## PII-Safe Transformers

Handle sensitive data safely:

```typescript
import { hashedEmail, maskedString, anonymizedIp } from "@logvault/schemas";
import { z } from "zod";

const SafeUserSchema = z.object({
  email: hashedEmail, // { _type: 'hashed_email', hash: 'abc123...', domain: 'example.com' }
  name: maskedString, // 'J***n'
  ip: anonymizedIp, // '192.168.xxx.xxx'
});
```

## Validation Utilities

```typescript
import {
  validateEvent,
  safeValidateEvent,
  isKnownAction,
  getActionCategory,
  ALL_ACTIONS,
} from "@logvault/schemas";

// Strict validation (throws on error)
const event = validateEvent(data);

// Safe validation (returns result object)
const result = safeValidateEvent(data);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error.issues);
}

// Check if action is known
isKnownAction("auth.login"); // true
isKnownAction("foo.bar"); // false

// Get action category
getActionCategory("auth.login"); // 'auth'
getActionCategory("user.created"); // 'user'

// List all actions
console.log(ALL_ACTIONS); // ['auth.login', 'auth.logout', ...]
```

## JSON Schema Export

For Python SDK or API documentation:

```typescript
import { toJsonSchema, exportAllSchemas } from "@logvault/schemas/utils";
import { AuthLoginSchema } from "@logvault/schemas";

// Export single schema
const jsonSchema = await toJsonSchema(AuthLoginSchema, "AuthLogin");

// Export all schemas
const allSchemas = await exportAllSchemas();
```

## Usage with LogVault SDK

```typescript
import { LogVault } from "@logvault/client";
import { validateEvent, type AuthLoginEvent } from "@logvault/schemas";

const client = new LogVault({ apiKey: process.env.LOGVAULT_API_KEY! });

// Type-safe logging
const event: AuthLoginEvent = {
  action: "auth.login",
  userId: "user_123",
  metadata: { method: "password" },
};

// Validate before sending (optional - SDK also validates)
const validated = validateEvent(event);
await client.log(validated);
```

## Custom Events

For events not in the registry:

```typescript
import { BaseEventSchema, validateCustomEvent } from "@logvault/schemas";

// Extend base schema
const MyCustomSchema = BaseEventSchema.extend({
  action: z.literal("custom.my_action"),
  metadata: z.object({
    customField: z.string(),
  }),
});

// Or validate with base schema
const customEvent = validateCustomEvent({
  action: "custom.something",
  userId: "user_123",
  metadata: { anything: "goes" },
});
```

## TypeScript Support

Full TypeScript support with type inference:

```typescript
import type {
  LogVaultEvent,
  AuthEvent,
  AuthLoginEvent,
  UserEvent,
  AccessEvent,
  DocumentEvent,
  DataEvent,
  BillingEvent,
  SystemEvent,
  LogVaultAction,
} from "@logvault/schemas";

// Type guard
function handleEvent(event: LogVaultEvent) {
  if (event.action === "auth.login") {
    // TypeScript knows: event is AuthLoginEvent
    console.log(event.metadata?.method);
  }
}
```

## Related

- [@logvault/client](https://www.npmjs.com/package/@logvault/client) - LogVault SDK
- [LogVault Documentation](https://logvault.eu/docs)
- [Zod Documentation](https://zod.dev)

## License

MIT © [LogVault](https://logvault.eu)
