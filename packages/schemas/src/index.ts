/**
 * @logvault/schemas
 *
 * Type-safe Zod schemas for LogVault audit events.
 *
 * @example
 * ```typescript
 * import {
 *   LogVaultEventSchema,
 *   validateEvent,
 *   AuthLoginSchema,
 *   type AuthLoginEvent
 * } from '@logvault/schemas';
 *
 * // Validate any event
 * const event = validateEvent({
 *   action: 'auth.login',
 *   userId: 'user_123',
 *   metadata: { method: 'password' }
 * });
 *
 * // Use specific schemas for type safety
 * const loginEvent: AuthLoginEvent = {
 *   action: 'auth.login',
 *   userId: 'user_123',
 *   metadata: { method: 'oauth', provider: 'google' }
 * };
 * ```
 *
 * @packageDocumentation
 */

// Re-export everything from submodules
export * from "./common";
export * from "./events";
export * from "./registry";

// Version
export const VERSION = "0.1.0";
