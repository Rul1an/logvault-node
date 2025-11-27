/**
 * LogVault SDK Exceptions
 */

export class LogVaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LogVaultError";
  }
}

export class AuthenticationError extends LogVaultError {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends LogVaultError {
  public retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class ValidationError extends LogVaultError {
  public statusCode?: number;
  public data?: any;

  constructor(message: string, statusCode?: number, data?: any) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

export class APIError extends LogVaultError {
  public statusCode?: number;
  public response?: any;

  constructor(message: string, statusCode?: number, response?: any) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.response = response;
  }
}
