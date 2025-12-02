/**
 * Base Event Schema
 *
 * Foundation schema for all LogVault audit events.
 * All domain-specific event schemas extend this base.
 *
 * @module @logvault/schemas/common
 */

import { z } from "zod";

/**
 * Regex pattern for valid action format: domain.verb
 * Examples: user.created, auth.login, document.deleted
 */
export const ACTION_PATTERN = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/**
 * Base schema for all audit events.
 *
 * All events must include:
 * - action: What happened (format: domain.verb)
 * - userId: Who did it (required for GDPR compliance)
 *
 * Optional fields:
 * - resource: What was affected
 * - metadata: Additional context
 * - timestamp: Client-provided timestamp (server is authoritative)
 *
 * @example
 * ```typescript
 * const event = BaseEventSchema.parse({
 *   action: 'user.created',
 *   userId: 'user_123',
 *   resource: 'org_456',
 *   metadata: { role: 'admin' }
 * });
 * ```
 */
export const BaseEventSchema = z.object({
  /**
   * Event action in format: {domain}.{verb}
   *
   * Domain represents the entity (user, document, access)
   * Verb represents the action (created, deleted, granted)
   *
   * @example 'user.created', 'document.deleted', 'access.granted'
   */
  action: z
    .string()
    .regex(
      ACTION_PATTERN,
      "Action must be in format: domain.verb (e.g., user.created)",
    ),

  /**
   * Unique identifier of the actor (user) performing the action.
   *
   * Required for GDPR compliance - enables data subject requests.
   * Use a stable identifier that can be used to find all events for a user.
   *
   * @example 'user_123', 'usr_abc456'
   */
  userId: z.string().min(1, "userId is required for audit compliance"),

  /**
   * Identifier of the resource being acted upon.
   *
   * Optional but recommended for context.
   * Can be any stable identifier for the affected entity.
   *
   * @example 'doc_789', 'org_456', 'file_abc'
   */
  resource: z.string().optional(),

  /**
   * Additional context about the event.
   *
   * Use for any extra information that helps understand the event.
   * Avoid storing raw PII - use hashed/masked values instead.
   *
   * @example { ip: '192.168.1.1', browser: 'Chrome', changes: ['email', 'name'] }
   */
  metadata: z.record(z.unknown()).optional(),

  /**
   * Client-provided timestamp.
   *
   * Optional - server timestamp is authoritative.
   * Useful for offline-first scenarios or when client time matters.
   *
   * Accepts Date objects or ISO 8601 strings.
   */
  timestamp: z.union([z.date(), z.string().datetime()]).optional(),
});

/**
 * Inferred TypeScript type for base events.
 */
export type BaseEvent = z.infer<typeof BaseEventSchema>;

/**
 * Input type for creating base events (before validation).
 */
export type BaseEventInput = z.input<typeof BaseEventSchema>;

/**
 * Validate an action string format.
 *
 * @param action - The action string to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidAction('user.created'); // true
 * isValidAction('invalid'); // false
 * isValidAction('User.Created'); // false (must be lowercase)
 * ```
 */
export function isValidAction(action: string): boolean {
  return ACTION_PATTERN.test(action);
}

/**
 * Parse an action string into domain and verb components.
 *
 * @param action - The action string to parse
 * @returns Object with domain and verb, or null if invalid
 *
 * @example
 * ```typescript
 * parseAction('user.created'); // { domain: 'user', verb: 'created' }
 * parseAction('invalid'); // null
 * ```
 */
export function parseAction(
  action: string,
): { domain: string; verb: string } | null {
  if (!isValidAction(action)) return null;
  const [domain, verb] = action.split(".");
  return domain && verb ? { domain, verb } : null;
}
