# logvault/require-audit-in-catch

💼 This rule is enabled in the following configs: `recommended`, `strict`.

Ensures catch blocks include audit logging for compliance tracking.

## Rule Details

This rule warns when a `catch` block doesn't contain a call to an audit logging function. Proper error tracking is essential for:

- **Compliance audits** - Prove all errors are logged
- **Debugging** - Trace issues in production
- **Security** - Detect anomalies and attacks

## Examples

### ❌ Incorrect

```javascript
try {
  await db.user.delete(id);
} catch (error) {
  console.error(error); // No audit trail!
}
```

```javascript
try {
  await api.call();
} catch (error) {
  // Empty catch - errors disappear silently
}
```

### ✅ Correct

```javascript
try {
  await db.user.delete(id);
} catch (error) {
  await client.log({ action: 'user.delete.failed', error });
  throw error;
}
```

```javascript
try {
  await api.call();
} catch (error) {
  logvault.log({ action: 'api.error', metadata: { message: error.message } });
  console.error(error);
}
```

## Options

### `allowConsoleError`

Type: `boolean`
Default: `false`

When `true`, allows `console.error` in catch blocks as a substitute for audit logging. Useful during development.

```json
{
  "rules": {
    "logvault/require-audit-in-catch": ["warn", { "allowConsoleError": true }]
  }
}
```

### `auditFunctions`

Type: `string[]`
Default: `["client.log", "logvault.log", "audit.log"]`

Customize which function names are recognized as audit logging.

```json
{
  "rules": {
    "logvault/require-audit-in-catch": ["warn", {
      "auditFunctions": ["client.log", "logger.audit", "trackError"]
    }]
  }
}
```

## When Not To Use It

- In test files where error handling is being tested
- In utility functions that intentionally swallow specific errors

## Related Rules

- [logvault/require-audit-in-mutations](./require-audit-in-mutations.md)
- [logvault/no-pii-in-logs](./no-pii-in-logs.md)

