/**
 * LogVault Local Mode - Console Logging for Development
 *
 * Best Practices 2025:
 * - Zero-dependency pretty printing (no chalk/picocolors in prod bundle)
 * - PII detection with configurable patterns
 * - Compliance status feedback
 * - Action format validation
 */

import { LogEvent, LocalModeOptions } from "./types";

// ANSI color codes (works in most terminals)
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgRed: "\x1b[41m",
};

// Box drawing characters
const box = {
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
  teeRight: "├",
  teeLeft: "┤",
};

// PII patterns to detect
const PII_PATTERNS: Array<{ pattern: RegExp; type: string }> = [
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    type: "email",
  },
  { pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, type: "phone" },
  { pattern: /\b\d{9}\b/, type: "SSN (possible)" },
  {
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/,
    type: "credit card",
  },
  {
    pattern: /\b(?:password|passwd|pwd|secret|token|api_key|apikey)\b/i,
    type: "sensitive key",
  },
  { pattern: /\b(?:street|address|zipcode|postal)\b/i, type: "address field" },
  { pattern: /\b(?:ssn|social.?security)\b/i, type: "SSN field" },
  { pattern: /\b(?:dob|date.?of.?birth|birthday)\b/i, type: "DOB field" },
];

// Action format regex (same as in client.ts)
const ACTION_REGEX = /^[a-z0-9_]+(\.[a-z0-9_]+)+$/i;

export interface LocalModeResult {
  success: boolean;
  event: LogEvent;
  validation: {
    actionValid: boolean;
    actionFormat: string | null;
    hasUserId: boolean;
    piiWarnings: string[];
  };
  compliance: {
    gdprReady: boolean;
    soc2Ready: boolean;
    details: string[];
  };
}

/**
 * Default local mode options
 */
export const defaultLocalModeOptions: Required<LocalModeOptions> = {
  colors: true,
  prettyPrint: true,
  piiWarnings: true,
  showCompliance: true,
  logger: console.log,
};

/**
 * Detect PII in metadata
 */
function detectPII(obj: unknown, path: string = ""): string[] {
  const warnings: string[] = [];

  if (obj === null || obj === undefined) return warnings;

  if (typeof obj === "string") {
    for (const { pattern, type } of PII_PATTERNS) {
      if (pattern.test(obj)) {
        warnings.push(`${path}: possible ${type} detected`);
      }
    }
  } else if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const newPath = path ? `${path}.${key}` : key;

      // Check key names for sensitive patterns
      for (const { pattern, type } of PII_PATTERNS) {
        if (pattern.test(key)) {
          warnings.push(`${newPath}: field name suggests ${type}`);
        }
      }

      // Recursively check values
      warnings.push(...detectPII(value, newPath));
    }
  }

  return warnings;
}

/**
 * Check compliance readiness
 */
function checkCompliance(event: LogEvent): {
  gdprReady: boolean;
  soc2Ready: boolean;
  details: string[];
} {
  const details: string[] = [];
  let gdprReady = true;
  let soc2Ready = true;

  // GDPR: Need user identification for data subject requests
  if (!event.userId) {
    gdprReady = false;
    details.push("⚠️ GDPR: No userId - cannot fulfill data subject requests");
  }

  // SOC2: Need action categorization
  if (!event.action.includes(".")) {
    soc2Ready = false;
    details.push("⚠️ SOC2: Action should use domain.event format");
  }

  // SOC2: Timestamp recommended
  if (!event.timestamp) {
    details.push("ℹ️ SOC2: Timestamp will be auto-generated (server time)");
  }

  return { gdprReady, soc2Ready, details };
}

/**
 * Format event for console output
 */
export function formatLocalEvent(
  event: LogEvent,
  options: LocalModeOptions = {},
): LocalModeResult {
  const opts = { ...defaultLocalModeOptions, ...options };

  // Validate action format
  const actionValid = ACTION_REGEX.test(event.action);
  const actionFormat = actionValid
    ? null
    : "Expected format: 'domain.event' (e.g., auth.login)";

  // Check for userId
  const hasUserId = !!event.userId;

  // Detect PII
  const piiWarnings = opts.piiWarnings ? detectPII(event.metadata) : [];

  // Check compliance
  const compliance = opts.showCompliance
    ? checkCompliance(event)
    : { gdprReady: true, soc2Ready: true, details: [] };

  return {
    success: actionValid,
    event,
    validation: {
      actionValid,
      actionFormat,
      hasUserId,
      piiWarnings,
    },
    compliance,
  };
}

/**
 * Print event to console with pretty formatting
 */
export function printLocalEvent(
  result: LocalModeResult,
  options: LocalModeOptions = {},
): void {
  const opts = { ...defaultLocalModeOptions, ...options };
  const c = opts.colors
    ? colors
    : Object.fromEntries(Object.keys(colors).map((k) => [k, ""]));
  const log = opts.logger;

  const { event, validation, compliance } = result;

  if (opts.prettyPrint) {
    // Header
    const status = result.success
      ? `${c.green}✓${c.reset}`
      : `${c.red}✗${c.reset}`;
    const headerText = `${c.cyan}[LogVault Local]${c.reset} ${status} ${c.bright}${event.action}${c.reset}`;

    log("");
    log(headerText);

    // Box content
    const width = 50;
    const hr = box.horizontal.repeat(width - 2);

    log(`${c.gray}${box.topLeft}${hr}${box.topRight}${c.reset}`);

    // Event details
    const lines: string[] = [
      `Action:     ${event.action}`,
      `User ID:    ${event.userId || c.dim + "(not set)" + c.reset}`,
      `Resource:   ${event.resource || c.dim + "(not set)" + c.reset}`,
    ];

    if (event.metadata && Object.keys(event.metadata).length > 0) {
      lines.push(
        `Metadata:   ${JSON.stringify(event.metadata, null, 0).substring(0, 35)}...`,
      );
    }

    for (const line of lines) {
      const paddedLine = line.padEnd(width - 4);
      log(
        `${c.gray}${box.vertical}${c.reset} ${paddedLine} ${c.gray}${box.vertical}${c.reset}`,
      );
    }

    // Divider
    log(`${c.gray}${box.teeRight}${hr}${box.teeLeft}${c.reset}`);

    // Validation status
    const actionStatus = validation.actionValid
      ? `${c.green}✓ Valid${c.reset}`
      : `${c.red}✗ Invalid${c.reset}`;
    const userStatus = validation.hasUserId
      ? `${c.green}✓${c.reset}`
      : `${c.yellow}⚠${c.reset}`;

    log(
      `${c.gray}${box.vertical}${c.reset} Action:     ${actionStatus.padEnd(width - 15 + (opts.colors ? 9 : 0))} ${c.gray}${box.vertical}${c.reset}`,
    );
    log(
      `${c.gray}${box.vertical}${c.reset} User ID:    ${userStatus}                                    ${c.gray}${box.vertical}${c.reset}`,
    );

    // Compliance
    if (opts.showCompliance) {
      const gdpr = compliance.gdprReady
        ? `${c.green}✓ GDPR${c.reset}`
        : `${c.yellow}⚠ GDPR${c.reset}`;
      const soc2 = compliance.soc2Ready
        ? `${c.green}✓ SOC2${c.reset}`
        : `${c.yellow}⚠ SOC2${c.reset}`;

      log(
        `${c.gray}${box.vertical}${c.reset} Compliance: ${gdpr} ${soc2}                       ${c.gray}${box.vertical}${c.reset}`,
      );
    }

    log(`${c.gray}${box.bottomLeft}${hr}${box.bottomRight}${c.reset}`);

    // Warnings
    if (!validation.actionValid) {
      log(`${c.red}  ⚠ ${validation.actionFormat}${c.reset}`);
    }

    if (validation.piiWarnings.length > 0) {
      log(`${c.yellow}  ⚠ PII Detected:${c.reset}`);
      for (const warning of validation.piiWarnings) {
        log(`${c.yellow}    • ${warning}${c.reset}`);
      }
    }

    for (const detail of compliance.details) {
      log(`${c.dim}  ${detail}${c.reset}`);
    }

    log("");
  } else {
    // Simple output (no boxes)
    const status = result.success ? "✓" : "✗";
    log(
      `[LogVault Local] ${status} ${event.action} | user: ${event.userId || "-"} | resource: ${event.resource || "-"}`,
    );

    if (!validation.actionValid) {
      log(`  ⚠ ${validation.actionFormat}`);
    }

    for (const warning of validation.piiWarnings) {
      log(`  ⚠ PII: ${warning}`);
    }
  }
}

/**
 * Print startup banner
 */
export function printLocalModeBanner(options: LocalModeOptions = {}): void {
  const opts = { ...defaultLocalModeOptions, ...options };
  const c = opts.colors
    ? colors
    : Object.fromEntries(Object.keys(colors).map((k) => [k, ""]));
  const log = opts.logger;

  log("");
  log(
    `${c.cyan}╔════════════════════════════════════════════════════╗${c.reset}`,
  );
  log(
    `${c.cyan}║${c.reset}  ${c.bright}🔒 LogVault Local Mode Active${c.reset}                     ${c.cyan}║${c.reset}`,
  );
  log(
    `${c.cyan}║${c.reset}  ${c.dim}Events logged to console (no API calls)${c.reset}           ${c.cyan}║${c.reset}`,
  );
  log(
    `${c.cyan}╚════════════════════════════════════════════════════╝${c.reset}`,
  );
  log("");
}
