# logvault/no-pii-in-logs

💼⚠️ This rule is enabled in the following configs: `recommended` (as error), `strict` (as error).

Disallows logging PII (Personally Identifiable Information) directly without transformation.

## Rule Details

This rule prevents logging sensitive user data without proper transformation. Direct PII logging creates:

- **Privacy violations** - GDPR, CCPA, HIPAA compliance issues
- **Security risks** - Exposed data in logs
- **Legal liability** - Data breach notification requirements

## Examples

### ❌ Incorrect

```javascript
// Direct email access
await client.log({
  action: 'user.created',
  metadata: { email: user.email } // PII exposed!
});
```

```javascript
// Multiple PII fields
await client.log({
  action: 'user.updated',
  metadata: {
    email: user.email,
    phone: user.phone,
    ssn: user.ssn
  }
});
```

### ✅ Correct

```javascript
import { hashedEmail, maskedString } from '@logvault/schemas';

await client.log({
  action: 'user.created',
  metadata: { email: hashedEmail.parse(user.email) }
});
```

```javascript
await client.log({
  action: 'user.updated',
  metadata: {
    email: hashedEmail(user.email),
    phone: maskedString(user.phone),
    // Don't log SSN at all, or use tokenization
  }
});
```

## Detected PII Fields

By default, the following field names are detected as PII:

| Category | Fields |
|----------|--------|
| Contact | `email`, `phone`, `phoneNumber`, `mobile`, `address`, `streetAddress` |
| Identity | `ssn`, `socialSecurityNumber`, `dateOfBirth`, `dob`, `birthDate` |
| Financial | `creditCard`, `creditCardNumber`, `cardNumber`, `bankAccount`, `accountNumber`, `routingNumber`, `iban`, `swift` |
| Documents | `passport`, `passportNumber`, `driversLicense`, `licenseNumber` |
| Technical | `ipAddress`, `ip`, `password`, `secret`, `token`, `apiKey`, `apiSecret`, `privateKey` |

## Options

### `piiFields`

Type: `string[]`

Additional field names to consider as PII.

```json
{
  "rules": {
    "logvault/no-pii-in-logs": ["error", {
      "piiFields": ["customerId", "taxId", "employeeId"]
    }]
  }
}
```

### `transformers`

Type: `string[]`
Default: `["hashedEmail", "maskedString", "anonymizedIp", "hash", "mask", "anonymize", "redact", "encrypt", "tokenize"]`

Function names that safely transform PII.

```json
{
  "rules": {
    "logvault/no-pii-in-logs": ["error", {
      "transformers": ["hashedEmail", "myCustomHash", "piiSafe"]
    }]
  }
}
```

### `auditFunctions`

Type: `string[]`
Default: `["client.log", "logvault.log", "audit.log"]`

Which logging functions to check.

## Using @logvault/schemas Transformers

The `@logvault/schemas` package provides ready-to-use PII transformers:

```typescript
import { hashedEmail, maskedString, anonymizedIp } from '@logvault/schemas';

// Email: "user@example.com" → { _type: "hashed_email", hash: "abc123", domain: "example.com" }
hashedEmail.parse("user@example.com");

// String: "sensitive" → "s*******e"
maskedString.parse("sensitive");

// IP: "192.168.1.100" → "192.168.xxx.xxx"
anonymizedIp.parse("192.168.1.100");
```

## When Not To Use It

- In development-only logging (use environment checks)
- For internal system-to-system logs without user data
- When logging tokenized/encrypted identifiers

## Related Rules

- [logvault/require-audit-in-catch](./require-audit-in-catch.md)
- [logvault/require-audit-in-mutations](./require-audit-in-mutations.md)

## Further Reading

- [GDPR Article 32 - Security of Processing](https://gdpr-info.eu/art-32-gdpr/)
- [CCPA Privacy Rights](https://oag.ca.gov/privacy/ccpa)
- [@logvault/schemas PII Transformers](https://www.npmjs.com/package/@logvault/schemas)

