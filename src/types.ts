/**
 * LogVault TypeScript Types
 */

export interface LogVaultConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  enableNonce?: boolean;
  maxRetries?: number;
}

// Alias for newer code
export type LogVaultOptions = LogVaultConfig;

export interface AuditEventCreate {
  action: string;
  userId: string;
  resource?: string;
  metadata?: Record<string, any>;
  timestamp?: Date | string;
}

// Alias for newer code
export type LogEvent = AuditEventCreate;

export interface AuditEventResponse {
  id: string;
  org_id: string;
  user_id: string;
  action: string;
  resource: string;
  timestamp: string;
  metadata: Record<string, any>;
  signature: string;
  nonce?: string;
  ip_address?: string;
  created_at: string;
}

export interface AuditEventList {
  events: AuditEventResponse[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface ListEventsOptions {
  page?: number;
  pageSize?: number;
  userId?: string;
  action?: string;
}

export interface VerifyEventResponse {
  valid: boolean;
  event_id: string;
  signature: string;
  verified_at: string;
  chain_valid?: boolean;
  prev_hash_valid?: boolean;
}

export interface SearchResult {
  id: string;
  action: string;
  resource: string | null;
  user_id: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
  ai_summary?: string;
  score: number | null;
  match_type: "semantic" | "fulltext" | "both";
}

export interface SearchEventsResponse {
  query: string;
  results: SearchResult[];
  count: number;
  has_embeddings: boolean;
}
