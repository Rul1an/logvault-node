/**
 * OAuth browser flow for CLI authentication
 */

import open from "open";
import crypto from "crypto";
import { startCallbackServer } from "./server.js";
import { getAuthUrl, exchangeToken, type AuthResult } from "../utils/api.js";

export interface OAuthOptions {
  noBrowser?: boolean;
  timeout?: number;
}

export interface OAuthResult {
  success: boolean;
  data?: AuthResult;
  error?: string;
  authUrl?: string; // Only when noBrowser is true
}

/**
 * Run OAuth browser flow
 *
 * 1. Start localhost callback server
 * 2. Open browser to auth URL
 * 3. Wait for callback with token
 * 4. Exchange token for API key
 */
export async function runOAuthFlow(
  options: OAuthOptions = {},
): Promise<OAuthResult> {
  const { noBrowser = false, timeout = 120000 } = options;

  // Generate state for CSRF protection
  const state = crypto.randomBytes(16).toString("hex");

  // Start callback server
  const server = await startCallbackServer(timeout);
  const authUrl = getAuthUrl(server.port, state);

  try {
    if (noBrowser) {
      // Return URL for manual opening
      return {
        success: false,
        authUrl,
      };
    }

    // Open browser
    await open(authUrl);

    // Wait for callback
    const result = await server.waitForCallback();

    if (result.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    if (!result.token) {
      return {
        success: false,
        error: "No authentication token received",
      };
    }

    // Exchange token for API key
    const authResult = await exchangeToken(result.token);

    return {
      success: true,
      data: authResult,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    server.close();
  }
}

/**
 * Wait for manual authentication (when --no-browser is used)
 */
export async function waitForManualAuth(
  server: Awaited<ReturnType<typeof startCallbackServer>>,
): Promise<OAuthResult> {
  try {
    const result = await server.waitForCallback();

    if (result.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    if (!result.token) {
      return {
        success: false,
        error: "No authentication token received",
      };
    }

    const authResult = await exchangeToken(result.token);

    return {
      success: true,
      data: authResult,
    };
  } finally {
    server.close();
  }
}
