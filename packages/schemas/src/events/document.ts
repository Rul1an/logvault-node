/**
 * Document Event Schemas
 *
 * Schemas for document/resource lifecycle audit events:
 * - Document CRUD operations
 * - Version management
 * - Sharing and collaboration
 *
 * @module @logvault/schemas/events
 */

import { z } from "zod";
import { BaseEventSchema } from "../common/base";

/**
 * Document created event.
 *
 * Log when a new document/resource is created.
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'document.created',
 *   userId: 'user_123',
 *   resource: 'doc_456',
 *   metadata: {
 *     title: 'Q4 Report',
 *     type: 'report',
 *     parentId: 'folder_789'
 *   }
 * });
 * ```
 */
export const DocumentCreatedSchema = BaseEventSchema.extend({
  action: z.literal("document.created"),
  metadata: z
    .object({
      /** Document title/name */
      title: z.string().optional(),
      /** Document type */
      type: z.string().optional(),
      /** Parent folder/container */
      parentId: z.string().optional(),
      /** File size in bytes */
      size: z.number().optional(),
      /** MIME type */
      mimeType: z.string().optional(),
    })
    .optional(),
});

export type DocumentCreatedEvent = z.infer<typeof DocumentCreatedSchema>;

/**
 * Document read/viewed event.
 *
 * Log when a document is accessed/viewed.
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'document.read',
 *   userId: 'user_123',
 *   resource: 'doc_456',
 *   metadata: {
 *     version: 3,
 *     accessType: 'view'
 *   }
 * });
 * ```
 */
export const DocumentReadSchema = BaseEventSchema.extend({
  action: z.literal("document.read"),
  metadata: z
    .object({
      /** Version accessed */
      version: z.number().optional(),
      /** Type of access */
      accessType: z.enum(["view", "download", "preview"]).optional(),
      /** Client IP address */
      ip: z.string().ip().optional(),
    })
    .optional(),
});

export type DocumentReadEvent = z.infer<typeof DocumentReadSchema>;

/**
 * Document updated event.
 *
 * Log when a document is modified.
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'document.updated',
 *   userId: 'user_123',
 *   resource: 'doc_456',
 *   metadata: {
 *     fields: ['content', 'title'],
 *     previousVersion: 2,
 *     newVersion: 3
 *   }
 * });
 * ```
 */
export const DocumentUpdatedSchema = BaseEventSchema.extend({
  action: z.literal("document.updated"),
  metadata: z
    .object({
      /** Fields that were changed */
      fields: z.array(z.string()).optional(),
      /** Previous version number */
      previousVersion: z.number().optional(),
      /** New version number */
      newVersion: z.number().optional(),
      /** Size change in bytes */
      sizeChange: z.number().optional(),
    })
    .optional(),
});

export type DocumentUpdatedEvent = z.infer<typeof DocumentUpdatedSchema>;

/**
 * Document deleted event.
 *
 * Log when a document is deleted.
 *
 * @example
 * ```typescript
 * await client.log({
 *   action: 'document.deleted',
 *   userId: 'user_123',
 *   resource: 'doc_456',
 *   metadata: {
 *     deletedBy: 'user_123',
 *     permanent: false,
 *     reason: 'User requested deletion'
 *   }
 * });
 * ```
 */
export const DocumentDeletedSchema = BaseEventSchema.extend({
  action: z.literal("document.deleted"),
  metadata: z
    .object({
      /** Who deleted the document */
      deletedBy: z.string().optional(),
      /** Was it permanently deleted or soft-deleted */
      permanent: z.boolean().optional(),
      /** Reason for deletion */
      reason: z.string().optional(),
      /** Document title (for audit trail) */
      title: z.string().optional(),
    })
    .optional(),
});

export type DocumentDeletedEvent = z.infer<typeof DocumentDeletedSchema>;

/**
 * Document shared event.
 *
 * Log when a document is shared with others.
 */
export const DocumentSharedSchema = BaseEventSchema.extend({
  action: z.literal("document.shared"),
  metadata: z.object({
    /** Who the document was shared with */
    sharedWith: z.array(z.string()),
    /** Permission level granted */
    permission: z.enum(["view", "comment", "edit", "admin"]),
    /** When sharing expires */
    expiresAt: z.string().datetime().optional(),
    /** Was a link created */
    linkSharing: z.boolean().optional(),
  }),
});

export type DocumentSharedEvent = z.infer<typeof DocumentSharedSchema>;

/**
 * Document unshared event.
 *
 * Log when sharing is removed from a document.
 */
export const DocumentUnsharedSchema = BaseEventSchema.extend({
  action: z.literal("document.unshared"),
  metadata: z.object({
    /** Who lost access */
    unsharedFrom: z.array(z.string()),
    /** Who removed the sharing */
    removedBy: z.string().optional(),
  }),
});

export type DocumentUnsharedEvent = z.infer<typeof DocumentUnsharedSchema>;

/**
 * Document moved event.
 *
 * Log when a document is moved to a different location.
 */
export const DocumentMovedSchema = BaseEventSchema.extend({
  action: z.literal("document.moved"),
  metadata: z.object({
    /** Previous parent/folder */
    fromParent: z.string(),
    /** New parent/folder */
    toParent: z.string(),
    /** Who moved it */
    movedBy: z.string().optional(),
  }),
});

export type DocumentMovedEvent = z.infer<typeof DocumentMovedSchema>;

/**
 * Document copied event.
 *
 * Log when a document is copied.
 */
export const DocumentCopiedSchema = BaseEventSchema.extend({
  action: z.literal("document.copied"),
  metadata: z.object({
    /** Source document ID */
    sourceId: z.string(),
    /** New document ID */
    newId: z.string(),
    /** Who made the copy */
    copiedBy: z.string().optional(),
  }),
});

export type DocumentCopiedEvent = z.infer<typeof DocumentCopiedSchema>;

/**
 * Document restored event.
 *
 * Log when a deleted document is restored.
 */
export const DocumentRestoredSchema = BaseEventSchema.extend({
  action: z.literal("document.restored"),
  metadata: z
    .object({
      /** Who restored it */
      restoredBy: z.string(),
      /** Version restored to */
      version: z.number().optional(),
    })
    .optional(),
});

export type DocumentRestoredEvent = z.infer<typeof DocumentRestoredSchema>;

/**
 * Document exported event.
 *
 * Log when a document is exported.
 */
export const DocumentExportedSchema = BaseEventSchema.extend({
  action: z.literal("document.exported"),
  metadata: z
    .object({
      /** Export format */
      format: z.string(),
      /** Who exported it */
      exportedBy: z.string().optional(),
      /** Client IP address */
      ip: z.string().ip().optional(),
    })
    .optional(),
});

export type DocumentExportedEvent = z.infer<typeof DocumentExportedSchema>;

/**
 * Union of all document events.
 */
export const DocumentEventSchema = z.discriminatedUnion("action", [
  DocumentCreatedSchema,
  DocumentReadSchema,
  DocumentUpdatedSchema,
  DocumentDeletedSchema,
  DocumentSharedSchema,
  DocumentUnsharedSchema,
  DocumentMovedSchema,
  DocumentCopiedSchema,
  DocumentRestoredSchema,
  DocumentExportedSchema,
]);

export type DocumentEvent = z.infer<typeof DocumentEventSchema>;

/**
 * List of all document event actions.
 */
export const DOCUMENT_ACTIONS = [
  "document.created",
  "document.read",
  "document.updated",
  "document.deleted",
  "document.shared",
  "document.unshared",
  "document.moved",
  "document.copied",
  "document.restored",
  "document.exported",
] as const;

export type DocumentAction = (typeof DOCUMENT_ACTIONS)[number];
