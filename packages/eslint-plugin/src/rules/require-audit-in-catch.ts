import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import { containsLogVaultCall, containsConsoleError } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/Rul1an/logvault-node/blob/main/packages/eslint-plugin/docs/rules/${name}.md`,
);

export type Options = [
  {
    allowConsoleError?: boolean;
    auditFunctions?: string[];
  },
];

export type MessageIds = "missingAuditInCatch";

export default createRule<Options, MessageIds>({
  name: "require-audit-in-catch",
  meta: {
    type: "suggestion",
    docs: {
      description: "Require audit logging in catch blocks for compliance",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowConsoleError: {
            type: "boolean",
            description: "Allow console.error as a substitute for audit logging",
          },
          auditFunctions: {
            type: "array",
            items: { type: "string" },
            description: "List of function names considered as audit logging",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingAuditInCatch:
        "Catch block should include audit logging for compliance. Add client.log() to track errors.",
    },
  },
  defaultOptions: [
    {
      allowConsoleError: false,
      auditFunctions: ["client.log", "logvault.log", "audit.log"],
    },
  ],
  create(context, [options]) {
    const { allowConsoleError, auditFunctions } = options;

    return {
      CatchClause(node: TSESTree.CatchClause) {
        const body = node.body;

        // Check if body contains audit logging
        if (containsLogVaultCall(body, auditFunctions)) {
          return; // Has audit logging, all good
        }

        // Optionally allow console.error
        if (allowConsoleError && containsConsoleError(body)) {
          return; // console.error is allowed
        }

        // Report missing audit logging
        context.report({
          node,
          messageId: "missingAuditInCatch",
        });
      },
    };
  },
});

