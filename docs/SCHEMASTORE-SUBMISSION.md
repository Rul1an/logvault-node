# JSON Schema Store Submission

Guide for submitting the LogVault audit event schema to [schemastore.org](https://schemastore.org).

## Benefits

- **IDE autocomplete** - Users get autocomplete when editing JSON audit events
- **Validation** - Instant feedback on invalid event structures
- **Discoverability** - Schema appears in JSON Schema Store catalog
- **Standard positioning** - Establishes LogVault as a thought leader

## Submission Steps

### 1. Fork SchemaStore Repository

```bash
git clone https://github.com/SchemaStore/schemastore.git
cd schemastore
```

### 2. Add Schema File

Copy the schema to `src/schemas/json/logvault-audit-event.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://json.schemastore.org/logvault-audit-event.json",
  "title": "LogVault Audit Event",
  "description": "Schema for audit events sent to LogVault API",
  "type": "object",
  "required": ["action", "actorId"],
  "properties": {
    "action": {
      "type": "string",
      "pattern": "^[a-z]+([._][a-z]+)+$",
      "minLength": 3,
      "maxLength": 100,
      "description": "Event action in resource.action format (lowercase, dot-separated)"
    },
    "actorId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 255,
      "description": "Unique identifier of the entity performing the action"
    },
    "actorType": {
      "type": "string",
      "enum": ["user", "service", "system", "api_key"],
      "default": "user"
    },
    "targetId": {
      "type": "string",
      "maxLength": 255
    },
    "targetType": {
      "type": "string",
      "maxLength": 100
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    }
  },
  "additionalProperties": false
}
```

### 3. Update Catalog

Add entry to `src/api/json/catalog.json`:

```json
{
  "name": "LogVault Audit Event",
  "description": "Schema for audit events sent to LogVault",
  "fileMatch": [
    "logvault-event.json",
    "logvault-events.json",
    "**/audit-events/*.json"
  ],
  "url": "https://json.schemastore.org/logvault-audit-event.json"
}
```

### 4. Add Test File

Create test file at `src/test/logvault-audit-event/logvault-audit-event.json`:

```json
{
  "action": "user.login",
  "actorId": "user_123",
  "actorType": "user",
  "metadata": {
    "ip": "192.168.1.1"
  }
}
```

### 5. Submit PR

```bash
git checkout -b add-logvault-audit-event-schema
git add .
git commit -m "Add LogVault audit event schema"
git push origin add-logvault-audit-event-schema
```

Open PR with description:

```markdown
## Add LogVault Audit Event Schema

This adds the JSON schema for [LogVault](https://logvault.eu) audit events.

**Schema URL:** https://logvault.eu/schemas/audit-event.json
**Documentation:** https://logvault.eu/docs/api
**npm package:** https://www.npmjs.com/package/@logvault/client

### File Matches

- `logvault-event.json`
- `logvault-events.json`
- `**/audit-events/*.json`

### Tests

- [x] Schema validates correctly
- [x] Test file passes validation
```

## Alternative: Self-Hosted Schema

If you prefer to host the schema yourself:

### 1. Host at logvault.eu

Already available at:

```
https://logvault.eu/schemas/audit-event.json
```

### 2. Add VS Code Settings

Users can add to their `.vscode/settings.json`:

```json
{
  "json.schemas": [
    {
      "fileMatch": ["**/audit-events/*.json", "logvault-*.json"],
      "url": "https://logvault.eu/schemas/audit-event.json"
    }
  ]
}
```

## Timeline

| Week | Action                         |
| ---- | ------------------------------ |
| 1    | Fork repo, prepare PR          |
| 2    | Submit PR, address feedback    |
| 3-4  | Wait for merge                 |
| 4+   | Announce in changelog/blog     |

## References

- [SchemaStore Contribution Guide](https://github.com/SchemaStore/schemastore/blob/master/CONTRIBUTING.md)
- [JSON Schema Draft-07](https://json-schema.org/specification-links.html#draft-7)
- [LogVault API Reference](https://logvault.eu/docs/api)

