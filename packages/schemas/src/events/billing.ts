/**
 * Billing Event Schemas
 *
 * Schemas for billing and subscription audit events:
 * - Subscription changes
 * - Payment events
 * - Plan changes
 *
 * @module @logvault/schemas/events
 */

import { z } from "zod";
import { BaseEventSchema } from "../common/base";

/**
 * Subscription created event.
 *
 * Log when a new subscription is created.
 */
export const BillingSubscriptionCreatedSchema = BaseEventSchema.extend({
  action: z.literal("billing.subscription_created"),
  metadata: z.object({
    /** Plan ID or name */
    plan: z.string(),
    /** Billing interval */
    interval: z.enum(["monthly", "yearly", "custom"]),
    /** Price in cents */
    amount: z.number().optional(),
    /** Currency code */
    currency: z.string().optional(),
    /** Trial period in days */
    trialDays: z.number().optional(),
  }),
});

export type BillingSubscriptionCreatedEvent = z.infer<
  typeof BillingSubscriptionCreatedSchema
>;

/**
 * Subscription updated event.
 *
 * Log when a subscription is modified.
 */
export const BillingSubscriptionUpdatedSchema = BaseEventSchema.extend({
  action: z.literal("billing.subscription_updated"),
  metadata: z.object({
    /** Previous plan */
    previousPlan: z.string().optional(),
    /** New plan */
    newPlan: z.string().optional(),
    /** What changed */
    changes: z.array(z.string()),
    /** Who made the change */
    updatedBy: z.string().optional(),
  }),
});

export type BillingSubscriptionUpdatedEvent = z.infer<
  typeof BillingSubscriptionUpdatedSchema
>;

/**
 * Subscription cancelled event.
 *
 * Log when a subscription is cancelled.
 */
export const BillingSubscriptionCancelledSchema = BaseEventSchema.extend({
  action: z.literal("billing.subscription_cancelled"),
  metadata: z.object({
    /** Plan that was cancelled */
    plan: z.string(),
    /** Reason for cancellation */
    reason: z.string().optional(),
    /** When access ends */
    endsAt: z.string().datetime().optional(),
    /** Who cancelled */
    cancelledBy: z.string().optional(),
    /** Feedback provided */
    feedback: z.string().optional(),
  }),
});

export type BillingSubscriptionCancelledEvent = z.infer<
  typeof BillingSubscriptionCancelledSchema
>;

/**
 * Payment succeeded event.
 *
 * Log when a payment is successfully processed.
 */
export const BillingPaymentSucceededSchema = BaseEventSchema.extend({
  action: z.literal("billing.payment_succeeded"),
  metadata: z.object({
    /** Amount in cents */
    amount: z.number(),
    /** Currency code */
    currency: z.string(),
    /** Payment method type */
    paymentMethod: z.enum(["card", "bank_transfer", "invoice", "other"]),
    /** Invoice ID */
    invoiceId: z.string().optional(),
  }),
});

export type BillingPaymentSucceededEvent = z.infer<
  typeof BillingPaymentSucceededSchema
>;

/**
 * Payment failed event.
 *
 * Log when a payment fails.
 */
export const BillingPaymentFailedSchema = BaseEventSchema.extend({
  action: z.literal("billing.payment_failed"),
  metadata: z.object({
    /** Amount in cents */
    amount: z.number(),
    /** Currency code */
    currency: z.string(),
    /** Failure reason */
    reason: z.string(),
    /** Retry attempt number */
    attemptNumber: z.number().optional(),
    /** Invoice ID */
    invoiceId: z.string().optional(),
  }),
});

export type BillingPaymentFailedEvent = z.infer<
  typeof BillingPaymentFailedSchema
>;

/**
 * Invoice created event.
 *
 * Log when an invoice is generated.
 */
export const BillingInvoiceCreatedSchema = BaseEventSchema.extend({
  action: z.literal("billing.invoice_created"),
  metadata: z.object({
    /** Invoice ID */
    invoiceId: z.string(),
    /** Amount in cents */
    amount: z.number(),
    /** Currency code */
    currency: z.string(),
    /** Due date */
    dueDate: z.string().datetime().optional(),
  }),
});

export type BillingInvoiceCreatedEvent = z.infer<
  typeof BillingInvoiceCreatedSchema
>;

/**
 * Refund issued event.
 *
 * Log when a refund is processed.
 */
export const BillingRefundIssuedSchema = BaseEventSchema.extend({
  action: z.literal("billing.refund_issued"),
  metadata: z.object({
    /** Amount refunded in cents */
    amount: z.number(),
    /** Currency code */
    currency: z.string(),
    /** Reason for refund */
    reason: z.string(),
    /** Original payment ID */
    originalPaymentId: z.string().optional(),
    /** Who issued the refund */
    issuedBy: z.string().optional(),
  }),
});

export type BillingRefundIssuedEvent = z.infer<
  typeof BillingRefundIssuedSchema
>;

/**
 * Plan changed event.
 *
 * Log when a user upgrades or downgrades their plan.
 */
export const BillingPlanChangedSchema = BaseEventSchema.extend({
  action: z.literal("billing.plan_changed"),
  metadata: z.object({
    /** Previous plan */
    previousPlan: z.string(),
    /** New plan */
    newPlan: z.string(),
    /** Was this an upgrade or downgrade */
    direction: z.enum(["upgrade", "downgrade"]),
    /** Effective date */
    effectiveAt: z.string().datetime().optional(),
    /** Proration amount */
    prorationAmount: z.number().optional(),
  }),
});

export type BillingPlanChangedEvent = z.infer<typeof BillingPlanChangedSchema>;

/**
 * Union of all billing events.
 */
export const BillingEventSchema = z.discriminatedUnion("action", [
  BillingSubscriptionCreatedSchema,
  BillingSubscriptionUpdatedSchema,
  BillingSubscriptionCancelledSchema,
  BillingPaymentSucceededSchema,
  BillingPaymentFailedSchema,
  BillingInvoiceCreatedSchema,
  BillingRefundIssuedSchema,
  BillingPlanChangedSchema,
]);

export type BillingEvent = z.infer<typeof BillingEventSchema>;

/**
 * List of all billing event actions.
 */
export const BILLING_ACTIONS = [
  "billing.subscription_created",
  "billing.subscription_updated",
  "billing.subscription_cancelled",
  "billing.payment_succeeded",
  "billing.payment_failed",
  "billing.invoice_created",
  "billing.refund_issued",
  "billing.plan_changed",
] as const;

export type BillingAction = (typeof BILLING_ACTIONS)[number];
