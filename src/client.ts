import { LogVaultOptions, LogEvent, AuditEventResponse } from "./types";
import {
  LogVaultError,
  APIError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
} from "./exceptions";

// Best Practice 2025: Central versioning
const SDK_VERSION = "0.2.2";
// Regex: allows 'auth.login', 'payment.transaction.failed' (snake_case segments separated by dots)
const ACTION_REGEX = /^[a-z0-9_]+(\.[a-z0-9_]+)+$/i;

export class Client {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number = 3;
  private enableNonce: boolean;

  constructor(options: string | LogVaultOptions) {
    if (typeof options === "string") {
      this.apiKey = options;
      this.baseUrl = "https://api.logvault.eu";
      this.timeout = 10000;
      this.enableNonce = false;
      this.maxRetries = 3;
    } else {
      this.apiKey = options.apiKey;
      this.baseUrl = (options.baseUrl || "https://api.logvault.eu").replace(
        /\/$/,
        "",
      );
      this.timeout = options.timeout || 10000;
      this.enableNonce = options.enableNonce || false;
      this.maxRetries =
        options.maxRetries !== undefined ? options.maxRetries : 3;
    }

    // Validate API key presence
    if (!this.apiKey) {
      throw new AuthenticationError("API key is required");
    }

    // Validate API key format (must start with lv_live_ or lv_test_)
    if (
      !this.apiKey.startsWith("lv_live_") &&
      !this.apiKey.startsWith("lv_test_")
    ) {
      throw new AuthenticationError(
        "Invalid API key format: must start with 'lv_live_' or 'lv_test_'",
      );
    }
  }

  /**
   * Helper for exponential backoff with jitter
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async log(event: LogEvent): Promise<AuditEventResponse> {
    // 1. INPUT SANITIZATION
    if (!ACTION_REGEX.test(event.action)) {
      throw new ValidationError(
        `Invalid action format '${event.action}'. Expected format: 'domain.event' (e.g., auth.login)`,
      );
    }

    // 2. FAIL-SAFE SERIALIZATION
    let body: string;
    try {
      body = JSON.stringify(event);
      // Optional: Check 1MB limit roughly
      if (body.length > 1024 * 1024) {
        throw new ValidationError("Payload exceeds 1MB limit");
      }
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      console.error("[LogVault] Serialization failed:", error);
      // Return dummy to prevent crash
      return {
        id: "failed-serialization",
        status: "error",
        timestamp: new Date().toISOString(),
      } as any;
    }

    const url = `${this.baseUrl}/v1/events`;
    let attempt = 0;

    // 3. RETRY LOOP (Exponential Backoff + Jitter)
    while (true) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "User-Agent": `logvault-node/${SDK_VERSION}`,
          "X-Client-Version": SDK_VERSION,
        };

        // Add nonce if enabled (Crypto required)
        if (this.enableNonce) {
          const crypto = require("crypto");
          headers["X-Nonce"] = crypto.randomBytes(32).toString("base64url");
        }

        const response = await fetch(url, {
          method: "POST",
          headers,
          body: body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return (await response.json()) as AuditEventResponse;
        }

        // Handle Non-OK responses
        // Don't retry on client errors (400, 401, 403, 422), EXCEPT 429
        if (response.status === 401)
          throw new AuthenticationError("Invalid API key");
        if (response.status === 422) {
          const err = await response.json().catch(() => ({}));
          throw new ValidationError(`Validation failed`, response.status, err);
        }
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get("Retry-After");
          const retryAfter = retryAfterHeader
            ? parseInt(retryAfterHeader, 10)
            : undefined;
          throw new RateLimitError("Rate limit exceeded", retryAfter);
        }

        // If 5xx (Server Error), we might retry
        if (attempt < this.maxRetries && response.status >= 500) {
          // Fall through to retry logic below
          throw new APIError(`HTTP error ${response.status}`, response.status);
        } else {
          // No more retries or fatal error
          throw new APIError(`HTTP error ${response.status}`, response.status);
        }
      } catch (error: any) {
        clearTimeout(timeoutId);

        // Sanitize Error
        const isAbort = error.name === "AbortError";
        const errorMessage = isAbort
          ? `Request timed out (${this.timeout}ms)`
          : error.message;

        // Don't retry on specific error types
        if (
          error instanceof AuthenticationError ||
          error instanceof ValidationError ||
          error instanceof RateLimitError
        ) {
          throw error;
        }

        // Decide to Retry?
        // Retry on Network Errors (fetch throws) or Timeouts or 5xx (caught above)
        // Check if error is APIError with retryable status
        const isRetryableStatus =
          error instanceof APIError &&
          error.statusCode &&
          error.statusCode >= 500;

        if (
          attempt < this.maxRetries &&
          (isAbort || isRetryableStatus || !error.statusCode)
        ) {
          attempt++;
          // Formula: 2^attempt * 1000ms + Jitter (0-500ms)
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          // console.warn(`[LogVault] Retrying request (attempt ${attempt}/${this.maxRetries}) in ${Math.round(delay)}ms...`);
          await this.sleep(delay);
          continue;
        }

        // Final Fail
        if (error instanceof LogVaultError) throw error;
        throw new APIError(`Network error: ${errorMessage}`);
      }

      // Should be unreachable due to continue/return/throw, but strictly needed for flow
      attempt++;
      const delay = Math.pow(2, attempt) * 1000;
      await this.sleep(delay);
    }
  }
}
