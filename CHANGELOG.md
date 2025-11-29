# Changelog

All notable changes to the LogVault Node.js SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.4] - 2025-11-29

### Added

- **Hash Chain Integrity Methods:**
  - `verifyChain()` - Verify cryptographic integrity of the audit log chain
  - `getChainStats()` - Get chain statistics (coverage, chained/legacy events)
  - `getEventProof()` - Get cryptographic proof for a specific event
  - `verifyEventLocally()` - Offline verification without API calls
- New TypeScript types: `ChainVerificationResult`, `ChainStats`, `EventProof`, `LocalVerificationResult`

## [0.2.3] - 2025-11-29

### Added

- `listEvents()` method to retrieve audit events with filtering
- `getEvent()` method to fetch a single event by ID
- `verifyEvent()` method for cryptographic signature verification
- `searchEvents()` method for semantic/full-text search
- New TypeScript types: `VerifyEventResponse`, `SearchResult`, `SearchEventsResponse`

### Changed

- Improved TypeScript exports for all new types

## [0.2.2] - 2025-11-27

### Added

- Exponential backoff with jitter for automatic retries
- Strict action format validation (`entity.verb` pattern)
- Fail-safe JSON serialization (handles circular references)
- Explicit timeout handling with `AbortController`

### Changed

- Improved error sanitization to prevent sensitive data leakage
- Dynamic version detection from package.json

### Fixed

- TypeScript type exports for `LogVaultConfig` and `LogEvent`

## [0.2.1] - 2025-11-26

### Fixed

- Payload key compatibility (`user_id` vs `userId`)

## [0.2.0] - 2025-11-26

### Added

- Configurable timeout settings
- Retry logic with configurable max attempts
- Better TypeScript types

### Changed

- Package renamed to `@logvault/client` (scoped)
- Uses native `fetch` instead of external dependencies

## [0.1.0] - 2025-11-20

### Added

- Initial release
- `Client` class for API calls
- `log()` method for creating audit events
- `listEvents()` method for retrieving events
- Custom exceptions: `APIError`, `AuthenticationError`, `RateLimitError`, `ValidationError`
- Full TypeScript support
