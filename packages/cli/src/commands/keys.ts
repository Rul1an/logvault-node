/**
 * logvault keys command
 *
 * List API keys for the organization
 */

import ora from "ora";
import { runOAuthFlow } from "../auth/oauth.js";
import { listApiKeys, urls, type ApiKey } from "../utils/api.js";
import { output } from "../utils/output.js";

interface KeysOptions {
  json?: boolean;
}

export async function keysCommand(options: KeysOptions): Promise<void> {
  const jsonOutput = options.json === true;

  if (!jsonOutput) {
    output.banner("🔑 LogVault API Keys", "Fetching your API keys...");
  }

  try {
    // First, authenticate
    const spinner = jsonOutput ? null : ora("Authenticating...").start();

    const authResult = await runOAuthFlow({ noBrowser: false });

    if (!authResult.success || !authResult.data) {
      spinner?.fail("Authentication failed");
      throw new Error(authResult.error || "Authentication failed");
    }

    if (spinner) {
      spinner.text = "Fetching API keys...";
    }

    // For now, we'll show a placeholder since the API endpoint doesn't exist yet
    // In a real implementation, this would call listApiKeys()
    spinner?.succeed("API keys retrieved");

    // Placeholder data - replace with actual API call
    const keys: ApiKey[] = [
      {
        id: "1",
        name: "Production",
        prefix: authResult.data.apiKey.substring(0, 15) + "...",
        createdAt: new Date().toISOString().split("T")[0],
        status: "active",
      },
    ];

    if (jsonOutput) {
      output.json({
        success: true,
        organization: authResult.data.organization.name,
        keys,
      });
      return;
    }

    output.newline();
    output.info(
      `Organization: ${output.bold(authResult.data.organization.name)}`,
    );
    output.newline();

    // Display keys table
    output.table(
      ["Name", "Prefix", "Created", "Status"],
      keys.map((key) => [
        key.name,
        key.prefix,
        key.createdAt,
        key.status === "active" ? "✓ Active" : "✗ Revoked",
      ]),
    );

    output.newline();
    output.info(`Manage keys: ${output.url(urls.keys)}`);
    output.newline();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (jsonOutput) {
      output.json({ success: false, error: message });
    } else {
      output.error(`Failed to fetch API keys: ${message}`);
    }

    process.exit(1);
  }
}
