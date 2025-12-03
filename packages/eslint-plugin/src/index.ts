import type { Linter } from "eslint";
import requireAuditInCatch from "./rules/require-audit-in-catch.js";
import requireAuditInMutations from "./rules/require-audit-in-mutations.js";
import noPiiInLogs from "./rules/no-pii-in-logs.js";

// Rule exports - using any to avoid ESLint/typescript-eslint type compatibility issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rules: Record<string, any> = {
  "require-audit-in-catch": requireAuditInCatch,
  "require-audit-in-mutations": requireAuditInMutations,
  "no-pii-in-logs": noPiiInLogs,
};

const recommendedRules: Linter.RulesRecord = {
  "logvault/require-audit-in-catch": "warn",
  "logvault/require-audit-in-mutations": "warn",
  "logvault/no-pii-in-logs": "error",
};

const strictRules: Linter.RulesRecord = {
  "logvault/require-audit-in-catch": "error",
  "logvault/require-audit-in-mutations": "error",
  "logvault/no-pii-in-logs": "error",
};

// Config type
type PluginConfig = {
  plugins?: Record<string, unknown>;
  rules?: Linter.RulesRecord;
};

// Plugin definition
const plugin: {
  meta: { name: string; version: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rules: Record<string, any>;
  configs: Record<string, PluginConfig>;
} = {
  meta: {
    name: "@logvault/eslint-plugin",
    version: "0.1.0",
  },
  rules,
  configs: {},
};

// Define configs after plugin to allow self-reference
const baseConfig: PluginConfig = {
  plugins: {
    logvault: plugin,
  },
};

plugin.configs = {
  recommended: {
    ...baseConfig,
    rules: recommendedRules,
  },
  strict: {
    ...baseConfig,
    rules: strictRules,
  },
  // Legacy configs for backwards compatibility
  "flat/recommended": {
    ...baseConfig,
    rules: recommendedRules,
  },
  "flat/strict": {
    ...baseConfig,
    rules: strictRules,
  },
};

export default plugin;

// Named exports for convenience
export { rules };
export const configs: Record<string, PluginConfig> = plugin.configs;
