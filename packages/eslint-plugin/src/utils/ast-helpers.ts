import type { TSESTree } from "@typescript-eslint/utils";

/**
 * Check if a node is a call to a LogVault logging function
 */
export function isLogVaultCall(
  node: TSESTree.Node,
  auditFunctions: string[] = ["client.log", "logvault.log", "audit.log"],
): boolean {
  if (node.type !== "CallExpression") return false;

  const callee = node.callee;

  // Handle: client.log(...) or logvault.log(...)
  if (callee.type === "MemberExpression") {
    const object = callee.object;
    const property = callee.property;

    if (object.type === "Identifier" && property.type === "Identifier") {
      const fullName = `${object.name}.${property.name}`;
      return auditFunctions.includes(fullName);
    }
  }

  // Handle: log(...) if imported directly
  if (callee.type === "Identifier") {
    return auditFunctions.includes(callee.name);
  }

  return false;
}

/**
 * Check if any descendant node contains a LogVault call
 */
export function containsLogVaultCall(
  node: TSESTree.Node,
  auditFunctions: string[] = ["client.log", "logvault.log", "audit.log"],
): boolean {
  let found = false;

  function traverse(current: TSESTree.Node): void {
    if (found) return;

    if (isLogVaultCall(current, auditFunctions)) {
      found = true;
      return;
    }

    // Traverse child nodes
    for (const key of Object.keys(current) as (keyof typeof current)[]) {
      const value = current[key];

      if (value && typeof value === "object") {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === "object" && "type" in item) {
              traverse(item as TSESTree.Node);
            }
          }
        } else if ("type" in value) {
          traverse(value as TSESTree.Node);
        }
      }
    }
  }

  traverse(node);
  return found;
}

/**
 * Check if a node is a console.error call
 */
export function isConsoleErrorCall(node: TSESTree.Node): boolean {
  if (node.type !== "CallExpression") return false;

  const callee = node.callee;

  if (callee.type === "MemberExpression") {
    const object = callee.object;
    const property = callee.property;

    if (
      object.type === "Identifier" &&
      object.name === "console" &&
      property.type === "Identifier" &&
      property.name === "error"
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Check if node contains console.error
 */
export function containsConsoleError(node: TSESTree.Node): boolean {
  let found = false;

  function traverse(current: TSESTree.Node): void {
    if (found) return;

    if (isConsoleErrorCall(current)) {
      found = true;
      return;
    }

    for (const key of Object.keys(current) as (keyof typeof current)[]) {
      const value = current[key];

      if (value && typeof value === "object") {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === "object" && "type" in item) {
              traverse(item as TSESTree.Node);
            }
          }
        } else if ("type" in value) {
          traverse(value as TSESTree.Node);
        }
      }
    }
  }

  traverse(node);
  return found;
}

/**
 * Get the function name from a function-like node
 */
export function getFunctionName(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression,
): string | null {
  // FunctionDeclaration with id
  if (node.type === "FunctionDeclaration" && node.id) {
    return node.id.name;
  }

  // Check parent for variable declarator
  const parent = (node as TSESTree.Node & { parent?: TSESTree.Node }).parent;
  if (parent?.type === "VariableDeclarator" && parent.id.type === "Identifier") {
    return parent.id.name;
  }

  // Check parent for property
  if (parent?.type === "Property" && parent.key.type === "Identifier") {
    return parent.key.name;
  }

  return null;
}

/**
 * Check if a function is an HTTP mutation handler (DELETE, PUT, POST, PATCH)
 */
export function isMutationHandler(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression,
  methods: string[] = ["DELETE", "PUT", "POST", "PATCH"],
): boolean {
  const name = getFunctionName(node);
  if (!name) return false;

  return methods.includes(name.toUpperCase());
}

/**
 * Check if a function is exported
 */
export function isExported(node: TSESTree.Node): boolean {
  const parent = (node as TSESTree.Node & { parent?: TSESTree.Node }).parent;

  if (!parent) return false;

  // export function DELETE() {}
  if (parent.type === "ExportNamedDeclaration") {
    return true;
  }

  // export const DELETE = () => {}
  if (parent.type === "VariableDeclarator") {
    const grandParent = (parent as TSESTree.Node & { parent?: TSESTree.Node })
      .parent;
    if (grandParent?.type === "VariableDeclaration") {
      const greatGrandParent = (
        grandParent as TSESTree.Node & { parent?: TSESTree.Node }
      ).parent;
      if (greatGrandParent?.type === "ExportNamedDeclaration") {
        return true;
      }
    }
  }

  return false;
}

