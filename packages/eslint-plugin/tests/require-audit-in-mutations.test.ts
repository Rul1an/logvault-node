import { RuleTester } from "@typescript-eslint/rule-tester";
import { describe, it } from "vitest";
import rule from "../src/rules/require-audit-in-mutations.js";

const ruleTester = new RuleTester();

describe("require-audit-in-mutations", () => {
  it("should pass RuleTester tests", () => {
    ruleTester.run("require-audit-in-mutations", rule, {
      valid: [
        // DELETE with audit logging
        {
          code: `
            export async function DELETE(req) {
              await client.log({ action: 'user.deleted', userId: req.params.id });
              await db.user.delete(req.params.id);
              return Response.json({ success: true });
            }
          `,
        },
        // PUT with audit logging
        {
          code: `
            export async function PUT(req) {
              const data = await req.json();
              logvault.log({ action: 'user.updated' });
              await db.user.update(data);
              return Response.json({ success: true });
            }
          `,
        },
        // POST with audit logging
        {
          code: `
            export const POST = async (req) => {
              client.log({ action: 'user.created' });
              return Response.json({ success: true });
            };
          `,
        },
        // GET is not a mutation (not checked)
        {
          code: `
            export async function GET(req) {
              return Response.json({ data: [] });
            }
          `,
        },
        // Non-exported function (not checked)
        {
          code: `
            async function DELETE(req) {
              await db.user.delete(req.params.id);
              return Response.json({ success: true });
            }
          `,
        },
        // Custom methods configuration
        {
          code: `
            export async function REMOVE(req) {
              client.log({ action: 'removed' });
              return Response.json({ success: true });
            }
          `,
          options: [{ methods: ["REMOVE"] }],
        },
      ],
      invalid: [
        // DELETE without logging
        {
          code: `
            export async function DELETE(req) {
              await db.user.delete(req.params.id);
              return Response.json({ success: true });
            }
          `,
          errors: [{ messageId: "missingAuditInMutation" }],
        },
        // PUT without logging
        {
          code: `
            export async function PUT(req) {
              const data = await req.json();
              await db.user.update(data);
              return Response.json({ success: true });
            }
          `,
          errors: [{ messageId: "missingAuditInMutation" }],
        },
        // POST without logging
        {
          code: `
            export async function POST(req) {
              const user = await db.user.create({ data: await req.json() });
              return Response.json(user);
            }
          `,
          errors: [{ messageId: "missingAuditInMutation" }],
        },
        // PATCH without logging
        {
          code: `
            export const PATCH = async (req) => {
              await db.user.update(await req.json());
              return Response.json({ ok: true });
            };
          `,
          errors: [{ messageId: "missingAuditInMutation" }],
        },
        // Arrow function export without logging
        {
          code: `
            export const DELETE = async (req) => {
              await db.user.delete(req.params.id);
              return Response.json({ success: true });
            };
          `,
          errors: [{ messageId: "missingAuditInMutation" }],
        },
      ],
    });
  });
});

