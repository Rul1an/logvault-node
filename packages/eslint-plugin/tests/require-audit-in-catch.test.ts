import { RuleTester } from "@typescript-eslint/rule-tester";
import { describe, it } from "vitest";
import rule from "../src/rules/require-audit-in-catch.js";

const ruleTester = new RuleTester();

describe("require-audit-in-catch", () => {
  it("should pass RuleTester tests", () => {
    ruleTester.run("require-audit-in-catch", rule, {
      valid: [
        // Has client.log in catch
        {
          code: `
            try {
              doSomething();
            } catch (error) {
              client.log({ action: 'error.caught', error });
              throw error;
            }
          `,
        },
        // Has logvault.log in catch
        {
          code: `
            try {
              doSomething();
            } catch (e) {
              logvault.log({ action: 'operation.failed' });
            }
          `,
        },
        // Has audit.log in catch
        {
          code: `
            try {
              await db.delete(id);
            } catch (err) {
              audit.log({ action: 'db.error' });
              console.error(err);
            }
          `,
        },
        // console.error allowed when option is set
        {
          code: `
            try {
              doSomething();
            } catch (error) {
              console.error(error);
            }
          `,
          options: [{ allowConsoleError: true }],
        },
        // Custom audit function
        {
          code: `
            try {
              doSomething();
            } catch (error) {
              logger.audit({ error });
            }
          `,
          options: [{ auditFunctions: ["logger.audit"] }],
        },
      ],
      invalid: [
        // Empty catch block
        {
          code: `
            try {
              doSomething();
            } catch (error) {
            }
          `,
          errors: [{ messageId: "missingAuditInCatch" }],
        },
        // Only console.error (not allowed by default)
        {
          code: `
            try {
              doSomething();
            } catch (error) {
              console.error(error);
            }
          `,
          errors: [{ messageId: "missingAuditInCatch" }],
        },
        // Only console.log
        {
          code: `
            try {
              doSomething();
            } catch (error) {
              console.log('Error:', error);
            }
          `,
          errors: [{ messageId: "missingAuditInCatch" }],
        },
        // Only throw
        {
          code: `
            try {
              await db.user.delete(id);
            } catch (error) {
              throw new Error('Failed to delete');
            }
          `,
          errors: [{ messageId: "missingAuditInCatch" }],
        },
        // Wrong audit function name
        {
          code: `
            try {
              doSomething();
            } catch (error) {
              logger.info({ error });
            }
          `,
          errors: [{ messageId: "missingAuditInCatch" }],
        },
      ],
    });
  });
});

