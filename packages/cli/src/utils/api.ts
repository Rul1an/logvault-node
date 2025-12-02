/**
 * LogVault API client for CLI
 */

const API_BASE_URL = "https://api.logvault.eu";
const WEB_BASE_URL = "https://logvault.app";

export interface Organization {
  id: string;
  name: string;
  email: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  status: "active" | "revoked";
}

export interface HealthCheck {
  status: "ok" | "error";
  latency: number;
  organization?: Organization;
  quota?: {
    used: number;
    limit: number;
  };
}

export interface AuthResult {
  apiKey: string;
  organization: Organization;
}

/**
 * Exchange CLI token for API key and organization info
 */
export async function exchangeToken(cliToken: string): Promise<AuthResult> {
  const response = await fetch(`${WEB_BASE_URL}/api/cli/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token: cliToken }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Authentication failed: ${error}`);
  }

  return response.json() as Promise<AuthResult>;
}

/**
 * Check API health and get organization info
 */
export async function checkHealth(apiKey: string): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const response = await fetch(`${API_BASE_URL}/v1/health`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Client": "logvault-cli",
      },
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      if (response.status === 401) {
        return { status: "error", latency };
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      organization?: Organization;
      quota?: { used: number; limit: number };
    };

    return {
      status: "ok",
      latency,
      organization: data.organization,
      quota: data.quota,
    };
  } catch (error) {
    return {
      status: "error",
      latency: Date.now() - start,
    };
  }
}

/**
 * List API keys for the organization
 */
export async function listApiKeys(cliToken: string): Promise<ApiKey[]> {
  const response = await fetch(`${WEB_BASE_URL}/api/cli/keys`, {
    headers: {
      Authorization: `Bearer ${cliToken}`,
      "X-Client": "logvault-cli",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch API keys: ${response.status}`);
  }

  return response.json() as Promise<ApiKey[]>;
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(apiKey: string): {
  valid: boolean;
  message?: string;
} {
  if (!apiKey) {
    return { valid: false, message: "API key is empty" };
  }

  if (!apiKey.startsWith("lv_live_") && !apiKey.startsWith("lv_test_")) {
    return {
      valid: false,
      message: "Invalid format. Expected lv_live_* or lv_test_*",
    };
  }

  if (apiKey.length < 20) {
    return { valid: false, message: "API key too short" };
  }

  return { valid: true };
}

/**
 * Get the auth URL for browser login
 */
export function getAuthUrl(callbackPort: number, state: string): string {
  const callbackUrl = `http://localhost:${callbackPort}/callback`;
  return `${WEB_BASE_URL}/cli/auth?callback=${encodeURIComponent(callbackUrl)}&state=${state}`;
}

/**
 * Get dashboard URLs
 */
export const urls = {
  dashboard: `${WEB_BASE_URL}/dashboard`,
  keys: `${WEB_BASE_URL}/dashboard/keys`,
  configGenerator: `${WEB_BASE_URL}/dashboard/config-generator`,
  docs: "https://logvault.eu/docs/quickstart",
};
