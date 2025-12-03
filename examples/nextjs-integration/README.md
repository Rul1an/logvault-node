# LogVault + Next.js Integration

Complete example of integrating LogVault with a Next.js App Router application.

## Setup

### 1. Install Dependencies

```bash
npm install @logvault/client @logvault/schemas @logvault/eslint-plugin
```

### 2. Environment Variables

```env
# .env.local
LOGVAULT_API_KEY=lv_prod_your_api_key_here
```

### 3. Create SDK Singleton

```typescript
// lib/logvault.ts
import { LogVault } from "@logvault/client";

export const logvault = new LogVault(process.env.LOGVAULT_API_KEY!, {
  // Optional: Enable local mode in development
  localMode: process.env.NODE_ENV === "development" ? "auto" : "off",
});
```

### 4. Use in Server Actions

```typescript
// app/actions/user.ts
"use server";

import { logvault } from "@/lib/logvault";
import { trackEvent, AUDIT_ACTIONS } from "@/lib/events";

export async function updateUserProfile(userId: string, data: ProfileData) {
  try {
    // Your business logic
    await db.user.update({ where: { id: userId }, data });

    // Track the event
    await trackEvent({
      action: AUDIT_ACTIONS.USER_PROFILE_UPDATED,
      actorId: userId,
      metadata: {
        changedFields: Object.keys(data),
      },
    });

    return { success: true };
  } catch (error) {
    // Log failures too
    await trackEvent({
      action: "user.profile_update.failed",
      actorId: userId,
      metadata: { error: error.message },
    });
    throw error;
  }
}
```

### 5. Use in API Routes

```typescript
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { trackEvent, AUDIT_ACTIONS } from "@/lib/events";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Track before deletion
  await trackEvent({
    action: AUDIT_ACTIONS.USER_DELETED,
    actorId: session.userId,
    targetId: params.id,
    targetType: "user",
  });

  await db.user.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
```

## ESLint Plugin

Add audit gap detection to catch missing logs during development:

```javascript
// eslint.config.mjs
import logvault from "@logvault/eslint-plugin";

export default [
  logvault.configs.recommended,
  // ... your other configs
];
```

This will warn you when:

- Catch blocks don't have audit logging
- Mutation handlers (DELETE, PUT, POST) lack audit logs
- PII is logged directly without transformation

## Best Practices

### 1. Use Type-Safe Actions

```typescript
// ✅ Good - type-safe
await trackEvent({ action: AUDIT_ACTIONS.USER_CREATED, actorId });

// ❌ Bad - string literal
await trackEvent({ action: "user.created", actorId });
```

### 2. Always Include Actor

```typescript
// ✅ Good - includes actor
await trackEvent({
  action: AUDIT_ACTIONS.RESOURCE_DELETED,
  actorId: session.userId,
  targetId: resource.id,
});

// ❌ Bad - no actor
await logvault.log({ action: "resource.deleted" });
```

### 3. Log Failures Too

```typescript
try {
  await riskyOperation();
  await trackEvent({ action: "operation.success", actorId });
} catch (error) {
  await trackEvent({
    action: "operation.failed",
    actorId,
    metadata: { error: error.message },
  });
  throw error;
}
```

### 4. No PII in Metadata

```typescript
// ✅ Good - no PII
await trackEvent({
  action: AUDIT_ACTIONS.USER_CREATED,
  actorId,
  metadata: { plan: "pro" },
});

// ❌ Bad - PII exposed
await trackEvent({
  action: AUDIT_ACTIONS.USER_CREATED,
  actorId,
  metadata: { email: user.email }, // Don't do this!
});
```

## More Examples

- [events.template.ts](../events.template.ts) - Type-safe event definitions
- [vscode-tasks.json](../vscode-tasks.json) - VS Code task configuration

## Documentation

- [LogVault Docs](https://logvault.eu/docs)
- [Next.js App Router](https://nextjs.org/docs/app)

