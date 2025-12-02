/**
 * Authentication Event Schemas
 *
 * Schemas for authentication-related audit events:
 * - Login/logout
 * - Password changes
 * - MFA operations
 * - Session management
 *
 * @module @logvault/schemas/events
 */

import { z } from "zod";
import { BaseEventSchema } from "../common/base";

/**
 * Authentication methods supported by LogVault.
 */
export const AuthMethodSchema = z.enum([
  "password",
  "oauth",
  "sso",
  "magic_link",
  "passkey",
  "api_key",
]);

export type AuthMethod = z.infer<typeof AuthMethodSchema>;

/**
 * MFA methods supported by LogVault.
 */
export const MfaMethodSchema = z.enum(["totp", "sms", "email", "passkey"]);

export type MfaMethod = z.infer<typeof MfaMethodSchema>;

/**
 * User login event.
 *
 * Log when a user successfully authenticates.
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'auth.login',
 *   userId: 'user_123',
 *   metadata: {
 *     method: 'password',
 *     ip: '192.168.1.1',
 *     mfaUsed: true
 *   }
 * });
 * ```
 */
export const AuthLoginSchema = BaseEventSchema.extend({
  action: z.literal("auth.login"),
  metadata: z
    .object({
      /** How the user authenticated */
      method: AuthMethodSchema,
      /** OAuth/SSO provider name (e.g., 'google', 'okta') */
      provider: z.string().optional(),
      /** Client IP address */
      ip: z.string().ip().optional(),
      /** Browser user agent */
      userAgent: z.string().optional(),
      /** Whether MFA was used */
      mfaUsed: z.boolean().optional(),
      /** Session ID created */
      sessionId: z.string().optional(),
    })
    .optional(),
});

export type AuthLoginEvent = z.infer<typeof AuthLoginSchema>;

/**
 * User logout event.
 *
 * Log when a user's session ends.
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'auth.logout',
 *   userId: 'user_123',
 *   metadata: {
 *     reason: 'user_initiated',
 *     sessionDuration: 3600
 *   }
 * });
 * ```
 */
export const AuthLogoutSchema = BaseEventSchema.extend({
  action: z.literal("auth.logout"),
  metadata: z
    .object({
      /** Why the session ended */
      reason: z
        .enum(["user_initiated", "session_expired", "forced", "security"])
        .optional(),
      /** How long the session lasted (seconds) */
      sessionDuration: z.number().optional(),
      /** Session ID that ended */
      sessionId: z.string().optional(),
    })
    .optional(),
});

export type AuthLogoutEvent = z.infer<typeof AuthLogoutSchema>;

/**
 * Login failed event.
 *
 * Log failed authentication attempts for security monitoring.
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'auth.login_failed',
 *   userId: 'user_123', // or 'unknown' if user not found
 *   metadata: {
 *     reason: 'invalid_password',
 *     ip: '192.168.1.1',
 *     attemptCount: 3
 *   }
 * });
 * ```
 */
export const AuthLoginFailedSchema = BaseEventSchema.extend({
  action: z.literal("auth.login_failed"),
  metadata: z
    .object({
      /** Why authentication failed */
      reason: z
        .enum([
          "invalid_password",
          "invalid_email",
          "account_locked",
          "account_disabled",
          "mfa_failed",
          "rate_limited",
          "unknown",
        ])
        .optional(),
      /** Client IP address */
      ip: z.string().ip().optional(),
      /** Number of failed attempts */
      attemptCount: z.number().optional(),
      /** Browser user agent */
      userAgent: z.string().optional(),
    })
    .optional(),
});

export type AuthLoginFailedEvent = z.infer<typeof AuthLoginFailedSchema>;

/**
 * Password changed event.
 *
 * Log when a user's password is changed.
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'auth.password_changed',
 *   userId: 'user_123',
 *   metadata: {
 *     initiatedBy: 'user',
 *     requiresReauth: true
 *   }
 * });
 * ```
 */
export const AuthPasswordChangedSchema = BaseEventSchema.extend({
  action: z.literal("auth.password_changed"),
  metadata: z
    .object({
      /** Who initiated the change */
      initiatedBy: z.enum(["user", "admin", "system"]).optional(),
      /** Whether user needs to re-authenticate */
      requiresReauth: z.boolean().optional(),
      /** Was this a password reset flow */
      wasReset: z.boolean().optional(),
    })
    .optional(),
});

export type AuthPasswordChangedEvent = z.infer<
  typeof AuthPasswordChangedSchema
>;

/**
 * Password reset requested event.
 *
 * Log when a password reset is requested.
 */
export const AuthPasswordResetRequestedSchema = BaseEventSchema.extend({
  action: z.literal("auth.password_reset_requested"),
  metadata: z
    .object({
      /** Client IP address */
      ip: z.string().ip().optional(),
      /** Email address (consider hashing) */
      email: z.string().email().optional(),
    })
    .optional(),
});

export type AuthPasswordResetRequestedEvent = z.infer<
  typeof AuthPasswordResetRequestedSchema
>;

/**
 * MFA enabled event.
 *
 * Log when a user enables multi-factor authentication.
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'auth.mfa_enabled',
 *   userId: 'user_123',
 *   metadata: {
 *     method: 'totp'
 *   }
 * });
 * ```
 */
export const AuthMfaEnabledSchema = BaseEventSchema.extend({
  action: z.literal("auth.mfa_enabled"),
  metadata: z
    .object({
      /** MFA method enabled */
      method: MfaMethodSchema,
    })
    .optional(),
});

export type AuthMfaEnabledEvent = z.infer<typeof AuthMfaEnabledSchema>;

/**
 * MFA disabled event.
 *
 * Log when a user disables multi-factor authentication.
 */
export const AuthMfaDisabledSchema = BaseEventSchema.extend({
  action: z.literal("auth.mfa_disabled"),
  metadata: z
    .object({
      /** MFA method disabled */
      method: MfaMethodSchema,
      /** Who initiated the change */
      initiatedBy: z.enum(["user", "admin", "system"]).optional(),
      /** Reason for disabling */
      reason: z.string().optional(),
    })
    .optional(),
});

export type AuthMfaDisabledEvent = z.infer<typeof AuthMfaDisabledSchema>;

/**
 * Session created event.
 *
 * Log when a new session is created.
 */
export const AuthSessionCreatedSchema = BaseEventSchema.extend({
  action: z.literal("auth.session_created"),
  metadata: z
    .object({
      /** Session ID */
      sessionId: z.string(),
      /** Device type */
      deviceType: z.enum(["desktop", "mobile", "tablet", "unknown"]).optional(),
      /** Client IP address */
      ip: z.string().ip().optional(),
      /** Browser user agent */
      userAgent: z.string().optional(),
    })
    .optional(),
});

export type AuthSessionCreatedEvent = z.infer<typeof AuthSessionCreatedSchema>;

/**
 * Session revoked event.
 *
 * Log when a session is forcefully terminated.
 */
export const AuthSessionRevokedSchema = BaseEventSchema.extend({
  action: z.literal("auth.session_revoked"),
  metadata: z
    .object({
      /** Session ID that was revoked */
      sessionId: z.string(),
      /** Who revoked the session */
      revokedBy: z.enum(["user", "admin", "system"]).optional(),
      /** Reason for revocation */
      reason: z.string().optional(),
    })
    .optional(),
});

export type AuthSessionRevokedEvent = z.infer<typeof AuthSessionRevokedSchema>;

/**
 * Union of all authentication events.
 *
 * Use discriminatedUnion for efficient parsing and type inference.
 */
export const AuthEventSchema = z.discriminatedUnion("action", [
  AuthLoginSchema,
  AuthLogoutSchema,
  AuthLoginFailedSchema,
  AuthPasswordChangedSchema,
  AuthPasswordResetRequestedSchema,
  AuthMfaEnabledSchema,
  AuthMfaDisabledSchema,
  AuthSessionCreatedSchema,
  AuthSessionRevokedSchema,
]);

export type AuthEvent = z.infer<typeof AuthEventSchema>;

/**
 * List of all auth event actions.
 */
export const AUTH_ACTIONS = [
  "auth.login",
  "auth.logout",
  "auth.login_failed",
  "auth.password_changed",
  "auth.password_reset_requested",
  "auth.mfa_enabled",
  "auth.mfa_disabled",
  "auth.session_created",
  "auth.session_revoked",
] as const;

export type AuthAction = (typeof AUTH_ACTIONS)[number];
