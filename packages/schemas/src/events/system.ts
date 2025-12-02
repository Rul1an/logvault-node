/**
 * System Event Schemas
 *
 * Schemas for system-level audit events:
 * - Configuration changes
 * - API key management
 * - System errors
 * - Admin actions
 *
 * @module @logvault/schemas/events
 */

import { z } from "zod";
import { BaseEventSchema } from "../common/base";

/**
 * API key created event.
 *
 * Log when a new API key is generated.
 */
export const SystemApiKeyCreatedSchema = BaseEventSchema.extend({
  action: z.literal("system.api_key_created"),
  metadata: z.object({
    /** Key prefix (never log full key) */
    keyPrefix: z.string(),
    /** Key name/label */
    name: z.string().optional(),
    /** Key scopes/permissions */
    scopes: z.array(z.string()).optional(),
    /** When the key expires */
    expiresAt: z.string().datetime().optional(),
    /** Who created the key */
    createdBy: z.string().optional(),
  }),
});

export type SystemApiKeyCreatedEvent = z.infer<
  typeof SystemApiKeyCreatedSchema
>;

/**
 * API key revoked event.
 *
 * Log when an API key is revoked.
 */
export const SystemApiKeyRevokedSchema = BaseEventSchema.extend({
  action: z.literal("system.api_key_revoked"),
  metadata: z.object({
    /** Key prefix */
    keyPrefix: z.string(),
    /** Who revoked the key */
    revokedBy: z.string(),
    /** Reason for revocation */
    reason: z.string().optional(),
  }),
});

export type SystemApiKeyRevokedEvent = z.infer<
  typeof SystemApiKeyRevokedSchema
>;

/**
 * Configuration changed event.
 *
 * Log when system configuration is modified.
 */
export const SystemConfigChangedSchema = BaseEventSchema.extend({
  action: z.literal("system.config_changed"),
  metadata: z.object({
    /** What setting was changed */
    setting: z.string(),
    /** Previous value (be careful with sensitive data) */
    previousValue: z.unknown().optional(),
    /** New value (be careful with sensitive data) */
    newValue: z.unknown().optional(),
    /** Who made the change */
    changedBy: z.string(),
  }),
});

export type SystemConfigChangedEvent = z.infer<
  typeof SystemConfigChangedSchema
>;

/**
 * Webhook created event.
 *
 * Log when a webhook endpoint is configured.
 */
export const SystemWebhookCreatedSchema = BaseEventSchema.extend({
  action: z.literal("system.webhook_created"),
  metadata: z.object({
    /** Webhook ID */
    webhookId: z.string(),
    /** Target URL (consider masking) */
    url: z.string().url(),
    /** Events subscribed to */
    events: z.array(z.string()),
    /** Who created it */
    createdBy: z.string().optional(),
  }),
});

export type SystemWebhookCreatedEvent = z.infer<
  typeof SystemWebhookCreatedSchema
>;

/**
 * Webhook deleted event.
 *
 * Log when a webhook is removed.
 */
export const SystemWebhookDeletedSchema = BaseEventSchema.extend({
  action: z.literal("system.webhook_deleted"),
  metadata: z.object({
    /** Webhook ID */
    webhookId: z.string(),
    /** Who deleted it */
    deletedBy: z.string(),
  }),
});

export type SystemWebhookDeletedEvent = z.infer<
  typeof SystemWebhookDeletedSchema
>;

/**
 * Integration enabled event.
 *
 * Log when a third-party integration is enabled.
 */
export const SystemIntegrationEnabledSchema = BaseEventSchema.extend({
  action: z.literal("system.integration_enabled"),
  metadata: z.object({
    /** Integration name */
    integration: z.string(),
    /** Who enabled it */
    enabledBy: z.string(),
    /** Configuration details (be careful with secrets) */
    config: z.record(z.unknown()).optional(),
  }),
});

export type SystemIntegrationEnabledEvent = z.infer<
  typeof SystemIntegrationEnabledSchema
>;

/**
 * Integration disabled event.
 *
 * Log when a third-party integration is disabled.
 */
export const SystemIntegrationDisabledSchema = BaseEventSchema.extend({
  action: z.literal("system.integration_disabled"),
  metadata: z.object({
    /** Integration name */
    integration: z.string(),
    /** Who disabled it */
    disabledBy: z.string(),
    /** Reason for disabling */
    reason: z.string().optional(),
  }),
});

export type SystemIntegrationDisabledEvent = z.infer<
  typeof SystemIntegrationDisabledSchema
>;

/**
 * Error occurred event.
 *
 * Log significant system errors for audit purposes.
 */
export const SystemErrorOccurredSchema = BaseEventSchema.extend({
  action: z.literal("system.error_occurred"),
  metadata: z.object({
    /** Error code */
    code: z.string(),
    /** Error message */
    message: z.string(),
    /** Error severity */
    severity: z.enum(["low", "medium", "high", "critical"]),
    /** Stack trace (be careful with sensitive data) */
    stackTrace: z.string().optional(),
    /** Request ID for correlation */
    requestId: z.string().optional(),
  }),
});

export type SystemErrorOccurredEvent = z.infer<
  typeof SystemErrorOccurredSchema
>;

/**
 * Maintenance started event.
 *
 * Log when system maintenance begins.
 */
export const SystemMaintenanceStartedSchema = BaseEventSchema.extend({
  action: z.literal("system.maintenance_started"),
  metadata: z.object({
    /** Maintenance reason */
    reason: z.string(),
    /** Expected duration in minutes */
    expectedDuration: z.number().optional(),
    /** Who initiated it */
    initiatedBy: z.string(),
    /** Affected services */
    affectedServices: z.array(z.string()).optional(),
  }),
});

export type SystemMaintenanceStartedEvent = z.infer<
  typeof SystemMaintenanceStartedSchema
>;

/**
 * Maintenance ended event.
 *
 * Log when system maintenance completes.
 */
export const SystemMaintenanceEndedSchema = BaseEventSchema.extend({
  action: z.literal("system.maintenance_ended"),
  metadata: z.object({
    /** Actual duration in minutes */
    duration: z.number(),
    /** Outcome */
    outcome: z.enum(["success", "partial", "failed"]),
    /** Any issues encountered */
    issues: z.array(z.string()).optional(),
  }),
});

export type SystemMaintenanceEndedEvent = z.infer<
  typeof SystemMaintenanceEndedSchema
>;

/**
 * Union of all system events.
 */
export const SystemEventSchema = z.discriminatedUnion("action", [
  SystemApiKeyCreatedSchema,
  SystemApiKeyRevokedSchema,
  SystemConfigChangedSchema,
  SystemWebhookCreatedSchema,
  SystemWebhookDeletedSchema,
  SystemIntegrationEnabledSchema,
  SystemIntegrationDisabledSchema,
  SystemErrorOccurredSchema,
  SystemMaintenanceStartedSchema,
  SystemMaintenanceEndedSchema,
]);

export type SystemEvent = z.infer<typeof SystemEventSchema>;

/**
 * List of all system event actions.
 */
export const SYSTEM_ACTIONS = [
  "system.api_key_created",
  "system.api_key_revoked",
  "system.config_changed",
  "system.webhook_created",
  "system.webhook_deleted",
  "system.integration_enabled",
  "system.integration_disabled",
  "system.error_occurred",
  "system.maintenance_started",
  "system.maintenance_ended",
] as const;

export type SystemAction = (typeof SYSTEM_ACTIONS)[number];
