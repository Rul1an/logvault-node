/**
 * logvault init command
 *
 * Authenticate with LogVault and retrieve API key
 */

import ora from "ora";
import { runOAuthFlow, waitForManualAuth } from "../auth/oauth.js";
import { startCallbackServer } from "../auth/server.js";
import { getAuthUrl, urls } from "../utils/api.js";
import { output } from "../utils/output.js";
import crypto from "crypto";

interface InitOptions {
  browser?: boolean; // Commander uses negated form, so this is the opposite of --no-browser
  json?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const noBrowser = options.browser === false;
  const jsonOutput = options.json === true;

  if (!jsonOutput) {
    output.banner("🔐 LogVault CLI", "Opening browser for authentication...");
  }

  try {
    if (noBrowser) {
      // Manual flow: show URL and wait
      await runManualFlow(jsonOutput);
    } else {
      // Browser flow: open browser automatically
      await runBrowserFlow(jsonOutput);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (jsonOutput) {
      output.json({ success: false, error: message });
    } else {
      output.error(`Authentication failed: ${message}`);
    }

    process.exit(1);
  }
}

async function runBrowserFlow(jsonOutput: boolean): Promise<void> {
  const spinner = jsonOutput
    ? null
    : ora("Waiting for authentication...").start();

  const result = await runOAuthFlow({ noBrowser: false });

  if (!result.success || !result.data) {
    spinner?.fail("Authentication failed");
    throw new Error(result.error || "Authentication failed");
  }

  spinner?.succeed("Authentication successful");

  displayResult(result.data, jsonOutput);
}

async function runManualFlow(jsonOutput: boolean): Promise<void> {
  // Start server first
  const state = crypto.randomBytes(16).toString("hex");
  const server = await startCallbackServer();
  const authUrl = getAuthUrl(server.port, state);

  if (!jsonOutput) {
    output.newline();
    output.info("Browser opening disabled. Please open this URL manually:");
    output.newline();
    console.log(`  ${output.url(authUrl)}`);
    output.newline();
  }

  const spinner = jsonOutput
    ? null
    : ora("Waiting for authentication...").start();

  const result = await waitForManualAuth(server);

  if (!result.success || !result.data) {
    spinner?.fail("Authentication failed");
    throw new Error(result.error || "Authentication failed");
  }

  spinner?.succeed("Authentication successful");

  displayResult(result.data, jsonOutput);
}

function displayResult(
  data: { apiKey: string; organization: { name: string; email: string } },
  jsonOutput: boolean,
): void {
  if (jsonOutput) {
    output.json({
      success: true,
      apiKey: data.apiKey,
      organization: data.organization,
    });
    return;
  }

  output.newline();
  output.success(`Authenticated as ${output.bold(data.organization.email)}`);
  output.success(`Organization: ${output.bold(data.organization.name)}`);
  output.newline();

  // Display API key in a box
  output.box([
    "Your API Key:",
    "",
    data.apiKey,
    "",
    "Add to your .env file:",
    `LOGVAULT_API_KEY=${data.apiKey}`,
  ]);

  // Next steps
  output.nextSteps([
    "Copy the API key above to your .env file",
    `Install the SDK: ${output.code("npm install @logvault/client")}`,
    `Generate config: ${output.url(urls.configGenerator)}`,
  ]);

  output.info(`Documentation: ${output.url(urls.docs)}`);
  output.newline();
}
