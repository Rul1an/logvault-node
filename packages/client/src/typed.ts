/**
 * Type-Safe Event Logging with Zod Schemas
 *
 * This module provides enhanced type safety using @logvault/schemas.
 * Install @logvault/schemas for full type inference and validation.
 *
 * @example
 * ```typescript
 * import { TypedClient } from '@logvault/client/typed';
 * import { AuthLoginSchema } from '@logvault/schemas';
 *
 * const client = new TypedClient({ apiKey: '...' });
 *
 * // Full type safety and validation
 * await client.logTyped(AuthLoginSchema, {
 *   action: 'auth.login',
 *   userId: 'user_123',
 *   metadata: { method: 'password' }
 * });
 * ```
 *
 * @module @logvault/client/typed
 */

import { Client } from "./client";
import type { LogVaultOptions, AuditEventResponse } from "./types";

// Type-only import for Zod - won't fail if not installed
type ZodType<T = unknown> = {
  parse: (data: unknown) => T;
  safeParse: (
    data: unknown,
  ) => { success: true; data: T } | { success: false; error: unknown };
};

type ZodInfer<T extends ZodType> = T extends ZodType<infer U> ? U : never;

/**
 * Extended client with type-safe event logging.
 *
 * Requires @logvault/schemas to be installed for full functionality.
 */
export class TypedClient extends Client {
  private validateEvents: boolean;

  constructor(options: LogVaultOptions & { validateEvents?: boolean }) {
    super(options);
    this.validateEvents = options.validateEvents ?? true;
  }

  /**
   * Log an event with full type safety and validation.
   *
   * @param schema - Zod schema from @logvault/schemas
   * @param event - Event data matching the schema
   * @returns Promise with the created event
   *
   * @example
   * ```typescript
   * import { AuthLoginSchema } from '@logvault/schemas';
   *
   * await client.logTyped(AuthLoginSchema, {
   *   action: 'auth.login',
   *   userId: 'user_123',
   *   metadata: { method: 'password' }
   * });
   * ```
   */
  async logTyped<T extends ZodType>(
    schema: T,
    event: ZodInfer<T>,
  ): Promise<AuditEventResponse> {
    if (this.validateEvents) {
      // Validate with schema before sending
      const result = schema.safeParse(event);
      if (!result.success) {
        throw new Error(
          `Event validation failed: ${JSON.stringify(result.error)}`,
        );
      }
      return this.log(result.data as Parameters<typeof this.log>[0]);
    }

    return this.log(event as Parameters<typeof this.log>[0]);
  }

  /**
   * Log multiple events with type safety.
   *
   * @param schema - Zod schema from @logvault/schemas
   * @param events - Array of events matching the schema
   * @returns Promise with array of created events
   */
  async logTypedBatch<T extends ZodType>(
    schema: T,
    events: ZodInfer<T>[],
  ): Promise<AuditEventResponse[]> {
    const results: AuditEventResponse[] = [];

    for (const event of events) {
      const result = await this.logTyped(schema, event);
      results.push(result);
    }

    return results;
  }
}

/**
 * Create a typed logger function for a specific event type.
 *
 * @param client - LogVault client instance
 * @param schema - Zod schema for the event type
 * @returns Function to log events of that type
 *
 * @example
 * ```typescript
 * import { AuthLoginSchema, AuthLogoutSchema } from '@logvault/schemas';
 *
 * const client = new Client({ apiKey: '...' });
 *
 * const logLogin = createTypedLogger(client, AuthLoginSchema);
 * const logLogout = createTypedLogger(client, AuthLogoutSchema);
 *
 * // Use with full type safety
 * await logLogin({
 *   action: 'auth.login',
 *   userId: 'user_123',
 *   metadata: { method: 'password' }
 * });
 * ```
 */
export function createTypedLogger<T extends ZodType>(
  client: Client,
  schema: T,
): (event: ZodInfer<T>) => Promise<AuditEventResponse> {
  return async (event: ZodInfer<T>) => {
    const result = schema.safeParse(event);
    if (!result.success) {
      throw new Error(
        `Event validation failed: ${JSON.stringify(result.error)}`,
      );
    }
    return client.log(result.data as Parameters<typeof client.log>[0]);
  };
}

/**
 * Validate an event against a schema without logging.
 *
 * @param schema - Zod schema to validate against
 * @param event - Event data to validate
 * @returns Validation result
 */
export function validateEventSchema<T extends ZodType>(
  schema: T,
  event: unknown,
): { success: true; data: ZodInfer<T> } | { success: false; errors: unknown } {
  const result = schema.safeParse(event);
  if (result.success) {
    return { success: true, data: result.data as ZodInfer<T> };
  }
  return { success: false, errors: result.error };
}
