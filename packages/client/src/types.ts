/**
 * LogVault TypeScript Types
 */

export interface LogVaultConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  enableNonce?: boolean;
  maxRetries?: number;
  /**
   * Enable local development mode.
   * In local mode, events are logged to console instead of sent to the API.
   * Auto-detects NODE_ENV === 'development' if set to 'auto'.
   *
   * @default false
   */
  localMode?: boolean | "auto";
  /**
   * Options for local mode output.
   */
  localModeOptions?: LocalModeOptions;
}

export interface LocalModeOptions {
  /**
   * Show colored output in console.
   * @default true
   */
  colors?: boolean;
  /**
   * Show table/box formatting.
   * @default true
   */
  prettyPrint?: boolean;
  /**
   * Warn about potential PII in metadata.
   * @default true
   */
  piiWarnings?: boolean;
  /**
   * Show compliance status (GDPR, SOC2).
   * @default true
   */
  showCompliance?: boolean;
  /**
   * Custom logger function.
   * @default console.log
   */
  logger?: (message: string) => void;
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
