/**
 * Common Schemas and Utilities
 *
 * Shared schemas, types, and utilities used across all event schemas.
 *
 * @module @logvault/schemas/common
 */

// Base event schema
export {
  BaseEventSchema,
  ACTION_PATTERN,
  isValidAction,
  parseAction,
  type BaseEvent,
  type BaseEventInput,
} from "./base";

// PII utilities
export {
  hashedEmail,
  maskedString,
  anonymizedIp,
  hashedValue,
  redacted,
  detectPII,
  detectPIIInMetadata,
  PII_PATTERNS,
  type HashedEmail,
  type MaskedString,
  type AnonymizedIp,
  type Redacted,
} from "./pii";
