import { RuleTester } from "@typescript-eslint/rule-tester";
import { describe, it } from "vitest";
import rule from "../src/rules/no-pii-in-logs.js";

const ruleTester = new RuleTester();

describe("no-pii-in-logs", () => {
  it("should pass RuleTester tests", () => {
    ruleTester.run("no-pii-in-logs", rule, {
      valid: [
        // No PII fields
        {
          code: `
            client.log({
              action: 'user.created',
              userId: '123',
              metadata: { role: 'admin' }
            });
          `,
        },
        // Email transformed with hashedEmail
        {
          code: `
            client.log({
              action: 'user.created',
              metadata: { email: hashedEmail(user.email) }
            });
          `,
        },
        // Email transformed with hashedEmail.parse
        {
          code: `
            client.log({
              action: 'user.created',
              metadata: { email: hashedEmail.parse(user.email) }
            });
          `,
        },
        // Phone transformed with maskedString
        {
          code: `
            client.log({
              action: 'user.updated',
              metadata: { phone: maskedString(user.phone) }
            });
          `,
        },
        // IP transformed with anonymizedIp
        {
          code: `
            client.log({
              action: 'access.login',
              metadata: { ipAddress: anonymizedIp(req.ip) }
            });
          `,
        },
        // Custom transformer
        {
          code: `
            client.log({
              action: 'user.created',
              metadata: { email: customHash(user.email) }
            });
          `,
          options: [{ transformers: ["customHash"] }],
        },
        // Non-logging call (not checked)
        {
          code: `
            console.log({
              email: user.email
            });
          `,
        },
        // Literal email value (not direct access)
        {
          code: `
            client.log({
              action: 'test',
              metadata: { email: 'test@example.com' }
            });
          `,
        },
      ],
      invalid: [
        // Direct email access
        {
          code: `
            client.log({
              action: 'user.created',
              metadata: { email: user.email }
            });
          `,
          errors: [{ messageId: "piiInLogs" }],
        },
        // Direct phone access
        {
          code: `
            client.log({
              action: 'user.updated',
              metadata: { phone: user.phone }
            });
          `,
          errors: [{ messageId: "piiInLogs" }],
        },
        // Direct SSN access
        {
          code: `
            client.log({
              action: 'user.verified',
              metadata: { ssn: user.ssn }
            });
          `,
          errors: [{ messageId: "piiInLogs" }],
        },
        // Direct IP address
        {
          code: `
            client.log({
              action: 'access.login',
              metadata: { ipAddress: req.ipAddress }
            });
          `,
          errors: [{ messageId: "piiInLogs" }],
        },
        // Direct creditCard access
        {
          code: `
            client.log({
              action: 'payment.processed',
              metadata: { creditCard: payment.creditCard }
            });
          `,
          errors: [{ messageId: "piiInLogs" }],
        },
        // Multiple PII fields
        {
          code: `
            client.log({
              action: 'user.created',
              metadata: {
                email: user.email,
                phone: user.phone
              }
            });
          `,
          errors: [
            { messageId: "piiInLogs" },
            { messageId: "piiInLogs" },
          ],
        },
        // Nested PII
        {
          code: `
            logvault.log({
              action: 'user.created',
              metadata: {
                user: { email: profile.email }
              }
            });
          `,
          errors: [{ messageId: "piiInLogs" }],
        },
        // Simple identifier
        {
          code: `
            client.log({
              action: 'contact.added',
              metadata: { email }
            });
          `,
          errors: [{ messageId: "piiInLogs" }],
        },
      ],
    });
  });
});

