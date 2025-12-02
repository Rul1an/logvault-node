/**
 * User Event Schemas
 *
 * Schemas for user lifecycle audit events:
 * - User creation
 * - User updates
 * - User deletion
 * - Role changes
 *
 * @module @logvault/schemas/events
 */

import { z } from "zod";
import { BaseEventSchema } from "../common/base";

/**
 * User creation sources.
 */
export const UserSourceSchema = z.enum([
  "signup",
  "invite",
  "import",
  "api",
  "admin",
  "sso",
]);

export type UserSource = z.infer<typeof UserSourceSchema>;

/**
 * Data retention options for user deletion.
 */
export const DataRetentionSchema = z.enum([
  "deleted",
  "anonymized",
  "retained",
]);

export type DataRetention = z.infer<typeof DataRetentionSchema>;

/**
 * User created event.
 *
 * Log when a new user account is created.
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'user.created',
 *   userId: 'user_123',
 *   resource: 'org_456',
 *   metadata: {
 *     source: 'invite',
 *     role: 'member',
 *     invitedBy: 'user_admin'
 *   }
 * });
 * ```
 */
export const UserCreatedSchema = BaseEventSchema.extend({
  action: z.literal("user.created"),
  metadata: z
    .object({
      /** How the user was created */
      source: UserSourceSchema.optional(),
      /** Initial role assigned */
      role: z.string().optional(),
      /** Who invited/created this user */
      invitedBy: z.string().optional(),
      /** Organization ID */
      organizationId: z.string().optional(),
      /** Whether email is verified */
      emailVerified: z.boolean().optional(),
    })
    .optional(),
});

export type UserCreatedEvent = z.infer<typeof UserCreatedSchema>;

/**
 * User updated event.
 *
 * Log when user profile information is changed.
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'user.updated',
 *   userId: 'user_123',
 *   metadata: {
 *     fields: ['name', 'email'],
 *     updatedBy: 'user'
 *   }
 * });
 * ```
 */
export const UserUpdatedSchema = BaseEventSchema.extend({
  action: z.literal("user.updated"),
  metadata: z
    .object({
      /** Which fields were updated */
      fields: z.array(z.string()),
      /** Who made the update */
      updatedBy: z.enum(["user", "admin", "system"]).optional(),
      /** Previous values (be careful with PII) */
      previousValues: z.record(z.unknown()).optional(),
    })
    .optional(),
});

export type UserUpdatedEvent = z.infer<typeof UserUpdatedSchema>;

/**
 * User deleted event.
 *
 * Log when a user account is deleted.
 * Required for GDPR compliance (right to erasure).
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'user.deleted',
 *   userId: 'user_123',
 *   metadata: {
 *     deletedBy: 'admin_456',
 *     reason: 'User requested account deletion',
 *     dataRetention: 'anonymized'
 *   }
 * });
 * ```
 */
export const UserDeletedSchema = BaseEventSchema.extend({
  action: z.literal("user.deleted"),
  metadata: z.object({
    /** Who performed the deletion */
    deletedBy: z.string(),
    /** Reason for deletion */
    reason: z.string().optional(),
    /** How data was handled */
    dataRetention: DataRetentionSchema.optional(),
    /** Whether this was a GDPR request */
    gdprRequest: z.boolean().optional(),
  }),
});

export type UserDeletedEvent = z.infer<typeof UserDeletedSchema>;

/**
 * User suspended event.
 *
 * Log when a user account is suspended (not deleted).
 */
export const UserSuspendedSchema = BaseEventSchema.extend({
  action: z.literal("user.suspended"),
  metadata: z
    .object({
      /** Who suspended the user */
      suspendedBy: z.string(),
      /** Reason for suspension */
      reason: z.string().optional(),
      /** When suspension expires (if temporary) */
      expiresAt: z.string().datetime().optional(),
    })
    .optional(),
});

export type UserSuspendedEvent = z.infer<typeof UserSuspendedSchema>;

/**
 * User reactivated event.
 *
 * Log when a suspended user is reactivated.
 */
export const UserReactivatedSchema = BaseEventSchema.extend({
  action: z.literal("user.reactivated"),
  metadata: z
    .object({
      /** Who reactivated the user */
      reactivatedBy: z.string(),
      /** Reason for reactivation */
      reason: z.string().optional(),
    })
    .optional(),
});

export type UserReactivatedEvent = z.infer<typeof UserReactivatedSchema>;

/**
 * User role changed event.
 *
 * Log when a user's role is changed.
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'user.role_changed',
 *   userId: 'user_123',
 *   metadata: {
 *     previousRole: 'member',
 *     newRole: 'admin',
 *     changedBy: 'user_owner'
 *   }
 * });
 * ```
 */
export const UserRoleChangedSchema = BaseEventSchema.extend({
  action: z.literal("user.role_changed"),
  metadata: z.object({
    /** Previous role */
    previousRole: z.string(),
    /** New role */
    newRole: z.string(),
    /** Who made the change */
    changedBy: z.string(),
    /** Reason for change */
    reason: z.string().optional(),
  }),
});

export type UserRoleChangedEvent = z.infer<typeof UserRoleChangedSchema>;

/**
 * User email verified event.
 *
 * Log when a user verifies their email address.
 */
export const UserEmailVerifiedSchema = BaseEventSchema.extend({
  action: z.literal("user.email_verified"),
  metadata: z
    .object({
      /** Verification method */
      method: z.enum(["link", "code"]).optional(),
    })
    .optional(),
});

export type UserEmailVerifiedEvent = z.infer<typeof UserEmailVerifiedSchema>;

/**
 * User invited event.
 *
 * Log when a user is invited to join.
 */
export const UserInvitedSchema = BaseEventSchema.extend({
  action: z.literal("user.invited"),
  metadata: z
    .object({
      /** Who sent the invite */
      invitedBy: z.string(),
      /** Role they'll have when they join */
      role: z.string().optional(),
      /** Organization they're invited to */
      organizationId: z.string().optional(),
      /** When the invite expires */
      expiresAt: z.string().datetime().optional(),
    })
    .optional(),
});

export type UserInvitedEvent = z.infer<typeof UserInvitedSchema>;

/**
 * Union of all user events.
 */
export const UserEventSchema = z.discriminatedUnion("action", [
  UserCreatedSchema,
  UserUpdatedSchema,
  UserDeletedSchema,
  UserSuspendedSchema,
  UserReactivatedSchema,
  UserRoleChangedSchema,
  UserEmailVerifiedSchema,
  UserInvitedSchema,
]);

export type UserEvent = z.infer<typeof UserEventSchema>;

/**
 * List of all user event actions.
 */
export const USER_ACTIONS = [
  "user.created",
  "user.updated",
  "user.deleted",
  "user.suspended",
  "user.reactivated",
  "user.role_changed",
  "user.email_verified",
  "user.invited",
] as const;

export type UserAction = (typeof USER_ACTIONS)[number];
