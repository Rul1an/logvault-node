/**
 * Data Event Schemas
 *
 * Schemas for data-related audit events:
 * - Data exports (GDPR)
 * - Data imports
 * - Data deletions
 * - Bulk operations
 *
 * @module @logvault/schemas/events
 */

import { z } from "zod";
import { BaseEventSchema } from "../common/base";

/**
 * Data exported event.
 *
 * Log when data is exported from the system.
 * Required for GDPR compliance (right to data portability).
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'data.exported',
 *   userId: 'user_123',
 *   metadata: {
 *     format: 'json',
 *     scope: 'user_data',
 *     recordCount: 1500,
 *     gdprRequest: true
 *   }
 * });
 * ```
 */
export const DataExportedSchema = BaseEventSchema.extend({
  action: z.literal("data.exported"),
  metadata: z.object({
    /** Export format */
    format: z.enum(["json", "csv", "xml", "pdf", "zip"]),
    /** What was exported */
    scope: z.string(),
    /** Number of records exported */
    recordCount: z.number().optional(),
    /** Was this a GDPR request */
    gdprRequest: z.boolean().optional(),
    /** Who requested the export */
    requestedBy: z.string().optional(),
    /** File size in bytes */
    fileSize: z.number().optional(),
  }),
});

export type DataExportedEvent = z.infer<typeof DataExportedSchema>;

/**
 * Data imported event.
 *
 * Log when data is imported into the system.
 */
export const DataImportedSchema = BaseEventSchema.extend({
  action: z.literal("data.imported"),
  metadata: z.object({
    /** Import format */
    format: z.enum(["json", "csv", "xml", "api"]),
    /** What was imported */
    scope: z.string(),
    /** Number of records imported */
    recordCount: z.number(),
    /** Number of records that failed */
    failedCount: z.number().optional(),
    /** Who performed the import */
    importedBy: z.string().optional(),
    /** Source of the import */
    source: z.string().optional(),
  }),
});

export type DataImportedEvent = z.infer<typeof DataImportedSchema>;

/**
 * Data deleted event.
 *
 * Log when data is deleted from the system.
 * Required for GDPR compliance (right to erasure).
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'data.deleted',
 *   userId: 'user_123',
 *   metadata: {
 *     scope: 'user_profile',
 *     recordCount: 1,
 *     gdprRequest: true,
 *     permanent: true
 *   }
 * });
 * ```
 */
export const DataDeletedSchema = BaseEventSchema.extend({
  action: z.literal("data.deleted"),
  metadata: z.object({
    /** What was deleted */
    scope: z.string(),
    /** Number of records deleted */
    recordCount: z.number(),
    /** Was this a GDPR request */
    gdprRequest: z.boolean().optional(),
    /** Was it permanently deleted */
    permanent: z.boolean().optional(),
    /** Who performed the deletion */
    deletedBy: z.string().optional(),
    /** Reason for deletion */
    reason: z.string().optional(),
  }),
});

export type DataDeletedEvent = z.infer<typeof DataDeletedSchema>;

/**
 * Data anonymized event.
 *
 * Log when data is anonymized (GDPR alternative to deletion).
 */
export const DataAnonymizedSchema = BaseEventSchema.extend({
  action: z.literal("data.anonymized"),
  metadata: z.object({
    /** What was anonymized */
    scope: z.string(),
    /** Number of records anonymized */
    recordCount: z.number(),
    /** Fields that were anonymized */
    fields: z.array(z.string()).optional(),
    /** Was this a GDPR request */
    gdprRequest: z.boolean().optional(),
    /** Who performed the anonymization */
    anonymizedBy: z.string().optional(),
  }),
});

export type DataAnonymizedEvent = z.infer<typeof DataAnonymizedSchema>;

/**
 * Data accessed event.
 *
 * Log when sensitive data is accessed.
 */
export const DataAccessedSchema = BaseEventSchema.extend({
  action: z.literal("data.accessed"),
  metadata: z
    .object({
      /** What data was accessed */
      scope: z.string(),
      /** How it was accessed */
      accessType: z.enum(["read", "query", "api", "export"]).optional(),
      /** Number of records accessed */
      recordCount: z.number().optional(),
      /** Client IP address */
      ip: z.string().ip().optional(),
    })
    .optional(),
});

export type DataAccessedEvent = z.infer<typeof DataAccessedSchema>;

/**
 * Data backup created event.
 *
 * Log when a data backup is created.
 */
export const DataBackupCreatedSchema = BaseEventSchema.extend({
  action: z.literal("data.backup_created"),
  metadata: z.object({
    /** Backup type */
    type: z.enum(["full", "incremental", "differential"]),
    /** Size in bytes */
    size: z.number().optional(),
    /** Where it's stored */
    location: z.string().optional(),
    /** Retention period in days */
    retentionDays: z.number().optional(),
  }),
});

export type DataBackupCreatedEvent = z.infer<typeof DataBackupCreatedSchema>;

/**
 * Data restored event.
 *
 * Log when data is restored from backup.
 */
export const DataRestoredSchema = BaseEventSchema.extend({
  action: z.literal("data.restored"),
  metadata: z.object({
    /** Backup ID used */
    backupId: z.string(),
    /** What was restored */
    scope: z.string(),
    /** Who performed the restore */
    restoredBy: z.string(),
    /** Number of records restored */
    recordCount: z.number().optional(),
  }),
});

export type DataRestoredEvent = z.infer<typeof DataRestoredSchema>;

/**
 * Union of all data events.
 */
export const DataEventSchema = z.discriminatedUnion("action", [
  DataExportedSchema,
  DataImportedSchema,
  DataDeletedSchema,
  DataAnonymizedSchema,
  DataAccessedSchema,
  DataBackupCreatedSchema,
  DataRestoredSchema,
]);

export type DataEvent = z.infer<typeof DataEventSchema>;

/**
 * List of all data event actions.
 */
export const DATA_ACTIONS = [
  "data.exported",
  "data.imported",
  "data.deleted",
  "data.anonymized",
  "data.accessed",
  "data.backup_created",
  "data.restored",
] as const;

export type DataAction = (typeof DATA_ACTIONS)[number];
