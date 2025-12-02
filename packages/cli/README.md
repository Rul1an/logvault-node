# LogVault CLI

[![npm version](https://img.shields.io/npm/v/@logvault/cli.svg)](https://www.npmjs.com/package/@logvault/cli)
[![Node.js](https://img.shields.io/node/v/@logvault/cli.svg)](https://www.npmjs.com/package/@logvault/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official CLI for [LogVault](https://logvault.eu) — Audit-Log-as-a-Service for B2B SaaS.

**Setup audit logging in 2 minutes, not 45.**

## Installation

```bash
# Run directly with npx (recommended)
npx @logvault/cli init

# Or install globally
npm install -g @logvault/cli
logvault init
```

## Quick Start

```bash
# 1. Authenticate and get your API key
npx @logvault/cli init

# 2. Check your setup
npx @logvault/cli doctor

# 3. List your API keys
npx @logvault/cli keys
```

## Commands

### `logvault init`

Authenticate with LogVault and retrieve your API key.

```bash
npx @logvault/cli init
```

**What it does:**

1. Opens your browser for authentication
2. Fetches your API key
3. Displays the key for you to copy to `.env`
4. Points you to the Dashboard Config Generator

**Options:**

- `--no-browser` - Print URL instead of opening browser (for SSH/headless)
- `--json` - Output JSON (for CI/CD pipelines)

### `logvault doctor`

Diagnose common setup issues.

```bash
npx @logvault/cli doctor
```

**Checks:**

- ✓ Node.js version (>= 18.0.0)
- ✓ `LOGVAULT_API_KEY` environment variable
- ✓ API key format validation
- ✓ API connectivity
- ✓ Organization info
- ✓ Events quota

### `logvault keys`

List your API keys (requires authentication).

```bash
npx @logvault/cli keys
```

## Philosophy: Simple CLI, Smart Dashboard

We follow the [shadcn](https://ui.shadcn.com/) philosophy: **the CLI does one thing well**.

Instead of auto-detecting frameworks, parsing `.env` files, and generating config files (which leads to 30% maintenance time on edge cases), we:

1. **CLI:** Handles authentication only
2. **Dashboard:** Generates framework-specific config
3. **You:** Copy the config to your project

This means you understand exactly what's happening, and we don't break when you use a non-standard setup.

## Next Steps After `init`

1. Copy the API key to your `.env` file:

   ```
   LOGVAULT_API_KEY=lv_live_abc123...
   ```

2. Install the SDK:

   ```bash
   npm install @logvault/client
   ```

3. Generate your config at:
   [logvault.app/dashboard/config-generator](https://logvault.app/dashboard/config-generator)

4. Start logging:

   ```typescript
   import { Client } from "@logvault/client";

   const client = new Client(process.env.LOGVAULT_API_KEY!);

   await client.log({
     action: "user.login",
     userId: "user_123",
     resource: "auth",
   });
   ```

## Requirements

- Node.js 18+
- A LogVault account ([sign up free](https://logvault.app/signup))

## Links

- [Documentation](https://logvault.eu/docs)
- [Dashboard](https://logvault.app/dashboard)
- [API Reference](https://logvault.eu/docs/api)
- [GitHub](https://github.com/Rul1an/logvault-cli)

## License

MIT — see [LICENSE](LICENSE) for details.
