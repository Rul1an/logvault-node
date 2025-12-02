#!/usr/bin/env node
/**
 * LogVault CLI Entry Point
 *
 * Usage:
 *   npx @logvault/cli init     - Authenticate and get API key
 *   npx @logvault/cli doctor   - Health diagnostics
 *   npx @logvault/cli keys     - List API keys
 */

import { program } from "commander";
import { initCommand } from "../commands/init.js";
import { doctorCommand } from "../commands/doctor.js";
import { keysCommand } from "../commands/keys.js";

const VERSION = "0.1.0";

program
  .name("logvault")
  .description("LogVault CLI - Audit logging setup in 2 minutes")
  .version(VERSION);

// logvault init
program
  .command("init")
  .description("Authenticate with LogVault and retrieve your API key")
  .option("--no-browser", "Print URL instead of opening browser")
  .option("--json", "Output JSON (for CI/CD)")
  .action(initCommand);

// logvault doctor
program
  .command("doctor")
  .description("Diagnose common setup issues")
  .option("--json", "Output JSON")
  .action(doctorCommand);

// logvault keys
program
  .command("keys")
  .description("List your API keys")
  .option("--json", "Output JSON")
  .action(keysCommand);

program.parse();
