/**
 * LogVault Node.js SDK
 * Audit-Log-as-a-Service client library
 *
 * @version 0.4.0
 */

export { Client } from "./client";
export * from "./types";
export * from "./exceptions";

// Local Mode utilities (for advanced usage)
export {
  formatLocalEvent,
  printLocalEvent,
  printLocalModeBanner,
  defaultLocalModeOptions,
  type LocalModeResult,
} from "./localMode";

// Type-safe logging with @logvault/schemas
export { TypedClient, createTypedLogger, validateEventSchema } from "./typed";

// Default export
import { Client } from "./client";
export default Client;

// Convenience alias
export { Client as LogVault } from "./client";
