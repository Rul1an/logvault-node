/**
 * PII-Safe Transformers
 *
 * Zod transformers for handling Personally Identifiable Information (PII)
 * in audit logs. These help maintain compliance while preserving utility.
 *
 * @module @logvault/schemas/common
 */

import { z } from "zod";
import { createHash } from "crypto";

/**
 * Hash an email address for audit logs.
 *
 * Transforms email to a hashed representation that:
 * - Cannot be reversed to original email
 * - Preserves domain for analytics
 * - Enables deduplication via hash
 *
 * @example
 * ```typescript
 * const schema = z.object({ email: hashedEmail });
 * schema.parse({ email: 'user@example.com' });
 * // { email: { _type: 'hashed_email', hash: 'a1b2c3...', domain: 'example.com' } }
 * ```
 */
export const hashedEmail = z
  .string()
  .email()
  .transform((email) => ({
    _type: "hashed_email" as const,
    hash: createHash("sha256")
      .update(email.toLowerCase())
      .digest("hex")
      .slice(0, 16),
    domain: email.split("@")[1],
  }));

/**
 * Inferred type for hashed email.
 */
export type HashedEmail = z.infer<typeof hashedEmail>;

/**
 * Mask a sensitive string for audit logs.
 *
 * Shows only first and last character, with asterisks in between.
 * Useful for names, identifiers, or other semi-sensitive data.
 *
 * @example
 * ```typescript
 * const schema = z.object({ name: maskedString });
 * schema.parse({ name: 'John Doe' });
 * // { name: 'J***e' }
 * ```
 */
export const maskedString = z.string().transform((str) => {
  if (str.length <= 4) return "****";
  return `${str[0]}***${str[str.length - 1]}`;
});

/**
 * Inferred type for masked string.
 */
export type MaskedString = z.infer<typeof maskedString>;

/**
 * Anonymize an IP address for audit logs.
 *
 * Preserves the first two octets for geographic analysis
 * while anonymizing the last two octets.
 *
 * @example
 * ```typescript
 * const schema = z.object({ ip: anonymizedIp });
 * schema.parse({ ip: '192.168.1.100' });
 * // { ip: '192.168.xxx.xxx' }
 * ```
 */
export const anonymizedIp = z
  .string()
  .ip()
  .transform((ip) => {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    // IPv6 - anonymize last 4 groups
    const ipv6Parts = ip.split(":");
    if (ipv6Parts.length >= 4) {
      return ipv6Parts.slice(0, 4).join(":") + ":xxxx:xxxx:xxxx:xxxx";
    }
    return ip;
  });

/**
 * Inferred type for anonymized IP.
 */
export type AnonymizedIp = z.infer<typeof anonymizedIp>;

/**
 * Hash any string value for audit logs.
 *
 * Creates a one-way hash that can be used for:
 * - Deduplication
 * - Correlation without exposing original value
 * - Compliance with data minimization
 *
 * @param length - Length of hash to return (default: 16)
 *
 * @example
 * ```typescript
 * const schema = z.object({ ssn: hashedValue(8) });
 * schema.parse({ ssn: '123-45-6789' });
 * // { ssn: 'a1b2c3d4' }
 * ```
 */
export function hashedValue(length: number = 16) {
  return z.string().transform((value) => ({
    _type: "hashed_value" as const,
    hash: createHash("sha256").update(value).digest("hex").slice(0, length),
  }));
}

/**
 * Redact a value completely.
 *
 * Replaces any value with [REDACTED].
 * Use for highly sensitive data that should never be logged.
 *
 * @example
 * ```typescript
 * const schema = z.object({ password: redacted });
 * schema.parse({ password: 'secret123' });
 * // { password: '[REDACTED]' }
 * ```
 */
export const redacted = z.unknown().transform(() => "[REDACTED]" as const);

/**
 * Inferred type for redacted value.
 */
export type Redacted = z.infer<typeof redacted>;

/**
 * Common PII field patterns to detect.
 *
 * Use with metadata validation to warn about potential PII.
 */
export const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  phone: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  ssn: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/,
  ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
} as const;

/**
 * Check if a string contains potential PII.
 *
 * @param value - String to check
 * @returns Array of detected PII types
 *
 * @example
 * ```typescript
 * detectPII('Contact: user@example.com, 555-123-4567');
 * // ['email', 'phone']
 * ```
 */
export function detectPII(value: string): (keyof typeof PII_PATTERNS)[] {
  const detected: (keyof typeof PII_PATTERNS)[] = [];

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    if (pattern.test(value)) {
      detected.push(type as keyof typeof PII_PATTERNS);
    }
  }

  return detected;
}

/**
 * Check if metadata object contains potential PII.
 *
 * Recursively checks all string values in the metadata.
 *
 * @param metadata - Metadata object to check
 * @returns Object mapping field paths to detected PII types
 *
 * @example
 * ```typescript
 * detectPIIInMetadata({ email: 'user@example.com', nested: { phone: '555-1234' } });
 * // { 'email': ['email'], 'nested.phone': ['phone'] }
 * ```
 */
export function detectPIIInMetadata(
  metadata: Record<string, unknown>,
  prefix: string = "",
): Record<string, (keyof typeof PII_PATTERNS)[]> {
  const results: Record<string, (keyof typeof PII_PATTERNS)[]> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      const detected = detectPII(value);
      if (detected.length > 0) {
        results[path] = detected;
      }
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(
        results,
        detectPIIInMetadata(value as Record<string, unknown>, path),
      );
    }
  }

  return results;
}
