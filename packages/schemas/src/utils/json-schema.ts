/**
 * JSON Schema Export Utilities
 *
 * Export Zod schemas as JSON Schema for use with:
 * - Python SDK validation
 * - API documentation
 * - OpenAPI specs
 *
 * @module @logvault/schemas/utils
 */

import type { ZodType } from "zod";

// Note: zod-to-json-schema is a devDependency
// This file is primarily used for build-time generation

/**
 * Convert a Zod schema to JSON Schema.
 *
 * Requires zod-to-json-schema to be installed.
 *
 * @param schema - Zod schema to convert
 * @param name - Name for the schema
 * @returns JSON Schema object
 *
 * @example
 * ```typescript
 * import { AuthLoginSchema } from '@logvault/schemas/events';
 * import { toJsonSchema } from '@logvault/schemas/utils';
 *
 * const jsonSchema = toJsonSchema(AuthLoginSchema, 'AuthLogin');
 * // Use with Python jsonschema library
 * ```
 */
export async function toJsonSchema(schema: ZodType, name?: string) {
  // Dynamic import to avoid bundling zod-to-json-schema in main bundle
  const { zodToJsonSchema } = await import("zod-to-json-schema");

  return zodToJsonSchema(schema, {
    name,
    $refStrategy: "none",
    target: "jsonSchema7",
  });
}

/**
 * Export all event schemas as a single JSON Schema.
 *
 * @returns Complete JSON Schema for all LogVault events
 */
export async function exportAllSchemas() {
  const { LogVaultEventSchema } = await import("../registry");

  return toJsonSchema(LogVaultEventSchema, "LogVaultEvent");
}

/**
 * Export schemas for a specific category.
 *
 * @param category - Event category to export
 * @returns JSON Schema for the category
 */
export async function exportCategorySchema(
  category:
    | "auth"
    | "user"
    | "access"
    | "document"
    | "data"
    | "billing"
    | "system",
) {
  const events = await import("../events");

  const schemaMap = {
    auth: events.AuthEventSchema,
    user: events.UserEventSchema,
    access: events.AccessEventSchema,
    document: events.DocumentEventSchema,
    data: events.DataEventSchema,
    billing: events.BillingEventSchema,
    system: events.SystemEventSchema,
  };

  const schema = schemaMap[category];
  return toJsonSchema(
    schema,
    `${category.charAt(0).toUpperCase() + category.slice(1)}Event`,
  );
}

/**
 * Generate a JSON Schema file for Python SDK.
 *
 * This is typically called during build to create a static JSON file.
 *
 * @returns JSON string of the complete schema
 */
export async function generatePythonSchema(): Promise<string> {
  const schema = await exportAllSchemas();
  return JSON.stringify(schema, null, 2);
}
