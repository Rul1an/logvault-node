import { describe, it, expect } from "vitest";
import {
  AuthLoginSchema,
  AuthLogoutSchema,
  UserCreatedSchema,
  UserDeletedSchema,
  AccessGrantedSchema,
  AccessDeniedSchema,
  DocumentCreatedSchema,
  DocumentSharedSchema,
  DataExportedSchema,
  BillingPaymentSucceededSchema,
  SystemApiKeyCreatedSchema,
} from "../src/events";
import {
  validateEvent,
  safeValidateEvent,
  isKnownAction,
  getActionCategory,
  ALL_ACTIONS,
} from "../src/registry";

describe("Auth Events", () => {
  it("validates auth.login event", () => {
    const event = {
      action: "auth.login" as const,
      userId: "user_123",
      metadata: {
        method: "password" as const,
        ip: "192.168.1.1",
        mfaUsed: true,
      },
    };

    const result = AuthLoginSchema.safeParse(event);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action).toBe("auth.login");
      expect(result.data.metadata?.method).toBe("password");
    }
  });

  it("validates auth.logout event", () => {
    const event = {
      action: "auth.logout" as const,
      userId: "user_123",
      metadata: {
        reason: "user_initiated" as const,
        sessionDuration: 3600,
      },
    };

    const result = AuthLogoutSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it("rejects invalid auth method", () => {
    const event = {
      action: "auth.login",
      userId: "user_123",
      metadata: {
        method: "invalid_method",
      },
    };

    const result = AuthLoginSchema.safeParse(event);
    expect(result.success).toBe(false);
  });
});

describe("User Events", () => {
  it("validates user.created event", () => {
    const event = {
      action: "user.created" as const,
      userId: "user_123",
      resource: "org_456",
      metadata: {
        source: "invite" as const,
        role: "member",
        invitedBy: "user_admin",
      },
    };

    const result = UserCreatedSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it("validates user.deleted event with required metadata", () => {
    const event = {
      action: "user.deleted" as const,
      userId: "user_123",
      metadata: {
        deletedBy: "admin_456",
        reason: "User requested deletion",
        dataRetention: "anonymized" as const,
        gdprRequest: true,
      },
    };

    const result = UserDeletedSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it("rejects user.deleted without deletedBy", () => {
    const event = {
      action: "user.deleted",
      userId: "user_123",
      metadata: {
        reason: "Test",
      },
    };

    const result = UserDeletedSchema.safeParse(event);
    expect(result.success).toBe(false);
  });
});

describe("Access Events", () => {
  it("validates access.granted event", () => {
    const event = {
      action: "access.granted" as const,
      userId: "user_123",
      resource: "doc_456",
      metadata: {
        permission: "write",
        grantedBy: "user_admin",
        expiresAt: "2024-12-31T23:59:59Z",
      },
    };

    const result = AccessGrantedSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it("validates access.denied event", () => {
    const event = {
      action: "access.denied" as const,
      userId: "user_123",
      resource: "doc_456",
      metadata: {
        permission: "admin",
        reason: "insufficient_permissions" as const,
      },
    };

    const result = AccessDeniedSchema.safeParse(event);
    expect(result.success).toBe(true);
  });
});

describe("Document Events", () => {
  it("validates document.created event", () => {
    const event = {
      action: "document.created" as const,
      userId: "user_123",
      resource: "doc_456",
      metadata: {
        title: "Q4 Report",
        type: "report",
        size: 1024,
      },
    };

    const result = DocumentCreatedSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it("validates document.shared event", () => {
    const event = {
      action: "document.shared" as const,
      userId: "user_123",
      resource: "doc_456",
      metadata: {
        sharedWith: ["user_789", "user_012"],
        permission: "edit" as const,
        linkSharing: false,
      },
    };

    const result = DocumentSharedSchema.safeParse(event);
    expect(result.success).toBe(true);
  });
});

describe("Data Events", () => {
  it("validates data.exported event", () => {
    const event = {
      action: "data.exported" as const,
      userId: "user_123",
      metadata: {
        format: "json" as const,
        scope: "user_profile",
        recordCount: 150,
        gdprRequest: true,
      },
    };

    const result = DataExportedSchema.safeParse(event);
    expect(result.success).toBe(true);
  });
});

describe("Billing Events", () => {
  it("validates billing.payment_succeeded event", () => {
    const event = {
      action: "billing.payment_succeeded" as const,
      userId: "user_123",
      metadata: {
        amount: 9900,
        currency: "EUR",
        paymentMethod: "card" as const,
      },
    };

    const result = BillingPaymentSucceededSchema.safeParse(event);
    expect(result.success).toBe(true);
  });
});

describe("System Events", () => {
  it("validates system.api_key_created event", () => {
    const event = {
      action: "system.api_key_created" as const,
      userId: "user_123",
      metadata: {
        keyPrefix: "lv_live_abc",
        name: "Production Key",
        scopes: ["events:write"],
      },
    };

    const result = SystemApiKeyCreatedSchema.safeParse(event);
    expect(result.success).toBe(true);
  });
});

describe("Registry", () => {
  it("validates events with validateEvent", () => {
    const event = {
      action: "auth.login" as const,
      userId: "user_123",
      metadata: { method: "password" as const },
    };

    const validated = validateEvent(event);
    expect(validated.action).toBe("auth.login");
  });

  it("returns success for valid events with safeValidateEvent", () => {
    const event = {
      action: "user.created",
      userId: "user_123",
    };

    const result = safeValidateEvent(event);
    expect(result.success).toBe(true);
  });

  it("returns error for invalid events with safeValidateEvent", () => {
    const event = {
      action: "invalid.action",
      userId: "user_123",
    };

    const result = safeValidateEvent(event);
    expect(result.success).toBe(false);
  });

  it("checks known actions with isKnownAction", () => {
    expect(isKnownAction("auth.login")).toBe(true);
    expect(isKnownAction("user.created")).toBe(true);
    expect(isKnownAction("foo.bar")).toBe(false);
  });

  it("gets action category with getActionCategory", () => {
    expect(getActionCategory("auth.login")).toBe("auth");
    expect(getActionCategory("user.created")).toBe("user");
    expect(getActionCategory("access.granted")).toBe("access");
    expect(getActionCategory("unknown.action")).toBe(null);
  });

  it("has all expected actions", () => {
    expect(ALL_ACTIONS.length).toBeGreaterThan(50);
    expect(ALL_ACTIONS).toContain("auth.login");
    expect(ALL_ACTIONS).toContain("user.created");
    expect(ALL_ACTIONS).toContain("document.deleted");
  });
});

describe("Base Event Validation", () => {
  it("requires userId", () => {
    const event = {
      action: "auth.login",
      // missing userId
    };

    const result = AuthLoginSchema.safeParse(event);
    expect(result.success).toBe(false);
  });

  it("requires valid action format", () => {
    const event = {
      action: "invalid",
      userId: "user_123",
    };

    const result = safeValidateEvent(event);
    expect(result.success).toBe(false);
  });

  it("accepts optional timestamp", () => {
    const event = {
      action: "auth.login" as const,
      userId: "user_123",
      timestamp: new Date().toISOString(),
      metadata: { method: "password" as const },
    };

    const result = AuthLoginSchema.safeParse(event);
    expect(result.success).toBe(true);
  });
});
