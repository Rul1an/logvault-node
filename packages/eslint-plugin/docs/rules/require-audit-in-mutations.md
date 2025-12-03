# logvault/require-audit-in-mutations

💼 This rule is enabled in the following configs: `recommended`, `strict`.

Ensures mutation handlers (DELETE, PUT, POST, PATCH) include audit logging.

## Rule Details

This rule warns when an exported HTTP mutation handler doesn't contain a call to an audit logging function. Mutation operations should always be logged for:

- **Audit trails** - Track who changed what and when
- **Compliance** - Prove data modifications are logged
- **Security** - Detect unauthorized changes

## Examples

### ❌ Incorrect

```javascript
// DELETE without logging
export async function DELETE(req) {
  await db.user.delete(req.params.id);
  return Response.json({ success: true });
}
```

```javascript
// PUT without logging
export async function PUT(req) {
  const data = await req.json();
  await db.user.update(data);
  return Response.json({ success: true });
}
```

### ✅ Correct

```javascript
export async function DELETE(req) {
  await client.log({ action: 'user.deleted', userId: req.params.id });
  await db.user.delete(req.params.id);
  return Response.json({ success: true });
}
```

```javascript
export async function PUT(req) {
  const data = await req.json();
  logvault.log({ action: 'user.updated', userId: data.id });
  await db.user.update(data);
  return Response.json({ success: true });
}
```

## Options

### `methods`

Type: `string[]`
Default: `["DELETE", "PUT", "POST", "PATCH"]`

HTTP methods to check for audit logging.

```json
{
  "rules": {
    "logvault/require-audit-in-mutations": ["warn", {
      "methods": ["DELETE", "PUT"]
    }]
  }
}
```

### `auditFunctions`

Type: `string[]`
Default: `["client.log", "logvault.log", "audit.log"]`

Customize which function names are recognized as audit logging.

### `ignorePaths`

Type: `string[]`
Default: `[]`

File path patterns to ignore (glob syntax).

```json
{
  "rules": {
    "logvault/require-audit-in-mutations": ["warn", {
      "ignorePaths": ["**/health/**", "**/ping/**", "**/*.test.ts"]
    }]
  }
}
```

## When Not To Use It

- For health check endpoints
- For internal/non-user-facing mutations
- In test files

## Framework Support

This rule works with:

- **Next.js App Router** - `app/api/*/route.ts`
- **Express** - Named route handlers
- **Fastify** - Handler functions
- **Hono** - Route handlers

## Related Rules

- [logvault/require-audit-in-catch](./require-audit-in-catch.md)
- [logvault/no-pii-in-logs](./no-pii-in-logs.md)

