/**
 * Default PII field patterns
 */
export const DEFAULT_PII_FIELDS = [
  "email",
  "phone",
  "phoneNumber",
  "mobile",
  "ssn",
  "socialSecurityNumber",
  "creditCard",
  "creditCardNumber",
  "cardNumber",
  "password",
  "secret",
  "token",
  "apiKey",
  "apiSecret",
  "privateKey",
  "address",
  "streetAddress",
  "dateOfBirth",
  "dob",
  "birthDate",
  "ipAddress",
  "ip",
  "passport",
  "passportNumber",
  "driversLicense",
  "licenseNumber",
  "bankAccount",
  "accountNumber",
  "routingNumber",
  "iban",
  "swift",
] as const;

/**
 * Default transformer function names that indicate PII is being handled
 */
export const DEFAULT_TRANSFORMERS = [
  "hashedEmail",
  "maskedString",
  "anonymizedIp",
  "hash",
  "mask",
  "anonymize",
  "redact",
  "encrypt",
  "tokenize",
] as const;

/**
 * Check if a property name matches a PII pattern
 */
export function isPIIField(
  name: string,
  piiFields: readonly string[] = DEFAULT_PII_FIELDS,
): boolean {
  const lowerName = name.toLowerCase();

  return piiFields.some((field) => {
    const lowerField = field.toLowerCase();
    // Exact match or contains the field name
    return lowerName === lowerField || lowerName.includes(lowerField);
  });
}

/**
 * Check if a value is being transformed by a known transformer
 */
export function isTransformed(
  valueNode: unknown,
  transformers: readonly string[] = DEFAULT_TRANSFORMERS,
): boolean {
  // Type guard for node-like objects
  if (!valueNode || typeof valueNode !== "object") return false;

  const node = valueNode as Record<string, unknown>;

  // Check for CallExpression: hashedEmail(value) or hashedEmail.parse(value)
  if (node.type === "CallExpression") {
    const callee = node.callee as Record<string, unknown> | undefined;

    // Direct call: hashedEmail(value)
    if (callee?.type === "Identifier") {
      const name = (callee as { name?: string }).name;
      return name ? transformers.includes(name) : false;
    }

    // Method call: hashedEmail.parse(value)
    if (callee?.type === "MemberExpression") {
      const object = callee.object as { type?: string; name?: string } | undefined;
      if (object?.type === "Identifier") {
        return object.name ? transformers.includes(object.name) : false;
      }
    }
  }

  return false;
}

/**
 * Check if a property is a direct member access without transformation
 * e.g., user.email (bad) vs hashedEmail(user.email) (good)
 */
export function isDirectPropertyAccess(node: unknown): boolean {
  if (!node || typeof node !== "object") return false;

  const n = node as Record<string, unknown>;

  // Simple identifier: email
  if (n.type === "Identifier") return true;

  // Member expression: user.email
  if (n.type === "MemberExpression") return true;

  return false;
}

