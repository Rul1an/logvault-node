# @logvault/client

## 1.0.0

### Minor Changes

- 22f208f: ## Monorepo Migration & New Features

  ### @logvault/client v0.5.0
  - **TypedClient**: New type-safe logging with Zod schema validation
  - **Local Mode**: Console logging for development with PII detection
  - **createTypedLogger**: Factory function for specialized loggers

  ### @logvault/schemas v0.2.0
  - **50+ Event Schemas**: Pre-built Zod schemas for common audit events
  - **PII Transformers**: hashedEmail, maskedString, anonymizedIp
  - **Schema Registry**: validateEvent, isKnownAction, getActionCategory
  - **JSON Schema Export**: Cross-language compatibility

  ### @logvault/cli v0.2.0
  - **OAuth Flow**: Secure browser-based authentication
  - **API Key Retrieval**: Fetch keys directly to terminal
  - **Doctor Command**: Validate your LogVault setup

### Patch Changes

- Updated dependencies [22f208f]
  - @logvault/schemas@0.2.0
