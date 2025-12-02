import {
  LogVaultOptions,
  LogEvent,
  AuditEventResponse,
  AuditEventList,
  ListEventsOptions,
  VerifyEventResponse,
  SearchEventsResponse,
  LocalModeOptions,
} from "./types";
import {
  LogVaultError,
  APIError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
} from "./exceptions";
import {
  formatLocalEvent,
  printLocalEvent,
  printLocalModeBanner,
  defaultLocalModeOptions,
} from "./localMode";

// Best Practice 2025: Central versioning
const SDK_VERSION = "0.4.0";
// Regex: allows 'auth.login', 'payment.transaction.failed' (snake_case segments separated by dots)
const ACTION_REGEX = /^[a-z0-9_]+(\.[a-z0-9_]+)+$/i;

export class Client {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number = 3;
  private enableNonce: boolean;
  private localMode: boolean;
  private localModeOptions: LocalModeOptions;
  private localModeBannerShown: boolean = false;

  constructor(options: string | LogVaultOptions) {
    if (typeof options === "string") {
      this.apiKey = options;
      this.baseUrl = "https://api.logvault.eu";
      this.timeout = 10000;
      this.enableNonce = false;
      this.maxRetries = 3;
      this.localMode = false;
      this.localModeOptions = defaultLocalModeOptions;
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

      // Local Mode: auto-detect or explicit
      if (options.localMode === "auto") {
        this.localMode = process.env.NODE_ENV === "development";
      } else {
        this.localMode = options.localMode || false;
      }

      this.localModeOptions = {
        ...defaultLocalModeOptions,
        ...options.localModeOptions,
      };
    }

    // In local mode, API key validation is relaxed
    if (this.localMode) {
      // Show banner on first use
      return;
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
   * Check if local mode is active
   */
  isLocalMode(): boolean {
    return this.localMode;
  }

  /**
   * Helper for exponential backoff with jitter
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async log(event: LogEvent): Promise<AuditEventResponse> {
    // LOCAL MODE: Log to console instead of API
    if (this.localMode) {
      // Show banner once
      if (!this.localModeBannerShown) {
        printLocalModeBanner(this.localModeOptions);
        this.localModeBannerShown = true;
      }

      // Format and print event
      const result = formatLocalEvent(event, this.localModeOptions);
      printLocalEvent(result, this.localModeOptions);

      // Return mock response
      return {
        id: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        org_id: "local_org",
        user_id: event.userId || "unknown",
        action: event.action,
        resource: event.resource || "",
        timestamp: new Date().toISOString(),
        metadata: event.metadata || {},
        signature: "local_mode_no_signature",
        created_at: new Date().toISOString(),
      } as AuditEventResponse;
    }

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
        if (response.status === 401) {
          throw new AuthenticationError("Invalid API key");
        }
        if (response.status === 422) {
          let errorData: any = {};
          try {
            if (typeof response.json === "function") {
              errorData = await response.json();
            }
          } catch {
            // Ignore JSON parse errors
          }
          throw new ValidationError(
            `Validation failed`,
            response.status,
            errorData,
          );
        }
        if (response.status === 429) {
          let retryAfter: number | undefined;
          try {
            const retryAfterHeader = response.headers?.get?.("Retry-After");
            if (retryAfterHeader) {
              retryAfter = parseInt(retryAfterHeader, 10);
            }
          } catch {
            // Ignore header access errors
          }
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

  /**
   * List audit events with optional filtering
   */
  async listEvents(options: ListEventsOptions = {}): Promise<AuditEventList> {
    const params = new URLSearchParams();
    params.set("page", String(options.page || 1));
    params.set("page_size", String(Math.min(options.pageSize || 50, 100)));
    if (options.userId) params.set("user_id", options.userId);
    if (options.action) params.set("action", options.action);

    const url = `${this.baseUrl}/v1/events?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": `logvault-node/${SDK_VERSION}`,
      },
    });

    if (response.status === 401) {
      throw new AuthenticationError("Invalid API key");
    }

    if (!response.ok) {
      throw new APIError(`HTTP error ${response.status}`, response.status);
    }

    return (await response.json()) as AuditEventList;
  }

  /**
   * Get a single audit event by ID
   */
  async getEvent(eventId: string): Promise<AuditEventResponse> {
    const url = `${this.baseUrl}/v1/events/${eventId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": `logvault-node/${SDK_VERSION}`,
      },
    });

    if (response.status === 401) {
      throw new AuthenticationError("Invalid API key");
    }

    if (response.status === 404) {
      throw new APIError(`Event not found: ${eventId}`, 404);
    }

    if (!response.ok) {
      throw new APIError(`HTTP error ${response.status}`, response.status);
    }

    return (await response.json()) as AuditEventResponse;
  }

  /**
   * Verify the cryptographic signature of an audit event
   */
  async verifyEvent(eventId: string): Promise<VerifyEventResponse> {
    const url = `${this.baseUrl}/v1/events/${eventId}/verify`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": `logvault-node/${SDK_VERSION}`,
      },
    });

    if (response.status === 401) {
      throw new AuthenticationError("Invalid API key");
    }

    if (response.status === 404) {
      throw new APIError(`Event not found: ${eventId}`, 404);
    }

    if (!response.ok) {
      throw new APIError(`HTTP error ${response.status}`, response.status);
    }

    return (await response.json()) as VerifyEventResponse;
  }

  /**
   * Search audit events using semantic search
   *
   * @param query - Natural language search query (e.g., "failed login attempts")
   * @param limit - Maximum number of results (default 20)
   */
  async searchEvents(
    query: string,
    limit: number = 20,
  ): Promise<SearchEventsResponse> {
    if (query.length < 2) {
      throw new ValidationError("Query must be at least 2 characters");
    }

    const params = new URLSearchParams();
    params.set("q", query);
    params.set("limit", String(limit));

    const url = `${this.baseUrl}/v1/events/search?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": `logvault-node/${SDK_VERSION}`,
      },
    });

    if (response.status === 401) {
      throw new AuthenticationError("Invalid API key");
    }

    if (!response.ok) {
      throw new APIError(`HTTP error ${response.status}`, response.status);
    }

    return (await response.json()) as SearchEventsResponse;
  }

  // ========================================
  // CHAIN INTEGRITY METHODS
  // ========================================

  /**
   * Verify the cryptographic integrity of the audit log chain
   *
   * This method walks through the hash chain and verifies:
   * - Each event's chain_hash is correctly computed
   * - Each event's prev_hash matches the previous event's chain_hash
   * - No events are missing from the chain
   *
   * @param options - Optional filters (startDate, endDate, limit)
   */
  async verifyChain(
    options: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {},
  ): Promise<ChainVerificationResult> {
    const params = new URLSearchParams();
    params.set("limit", String(Math.min(options.limit || 1000, 10000)));
    if (options.startDate) params.set("start_date", options.startDate);
    if (options.endDate) params.set("end_date", options.endDate);

    const url = `${this.baseUrl}/v1/chain/verify?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": `logvault-node/${SDK_VERSION}`,
      },
    });

    if (response.status === 401) {
      throw new AuthenticationError("Invalid API key");
    }

    if (!response.ok) {
      throw new APIError(`HTTP error ${response.status}`, response.status);
    }

    return (await response.json()) as ChainVerificationResult;
  }

  /**
   * Get statistics about the hash chain
   */
  async getChainStats(): Promise<ChainStats> {
    const url = `${this.baseUrl}/v1/chain/stats`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": `logvault-node/${SDK_VERSION}`,
      },
    });

    if (response.status === 401) {
      throw new AuthenticationError("Invalid API key");
    }

    if (!response.ok) {
      throw new APIError(`HTTP error ${response.status}`, response.status);
    }

    return (await response.json()) as ChainStats;
  }

  /**
   * Get cryptographic proof for a specific event
   *
   * This proof can be used by auditors to independently verify
   * the event's integrity without access to the LogVault database.
   *
   * @param eventId - The UUID of the event
   */
  async getEventProof(eventId: string): Promise<EventProof> {
    const url = `${this.baseUrl}/v1/events/${eventId}/proof`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": `logvault-node/${SDK_VERSION}`,
      },
    });

    if (response.status === 401) {
      throw new AuthenticationError("Invalid API key");
    }

    if (response.status === 404) {
      throw new APIError(`Event not found: ${eventId}`, 404);
    }

    if (!response.ok) {
      throw new APIError(`HTTP error ${response.status}`, response.status);
    }

    return (await response.json()) as EventProof;
  }

  /**
   * Verify an event's chain integrity locally (offline verification)
   *
   * This method allows auditors to verify events without making API calls.
   * Note: This only verifies the chain_hash computation, not the HMAC signature.
   *
   * @param event - Event object containing signature, prev_hash, chain_hash
   * @param prevChainHash - Optional override for previous chain hash
   */
  verifyEventLocally(
    event: { signature: string; prev_hash?: string; chain_hash?: string },
    prevChainHash?: string,
  ): LocalVerificationResult {
    const crypto = require("crypto");
    const GENESIS_HASH =
      "GENESIS_" +
      crypto
        .createHash("sha256")
        .update("LogVault_Chain_Genesis_2025")
        .digest("hex")
        .substring(0, 32);

    const checks = {
      hasChainHash: false,
      chainHashValid: false,
      prevHashMatches: false,
    };

    // Check 1: Does event have chain_hash?
    if (!event.chain_hash) {
      return {
        isValid: false,
        checks,
        details: "Event has no chain_hash (legacy event)",
      };
    }
    checks.hasChainHash = true;

    // Check 2: Is chain_hash correctly computed?
    const prev = prevChainHash || event.prev_hash || GENESIS_HASH;
    const chainInput = `${event.signature}:${prev}:LogVault`;
    const expectedChain = crypto
      .createHash("sha256")
      .update(chainInput)
      .digest("hex");

    if (expectedChain === event.chain_hash) {
      checks.chainHashValid = true;
    } else {
      return {
        isValid: false,
        checks,
        details: `Chain hash mismatch. Expected: ${expectedChain.substring(0, 16)}..., Got: ${event.chain_hash.substring(0, 16)}...`,
      };
    }

    // Check 3: Does prev_hash match provided previous chain hash?
    if (prevChainHash) {
      if (event.prev_hash === prevChainHash) {
        checks.prevHashMatches = true;
      } else {
        return {
          isValid: false,
          checks,
          details: "prev_hash mismatch with provided previous chain hash",
        };
      }
    } else {
      checks.prevHashMatches = true;
    }

    return {
      isValid: true,
      checks,
      details: "Event chain integrity verified",
    };
  }
}

// Type definitions for chain integrity
export interface ChainVerificationResult {
  is_valid: boolean;
  events_checked: number;
  events_with_chain: number;
  legacy_events: number;
  first_invalid_event: string | null;
  error_type: "BROKEN_CHAIN" | "INVALID_CHAIN_HASH" | null;
  details: string;
  verified_at: string;
}

export interface ChainStats {
  total_events: number;
  chained_events: number;
  legacy_events: number;
  chain_coverage: number;
  first_chained_event: {
    id: string;
    created_at: string;
    chain_hash: string;
  } | null;
  last_chained_event: {
    id: string;
    created_at: string;
    chain_hash: string;
  } | null;
  genesis_hash: string;
}

export interface EventProof {
  event: AuditEventResponse;
  proof: {
    signature: string;
    chain_hash: string | null;
    prev_hash: string | null;
    is_genesis: boolean;
    is_chained: boolean;
    previous_event: {
      id: string;
      chain_hash: string;
      created_at: string;
    } | null;
    next_event: {
      id: string;
      created_at: string;
    } | null;
  };
  verification: {
    algorithm: string;
    formula: string;
    genesis_hash: string;
    steps: string[];
  };
}

export interface LocalVerificationResult {
  isValid: boolean;
  checks: {
    hasChainHash: boolean;
    chainHashValid: boolean;
    prevHashMatches: boolean;
  };
  details: string;
}
