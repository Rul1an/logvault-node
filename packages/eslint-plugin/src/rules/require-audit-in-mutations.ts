import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import {
  containsLogVaultCall,
  getFunctionName,
  isExported,
} from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/Rul1an/logvault-node/blob/main/packages/eslint-plugin/docs/rules/${name}.md`,
);

export type Options = [
  {
    methods?: string[];
    auditFunctions?: string[];
    ignorePaths?: string[];
  },
];

export type MessageIds = "missingAuditInMutation";

export default createRule<Options, MessageIds>({
  name: "require-audit-in-mutations",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require audit logging in mutation handlers (DELETE, PUT, POST, PATCH)",
    },
    schema: [
      {
        type: "object",
        properties: {
          methods: {
            type: "array",
            items: { type: "string" },
            description: "HTTP methods to check for audit logging",
          },
          auditFunctions: {
            type: "array",
            items: { type: "string" },
            description: "List of function names considered as audit logging",
          },
          ignorePaths: {
            type: "array",
            items: { type: "string" },
            description: "File path patterns to ignore",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingAuditInMutation:
        "Mutation handler '{{method}}' should include audit logging. Add client.log() to track this operation.",
    },
  },
  defaultOptions: [
    {
      methods: ["DELETE", "PUT", "POST", "PATCH"],
      auditFunctions: ["client.log", "logvault.log", "audit.log"],
      ignorePaths: [],
    },
  ],
  create(context, [options]) {
    const { methods, auditFunctions, ignorePaths } = options;
    const filename = context.filename;

    // Check if file should be ignored
    const shouldIgnore = ignorePaths?.some((pattern) => {
      // Simple glob matching (** and *)
      const regex = new RegExp(
        "^" +
          pattern
            .replace(/\*\*/g, ".*")
            .replace(/\*/g, "[^/]*")
            .replace(/\//g, "\\/") +
          "$",
      );
      return regex.test(filename);
    });

    if (shouldIgnore) {
      return {};
    }

    function checkFunction(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression,
    ) {
      // Only check exported functions
      if (!isExported(node)) return;

      const name = getFunctionName(node);
      if (!name) return;

      // Check if function name matches a mutation method
      const upperName = name.toUpperCase();
      if (!methods?.includes(upperName)) return;

      // Check function body for audit logging
      const body = node.body;
      if (body.type === "BlockStatement") {
        if (containsLogVaultCall(body, auditFunctions)) {
          return; // Has audit logging
        }
      }

      // Report missing audit logging
      context.report({
        node,
        messageId: "missingAuditInMutation",
        data: {
          method: name,
        },
      });
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
});

