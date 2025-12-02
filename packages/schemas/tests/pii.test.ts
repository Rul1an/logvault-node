import { describe, it, expect } from "vitest";
import {
  hashedEmail,
  maskedString,
  anonymizedIp,
  hashedValue,
  redacted,
  detectPII,
  detectPIIInMetadata,
} from "../src/common/pii";

describe("PII Transformers", () => {
  describe("hashedEmail", () => {
    it("hashes email and preserves domain", () => {
      const result = hashedEmail.parse("user@example.com");

      expect(result._type).toBe("hashed_email");
      expect(result.hash).toHaveLength(16);
      expect(result.domain).toBe("example.com");
    });

    it("produces consistent hashes", () => {
      const result1 = hashedEmail.parse("user@example.com");
      const result2 = hashedEmail.parse("user@example.com");

      expect(result1.hash).toBe(result2.hash);
    });

    it("normalizes email case", () => {
      const result1 = hashedEmail.parse("User@Example.com");
      const result2 = hashedEmail.parse("user@example.com");

      expect(result1.hash).toBe(result2.hash);
    });

    it("rejects invalid emails", () => {
      const result = hashedEmail.safeParse("not-an-email");
      expect(result.success).toBe(false);
    });
  });

  describe("maskedString", () => {
    it("masks long strings", () => {
      expect(maskedString.parse("John Doe")).toBe("J***e");
      expect(maskedString.parse("Alexander")).toBe("A***r");
    });

    it("fully masks short strings", () => {
      expect(maskedString.parse("Joe")).toBe("****");
      expect(maskedString.parse("AB")).toBe("****");
    });
  });

  describe("anonymizedIp", () => {
    it("anonymizes IPv4 addresses", () => {
      const result = anonymizedIp.parse("192.168.1.100");
      expect(result).toBe("192.168.xxx.xxx");
    });

    it("rejects invalid IPs", () => {
      const result = anonymizedIp.safeParse("not-an-ip");
      expect(result.success).toBe(false);
    });
  });

  describe("hashedValue", () => {
    it("hashes any string value", () => {
      const schema = hashedValue(8);
      const result = schema.parse("123-45-6789");

      expect(result._type).toBe("hashed_value");
      expect(result.hash).toHaveLength(8);
    });

    it("produces consistent hashes", () => {
      const schema = hashedValue();
      const result1 = schema.parse("secret");
      const result2 = schema.parse("secret");

      expect(result1.hash).toBe(result2.hash);
    });
  });

  describe("redacted", () => {
    it("replaces any value with [REDACTED]", () => {
      expect(redacted.parse("secret")).toBe("[REDACTED]");
      expect(redacted.parse(12345)).toBe("[REDACTED]");
      expect(redacted.parse({ nested: "data" })).toBe("[REDACTED]");
    });
  });
});

describe("PII Detection", () => {
  describe("detectPII", () => {
    it("detects email addresses", () => {
      const detected = detectPII("Contact: user@example.com");
      expect(detected).toContain("email");
    });

    it("detects phone numbers", () => {
      const detected = detectPII("Call 555-123-4567");
      expect(detected).toContain("phone");
    });

    it("detects SSN patterns", () => {
      const detected = detectPII("SSN: 123-45-6789");
      expect(detected).toContain("ssn");
    });

    it("detects credit card patterns", () => {
      const detected = detectPII("Card: 4111-1111-1111-1111");
      expect(detected).toContain("creditCard");
    });

    it("detects IP addresses", () => {
      const detected = detectPII("IP: 192.168.1.1");
      expect(detected).toContain("ipAddress");
    });

    it("detects multiple PII types", () => {
      const detected = detectPII(
        "Email: user@example.com, Phone: 555-123-4567",
      );
      expect(detected).toContain("email");
      expect(detected).toContain("phone");
    });

    it("returns empty array for clean strings", () => {
      const detected = detectPII("This is a clean string");
      expect(detected).toHaveLength(0);
    });
  });

  describe("detectPIIInMetadata", () => {
    it("detects PII in flat metadata", () => {
      const metadata = {
        email: "user@example.com",
        name: "John Doe",
      };

      const detected = detectPIIInMetadata(metadata);
      expect(detected["email"]).toContain("email");
      expect(detected["name"]).toBeUndefined();
    });

    it("detects PII in nested metadata", () => {
      const metadata = {
        user: {
          contact: {
            email: "user@example.com",
            phone: "555-123-4567",
          },
        },
      };

      const detected = detectPIIInMetadata(metadata);
      expect(detected["user.contact.email"]).toContain("email");
      expect(detected["user.contact.phone"]).toContain("phone");
    });

    it("returns empty object for clean metadata", () => {
      const metadata = {
        action: "test",
        count: 5,
      };

      const detected = detectPIIInMetadata(metadata);
      expect(Object.keys(detected)).toHaveLength(0);
    });
  });
});
