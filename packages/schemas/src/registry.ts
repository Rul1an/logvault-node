/**
 * Schema Registry
 *
 * Central registry for all LogVault event schemas.
 * Provides validation, type inference, and utilities.
 *
 * @module @logvault/schemas
 */

import { z } from "zod";
import {
  AuthEventSchema,
  AUTH_ACTIONS,
  UserEventSchema,
  USER_ACTIONS,
  AccessEventSchema,
  ACCESS_ACTIONS,
  DocumentEventSchema,
  DOCUMENT_ACTIONS,
  DataEventSchema,
  DATA_ACTIONS,
  BillingEventSchema,
  BILLING_ACTIONS,
  SystemEventSchema,
  SYSTEM_ACTIONS,
} from "./events";
import { BaseEventSchema } from "./common/base";

/**
 * Complete schema for all LogVault events.
 *
 * Use this for validating any event type.
 * TypeScript will infer the correct type based on the action.
 *
 * @example
 * ```typescript
 * // Validates and infers type
 * const event = LogVaultEventSchema.parse({
 *   action: 'auth.login',
 *   userId: 'user_123',
 *   metadata: { method: 'password' }
 * });
 * // TypeScript knows: event is AuthLoginEvent
 * ```
 */
export const LogVaultEventSchema = z.union([
  AuthEventSchema,
  UserEventSchema,
  AccessEventSchema,
  DocumentEventSchema,
  DataEventSchema,
  BillingEventSchema,
  SystemEventSchema,
]);

/**
 * Inferred type for any LogVault event.
 */
export type LogVaultEvent = z.infer<typeof LogVaultEventSchema>;

/**
 * Schema for custom events (not in registry).
 *
 * Use this for events that don't fit predefined categories.
 * Still validates base event structure.
 */
export const CustomEventSchema = BaseEventSchema;

/**
 * All known event actions.
 */
export const ALL_ACTIONS = [
  ...AUTH_ACTIONS,
  ...USER_ACTIONS,
  ...ACCESS_ACTIONS,
  ...DOCUMENT_ACTIONS,
  ...DATA_ACTIONS,
  ...BILLING_ACTIONS,
  ...SYSTEM_ACTIONS,
] as const;

export type LogVaultAction = (typeof ALL_ACTIONS)[number];

/**
 * Event categories.
 */
export const EVENT_CATEGORIES = {
  auth: AUTH_ACTIONS,
  user: USER_ACTIONS,
  access: ACCESS_ACTIONS,
  document: DOCUMENT_ACTIONS,
  data: DATA_ACTIONS,
  billing: BILLING_ACTIONS,
  system: SYSTEM_ACTIONS,
} as const;

export type EventCategory = keyof typeof EVENT_CATEGORIES;

/**
 * Validate an event against the registry.
 *
 * @param event - Event to validate
 * @returns Validated event with correct type
 * @throws ZodError if validation fails
 *
 * @example
 * ```typescript
 * const event = validateEvent({
 *   action: 'auth.login',
 *   userId: 'user_123'
 * });
 * // event is typed as AuthLoginEvent
 * ```
 */
export function validateEvent<T extends LogVaultEvent>(event: T): T {
  return LogVaultEventSchema.parse(event) as T;
}

/**
 * Safe validation that returns a result object.
 *
 * @param event - Event to validate
 * @returns SafeParseResult with success/error
 *
 * @example
 * ```typescript
 * const result = safeValidateEvent(unknownData);
 * if (result.success) {
 *   console.log(result.data); // Validated event
 * } else {
 *   console.error(result.error); // ZodError
 * }
 * ```
 */
export function safeValidateEvent(event: unknown) {
  return LogVaultEventSchema.safeParse(event);
}

/**
 * Validate a custom event (not in registry).
 *
 * @param event - Event to validate
 * @returns Validated base event
 */
export function validateCustomEvent(event: unknown) {
  return CustomEventSchema.parse(event);
}

/**
 * Check if an action is a known LogVault action.
 *
 * @param action - Action string to check
 * @returns true if action is in registry
 */
export function isKnownAction(action: string): action is LogVaultAction {
  return ALL_ACTIONS.includes(action as LogVaultAction);
}

/**
 * Get the category for an action.
 *
 * @param action - Action string
 * @returns Category name or null if not found
 *
 * @example
 * ```typescript
 * getActionCategory('auth.login'); // 'auth'
 * getActionCategory('user.created'); // 'user'
 * getActionCategory('unknown.action'); // null
 * ```
 */
export function getActionCategory(action: string): EventCategory | null {
  for (const [category, actions] of Object.entries(EVENT_CATEGORIES)) {
    if ((actions as readonly string[]).includes(action)) {
      return category as EventCategory;
    }
  }
  return null;
}

/**
 * List all actions in a category.
 *
 * @param category - Category name
 * @returns Array of action strings
 */
export function getActionsInCategory(
  category: EventCategory,
): readonly string[] {
  return EVENT_CATEGORIES[category];
}

/**
 * Create a type guard for a specific event type.
 *
 * @param action - Action to check for
 * @returns Type guard function
 *
 * @example
 * ```typescript
 * const isLoginEvent = createEventGuard('auth.login');
 * if (isLoginEvent(event)) {
 *   // event is AuthLoginEvent
 *   console.log(event.metadata?.method);
 * }
 * ```
 */
export function createEventGuard<A extends LogVaultAction>(action: A) {
  return (
    event: LogVaultEvent,
  ): event is Extract<LogVaultEvent, { action: A }> => {
    return event.action === action;
  };
}

/**
 * Registry statistics.
 */
export const REGISTRY_STATS = {
  totalActions: ALL_ACTIONS.length,
  categories: Object.keys(EVENT_CATEGORIES).length,
  actionsByCategory: Object.fromEntries(
    Object.entries(EVENT_CATEGORIES).map(([k, v]) => [k, v.length]),
  ),
} as const;
