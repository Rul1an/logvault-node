# Changelog

All notable changes to the LogVault Node.js SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

