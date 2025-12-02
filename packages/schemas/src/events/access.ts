/**
 * Access Control Event Schemas
 *
 * Schemas for access control audit events:
 * - Permission grants/revokes
 * - Role assignments
 * - Resource access
 *
 * @module @logvault/schemas/events
 */

import { z } from "zod";
import { BaseEventSchema } from "../common/base";

/**
 * Access granted event.
 *
 * Log when access is granted to a user or resource.
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'access.granted',
 *   userId: 'user_123',
 *   resource: 'doc_456',
 *   metadata: {
 *     permission: 'read',
 *     grantedBy: 'user_admin',
 *     scope: 'document'
 *   }
 * });
 * ```
 */
export const AccessGrantedSchema = BaseEventSchema.extend({
  action: z.literal("access.granted"),
  metadata: z.object({
    /** Permission being granted */
    permission: z.string(),
    /** Who granted the access */
    grantedBy: z.string(),
    /** When access expires (if temporary) */
    expiresAt: z.string().datetime().optional(),
    /** Scope of the permission */
    scope: z.string().optional(),
    /** Reason for granting */
    reason: z.string().optional(),
  }),
});

export type AccessGrantedEvent = z.infer<typeof AccessGrantedSchema>;

/**
 * Access revoked event.
 *
 * Log when access is revoked from a user or resource.
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'access.revoked',
 *   userId: 'user_123',
 *   resource: 'doc_456',
 *   metadata: {
 *     permission: 'read',
 *     revokedBy: 'user_admin',
 *     reason: 'Project ended'
 *   }
 * });
 * ```
 */
export const AccessRevokedSchema = BaseEventSchema.extend({
  action: z.literal("access.revoked"),
  metadata: z.object({
    /** Permission being revoked */
    permission: z.string(),
    /** Who revoked the access */
    revokedBy: z.string(),
    /** Reason for revoking */
    reason: z.string().optional(),
  }),
});

export type AccessRevokedEvent = z.infer<typeof AccessRevokedSchema>;

/**
 * Access denied event.
 *
 * Log when a user is denied access to a resource.
 * Important for security monitoring.
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'access.denied',
 *   userId: 'user_123',
 *   resource: 'doc_456',
 *   metadata: {
 *     permission: 'write',
 *     reason: 'insufficient_permissions'
 *   }
 * });
 * ```
 */
export const AccessDeniedSchema = BaseEventSchema.extend({
  action: z.literal("access.denied"),
  metadata: z
    .object({
      /** Permission that was requested */
      permission: z.string().optional(),
      /** Why access was denied */
      reason: z
        .enum([
          "insufficient_permissions",
          "resource_not_found",
          "resource_deleted",
          "account_suspended",
          "rate_limited",
          "ip_blocked",
          "unknown",
        ])
        .optional(),
      /** Client IP address */
      ip: z.string().ip().optional(),
    })
    .optional(),
});

export type AccessDeniedEvent = z.infer<typeof AccessDeniedSchema>;

/**
 * Access requested event.
 *
 * Log when a user requests access to a resource.
 */
export const AccessRequestedSchema = BaseEventSchema.extend({
  action: z.literal("access.requested"),
  metadata: z
    .object({
      /** Permission being requested */
      permission: z.string(),
      /** Reason for the request */
      reason: z.string().optional(),
      /** Who should approve */
      approver: z.string().optional(),
    })
    .optional(),
});

export type AccessRequestedEvent = z.infer<typeof AccessRequestedSchema>;

/**
 * Access approved event.
 *
 * Log when an access request is approved.
 */
export const AccessApprovedSchema = BaseEventSchema.extend({
  action: z.literal("access.approved"),
  metadata: z.object({
    /** Permission being approved */
    permission: z.string(),
    /** Who approved the request */
    approvedBy: z.string(),
    /** Original request ID */
    requestId: z.string().optional(),
    /** When access expires */
    expiresAt: z.string().datetime().optional(),
  }),
});

export type AccessApprovedEvent = z.infer<typeof AccessApprovedSchema>;

/**
 * Access rejected event.
 *
 * Log when an access request is rejected.
 */
export const AccessRejectedSchema = BaseEventSchema.extend({
  action: z.literal("access.rejected"),
  metadata: z.object({
    /** Permission that was requested */
    permission: z.string(),
    /** Who rejected the request */
    rejectedBy: z.string(),
    /** Reason for rejection */
    reason: z.string().optional(),
    /** Original request ID */
    requestId: z.string().optional(),
  }),
});

export type AccessRejectedEvent = z.infer<typeof AccessRejectedSchema>;

/**
 * Access expired event.
 *
 * Log when temporary access expires.
 */
export const AccessExpiredSchema = BaseEventSchema.extend({
  action: z.literal("access.expired"),
  metadata: z
    .object({
      /** Permission that expired */
      permission: z.string(),
      /** When it was originally granted */
      grantedAt: z.string().datetime().optional(),
    })
    .optional(),
});

export type AccessExpiredEvent = z.infer<typeof AccessExpiredSchema>;

/**
 * Union of all access events.
 */
export const AccessEventSchema = z.discriminatedUnion("action", [
  AccessGrantedSchema,
  AccessRevokedSchema,
  AccessDeniedSchema,
  AccessRequestedSchema,
  AccessApprovedSchema,
  AccessRejectedSchema,
  AccessExpiredSchema,
]);

export type AccessEvent = z.infer<typeof AccessEventSchema>;

/**
 * List of all access event actions.
 */
export const ACCESS_ACTIONS = [
  "access.granted",
  "access.revoked",
  "access.denied",
  "access.requested",
  "access.approved",
  "access.rejected",
  "access.expired",
] as const;

export type AccessAction = (typeof ACCESS_ACTIONS)[number];
