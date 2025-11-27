/**
 * Tests for LogVault Node.js SDK Client
 */

import { Client } from "./client";
import {
  AuthenticationError,
  RateLimitError,
  ValidationError,
  APIError,
} from "./exceptions";

// Mock fetch globally
global.fetch = jest.fn();

describe("Client Initialization", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should initialize with valid live API key", () => {
    const client = new Client("lv_live_abc123");
    expect(client["apiKey"]).toBe("lv_live_abc123");
    expect(client["baseUrl"]).toBe("https://api.logvault.eu");
  });

  test("should initialize with valid test API key", () => {
    const client = new Client("lv_test_abc123");
    expect(client["apiKey"]).toBe("lv_test_abc123");
  });

  test("should throw error with missing API key", () => {
    expect(() => new Client("")).toThrow(AuthenticationError);
    expect(() => new Client("")).toThrow("API key is required");
  });

  test("should throw error with invalid API key format", () => {
    expect(() => new Client("invalid_key")).toThrow(AuthenticationError);
    expect(() => new Client("invalid_key")).toThrow("must start with");
  });

  test("should accept config object", () => {
    const client = new Client({
      apiKey: "lv_test_abc123",
      baseUrl: "https://custom.example.com",
      timeout: 10000,
    });
    expect(client["apiKey"]).toBe("lv_test_abc123");
    expect(client["baseUrl"]).toBe("https://custom.example.com");
  });

  test("should remove trailing slash from base URL", () => {
    const client = new Client({
      apiKey: "lv_test_abc123",
      baseUrl: "https://example.com/",
    });
    expect(client["baseUrl"]).toBe("https://example.com");
  });

  test("should set custom timeout", () => {
    const client = new Client({
      apiKey: "lv_test_abc123",
      timeout: 5000,
    });
    expect(client["timeout"]).toBe(5000);
  });

  test("should enable nonce when configured", () => {
    const client = new Client({
      apiKey: "lv_test_abc123",
      enableNonce: true,
    });
    expect(client["enableNonce"]).toBe(true);
  });
});

describe("Client.log()", () => {
  let client: Client;

  beforeEach(() => {
    client = new Client({ apiKey: "lv_test_abc123", maxRetries: 0 });
    jest.clearAllMocks();
  });

  test("should log event with minimal parameters", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: "event_123", signature: "abc123" }),
    } as Response;

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await client.log({
      action: "user.login",
      userId: "user_123",
    });

    expect(result.id).toBe("event_123");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("should throw ValidationError for invalid action format", async () => {
    await expect(
      client.log({
        action: "invalid",
        userId: "user_123",
      }),
    ).rejects.toThrow(ValidationError);
  });

  test("should include metadata in request", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: "event_123" }),
    } as Response;

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await client.log({
      action: "user.login",
      userId: "user_123",
      metadata: { ip: "1.2.3.4", browser: "Chrome" },
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.metadata.ip).toBe("1.2.3.4");
    expect(body.metadata.browser).toBe("Chrome");
  });

  test("should use custom resource", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: "event_123" }),
    } as Response;

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await client.log({
      action: "document.delete",
      userId: "user_123",
      resource: "document:456",
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.resource).toBe("document:456");
  });

  test("should include timestamp when provided", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: "event_123" }),
    } as Response;

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const timestamp = new Date("2025-01-01T12:00:00Z");
    await client.log({
      action: "user.login",
      userId: "user_123",
      timestamp,
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.timestamp).toContain("2025-01-01");
  });

  test("should include nonce header when enabled", async () => {
    const clientWithNonce = new Client({
      apiKey: "lv_test_abc123",
      enableNonce: true,
    });

    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: "event_123" }),
    } as Response;

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await clientWithNonce.log({
      action: "user.login",
      userId: "user_123",
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const headers = fetchCall[1].headers;
    expect(headers["X-Nonce"]).toBeDefined();
    expect(headers["X-Nonce"].length).toBeGreaterThan(0);
  });
});

describe("Error Handling", () => {
  let client: Client;

  beforeEach(() => {
    client = new Client({ apiKey: "lv_test_abc123", maxRetries: 0 });
    jest.clearAllMocks();
  });

  test("should throw AuthenticationError on 401", async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      json: async () => ({ error: "Invalid API key" }),
      text: async () => "Invalid API key",
    } as unknown as Response;

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await expect(
      client.log({
        action: "user.login",
        userId: "user_123",
      }),
    ).rejects.toThrow(AuthenticationError);
  });

  test("should throw RateLimitError on 429", async () => {
    const mockResponse = {
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
      headers: {
        get: (name: string) => (name === "Retry-After" ? "60" : null),
      },
    } as Response;

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    try {
      await client.log({
        action: "user.login",
        userId: "user_123",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      expect((error as RateLimitError).retryAfter).toBe(60);
    }
  });

  test("should throw ValidationError on 422", async () => {
    const mockResponse = {
      ok: false,
      status: 422,
      json: async () => ({ detail: "Invalid action format" }),
      text: async () => "Invalid action format",
    } as unknown as Response;

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await expect(
      client.log({
        action: "user.login",
        userId: "user_123",
      }),
    ).rejects.toThrow(ValidationError);
  });

  test("should throw APIError on 500", async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal server error" }),
      text: async () => "Internal server error",
    } as unknown as Response;

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    try {
      await client.log({
        action: "user.login",
        userId: "user_123",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(APIError);
      expect((error as APIError).statusCode).toBe(500);
    }
  });

  test("should throw APIError on timeout", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("AbortError"));

    await expect(
      client.log({
        action: "user.login",
        userId: "user_123",
      }),
    ).rejects.toThrow(APIError);
  });
});

// Note: listEvents() tests removed - method not yet implemented
