// =============================================================================
// Type-Safe Audit Event Template
// =============================================================================
// Copy this file to your project and customize for your use case.
// This is a starting point - add your own actions as needed.
//
// Usage:
//   import { trackEvent, AUDIT_ACTIONS } from './events';
//   await trackEvent({ action: AUDIT_ACTIONS.USER_LOGIN, actorId: 'user_123' });
// =============================================================================

import { LogVault } from "@logvault/client";

// Initialize client (use environment variable in production)
const client = new LogVault(process.env.LOGVAULT_API_KEY || "");

// =============================================================================
// AUDIT ACTIONS TAXONOMY
// =============================================================================
// Naming Convention:
// - Format: resource.action or resource.sub_resource.action
// - Always lowercase
// - Use dots for hierarchy
// - Use underscores for multi-word resources/actions

export const AUDIT_ACTIONS = {
  // ===========================================================================
  // Authentication Events
  // ===========================================================================
  AUTH_LOGIN_SUCCESS: "auth.login.success",
  AUTH_LOGIN_FAILED: "auth.login.failed",
  AUTH_LOGOUT: "auth.logout",
  AUTH_SIGNUP_ATTEMPT: "auth.signup.attempt",
  AUTH_SIGNUP_COMPLETED: "auth.signup.completed",
  AUTH_PASSWORD_RESET_REQUESTED: "auth.password_reset.requested",
  AUTH_PASSWORD_RESET_COMPLETED: "auth.password_reset.completed",
  AUTH_EMAIL_VERIFIED: "auth.email.verified",
  AUTH_MFA_ENABLED: "auth.mfa.enabled",
  AUTH_MFA_DISABLED: "auth.mfa.disabled",

  // ===========================================================================
  // User Events
  // ===========================================================================
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  USER_PASSWORD_CHANGED: "user.password_changed",
  USER_PROFILE_UPDATED: "user.profile_updated",

  // ===========================================================================
  // Resource CRUD Pattern
  // ===========================================================================
  // Replace "resource" with your entity name (e.g., document, invoice, order)
  RESOURCE_CREATED: "resource.created",
  RESOURCE_VIEWED: "resource.viewed",
  RESOURCE_UPDATED: "resource.updated",
  RESOURCE_DELETED: "resource.deleted",
  RESOURCE_EXPORTED: "resource.exported",

  // ===========================================================================
  // Team/Member Events
  // ===========================================================================
  TEAM_MEMBER_INVITED: "team.member.invited",
  TEAM_MEMBER_JOINED: "team.member.joined",
  TEAM_MEMBER_REMOVED: "team.member.removed",
  TEAM_MEMBER_ROLE_CHANGED: "team.member.role_changed",

  // ===========================================================================
  // API Key Events
  // ===========================================================================
  API_KEY_CREATED: "api_key.created",
  API_KEY_REVOKED: "api_key.revoked",
  API_KEY_ROTATED: "api_key.rotated",

  // ===========================================================================
  // Settings Events
  // ===========================================================================
  SETTINGS_UPDATED: "settings.updated",
  NOTIFICATION_PREFERENCES_UPDATED: "notification.preferences_updated",

  // ===========================================================================
  // Security Events
  // ===========================================================================
  SECURITY_ALERT_TRIGGERED: "security.alert_triggered",
  SUSPICIOUS_ACTIVITY_DETECTED: "security.suspicious_activity_detected",

  // ===========================================================================
  // Add Your Own Actions Below
  // ===========================================================================
  // Example:
  // ORDER_PLACED: "order.placed",
  // PAYMENT_COMPLETED: "payment.completed",
  // INVOICE_GENERATED: "invoice.generated",
} as const;

// =============================================================================
// TYPES
// =============================================================================

/** Union type of all valid audit actions */
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/** Actor types for audit events */
export type ActorType = "user" | "service" | "system" | "api_key";

/** Options for tracking an audit event */
export interface TrackEventOptions {
  /** The action being performed (use AUDIT_ACTIONS constant) */
  action: AuditAction;
  /** ID of the entity performing the action */
  actorId: string;
  /** Type of actor */
  actorType?: ActorType;
  /** ID of the entity being acted upon */
  targetId?: string;
  /** Type of target entity */
  targetType?: string;
  /** Additional context for the event */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// TRACK FUNCTION
// =============================================================================

/**
 * Track an audit event with full type safety.
 *
 * @example
 * await trackEvent({
 *   action: AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS,
 *   actorId: user.id,
 *   metadata: {
 *     ip: request.ip,
 *     userAgent: request.headers.get('user-agent'),
 *   },
 * });
 */
export async function trackEvent(options: TrackEventOptions): Promise<void> {
  await client.log({
    action: options.action,
    actorId: options.actorId,
    actorType: options.actorType || "user",
    targetId: options.targetId,
    targetType: options.targetType,
    metadata: options.metadata,
  });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a pre-configured tracker for a specific actor.
 * Useful when you need to track multiple events for the same user.
 *
 * @example
 * const track = createActorTracker(user.id, 'user');
 * await track(AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS);
 * await track(AUDIT_ACTIONS.SETTINGS_UPDATED, { targetId: 'settings_123' });
 */
export function createActorTracker(
  actorId: string,
  actorType: ActorType = "user"
) {
  return async (
    action: AuditAction,
    options?: Omit<TrackEventOptions, "action" | "actorId" | "actorType">
  ): Promise<void> => {
    await trackEvent({
      action,
      actorId,
      actorType,
      ...options,
    });
  };
}

/**
 * Create a pre-configured tracker for system events.
 *
 * @example
 * const systemTrack = createSystemTracker('billing-service');
 * await systemTrack(AUDIT_ACTIONS.RESOURCE_CREATED, { targetId: resource.id });
 */
export function createSystemTracker(serviceName: string) {
  return createActorTracker(serviceName, "system");
}

// =============================================================================
// VALIDATION
// =============================================================================

/** Validate that an action string matches the naming convention. */
export function isValidActionFormat(action: string): boolean {
  const pattern = /^[a-z]+([._][a-z0-9]+)+$/;
  return pattern.test(action);
}

/** Check if an action is a known action from AUDIT_ACTIONS. */
export function isKnownAction(action: string): action is AuditAction {
  return Object.values(AUDIT_ACTIONS).includes(action as AuditAction);
}

