import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import {
  isPIIField,
  isTransformed,
  isDirectPropertyAccess,
  DEFAULT_PII_FIELDS,
  DEFAULT_TRANSFORMERS,
} from "../utils/pii-patterns.js";
import { isLogVaultCall } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/Rul1an/logvault-node/blob/main/packages/eslint-plugin/docs/rules/${name}.md`,
);

export type Options = [
  {
    piiFields?: string[];
    transformers?: string[];
    auditFunctions?: string[];
  },
];

export type MessageIds = "piiInLogs";

export default createRule<Options, MessageIds>({
  name: "no-pii-in-logs",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow logging PII fields directly without transformation",
    },
    schema: [
      {
        type: "object",
        properties: {
          piiFields: {
            type: "array",
            items: { type: "string" },
            description: "Additional field names to consider as PII",
          },
          transformers: {
            type: "array",
            items: { type: "string" },
            description: "Function names that transform PII safely",
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
      piiInLogs:
        "PII field '{{field}}' should not be logged directly. Use a transformer like hashedEmail() or maskedString().",
    },
  },
  defaultOptions: [
    {
      piiFields: [...DEFAULT_PII_FIELDS],
      transformers: [...DEFAULT_TRANSFORMERS],
      auditFunctions: ["client.log", "logvault.log", "audit.log"],
    },
  ],
  create(context, [options]) {
    const { piiFields, transformers, auditFunctions } = options;

    function checkObjectProperties(
      node: TSESTree.ObjectExpression,
      reportNode: TSESTree.Node,
    ) {
      for (const prop of node.properties) {
        if (prop.type !== "Property") continue;

        // Get property name
        let propName: string | null = null;
        if (prop.key.type === "Identifier") {
          propName = prop.key.name;
        } else if (prop.key.type === "Literal" && typeof prop.key.value === "string") {
          propName = prop.key.value;
        }

        if (!propName) continue;

        // Check if this is a PII field
        if (isPIIField(propName, piiFields)) {
          // Check if value is transformed
          if (!isTransformed(prop.value, transformers)) {
            // Check if value is direct property access (not transformed)
            if (isDirectPropertyAccess(prop.value)) {
              context.report({
                node: prop,
                messageId: "piiInLogs",
                data: {
                  field: propName,
                },
              });
            }
          }
        }

        // Always recursively check nested objects (regardless of parent name)
        if (prop.value.type === "ObjectExpression") {
          checkObjectProperties(prop.value, reportNode);
        }
      }
    }

    return {
      CallExpression(node: TSESTree.CallExpression) {
        // Only check LogVault logging calls
        if (!isLogVaultCall(node, auditFunctions)) return;

        // Check each argument
        for (const arg of node.arguments) {
          if (arg.type === "ObjectExpression") {
            checkObjectProperties(arg, node);
          }
        }
      },
    };
  },
});

