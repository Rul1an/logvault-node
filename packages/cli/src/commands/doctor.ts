/**
 * logvault doctor command
 *
 * Diagnose common setup issues
 */

import ora from "ora";
import { checkHealth, validateApiKeyFormat, urls } from "../utils/api.js";
import { output } from "../utils/output.js";

interface DoctorOptions {
  json?: boolean;
}

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  details?: string;
}

export async function doctorCommand(options: DoctorOptions): Promise<void> {
  const jsonOutput = options.json === true;
  const results: CheckResult[] = [];

  if (!jsonOutput) {
    output.banner("🩺 LogVault Doctor", "Checking your setup...");
    output.step("Checking environment...");
    output.newline();
  }

  // Check 1: Node.js version
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.slice(1).split(".")[0], 10);

  if (nodeMajor >= 18) {
    results.push({
      name: "Node.js version",
      status: "pass",
      message: `${nodeVersion} (>= 18.0.0)`,
    });
  } else {
    results.push({
      name: "Node.js version",
      status: "fail",
      message: `${nodeVersion} (requires >= 18.0.0)`,
      details: "Please upgrade Node.js to version 18 or higher",
    });
  }

  // Check 2: Environment variable exists
  const apiKey = process.env.LOGVAULT_API_KEY;

  if (apiKey) {
    results.push({
      name: "LOGVAULT_API_KEY",
      status: "pass",
      message: "Found in environment",
    });
  } else {
    results.push({
      name: "LOGVAULT_API_KEY",
      status: "fail",
      message: "Not found in environment",
      details: "Run `logvault init` to get your API key",
    });
  }

  // Check 3: API key format
  if (apiKey) {
    const formatCheck = validateApiKeyFormat(apiKey);

    if (formatCheck.valid) {
      const keyType = apiKey.startsWith("lv_live_") ? "production" : "test";
      results.push({
        name: "API key format",
        status: "pass",
        message: `Valid (${keyType} key)`,
      });
    } else {
      results.push({
        name: "API key format",
        status: "fail",
        message: formatCheck.message || "Invalid format",
        details: "Expected format: lv_live_* or lv_test_*",
      });
    }
  }

  // Check 4: API connectivity
  if (apiKey && validateApiKeyFormat(apiKey).valid) {
    const spinner = jsonOutput
      ? null
      : ora("Testing API connection...").start();

    try {
      const health = await checkHealth(apiKey);
      spinner?.stop();

      if (health.status === "ok") {
        results.push({
          name: "API connection",
          status: "pass",
          message: `Successful (ping: ${health.latency}ms)`,
        });

        // Check 5: Organization info
        if (health.organization) {
          results.push({
            name: "Organization",
            status: "pass",
            message: health.organization.name,
          });
        }

        // Check 6: Quota
        if (health.quota) {
          const percentage = Math.round(
            (health.quota.used / health.quota.limit) * 100,
          );
          const quotaStatus = percentage >= 90 ? "warn" : "pass";

          results.push({
            name: "Events quota",
            status: quotaStatus,
            message: `${health.quota.used.toLocaleString()} / ${health.quota.limit.toLocaleString()} (${percentage}%)`,
            details:
              quotaStatus === "warn"
                ? "Consider upgrading your plan"
                : undefined,
          });
        }
      } else {
        results.push({
          name: "API connection",
          status: "fail",
          message: "Failed to connect",
          details: "Check your API key and network connection",
        });
      }
    } catch (error) {
      spinner?.stop();
      results.push({
        name: "API connection",
        status: "fail",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Output results
  if (jsonOutput) {
    const allPassed = results.every((r) => r.status === "pass");
    output.json({
      success: allPassed,
      checks: results,
    });
    return;
  }

  // Display results
  for (const result of results) {
    switch (result.status) {
      case "pass":
        output.success(`${result.name}: ${result.message}`);
        break;
      case "warn":
        output.warning(`${result.name}: ${result.message}`);
        if (result.details) {
          console.log(`   ${output.dim(result.details)}`);
        }
        break;
      case "fail":
        output.error(`${result.name}: ${result.message}`);
        if (result.details) {
          console.log(`   ${output.dim(result.details)}`);
        }
        break;
    }
  }

  output.newline();

  // Summary
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const warned = results.filter((r) => r.status === "warn").length;

  if (failed === 0 && warned === 0) {
    output.success("All checks passed! Your LogVault setup is healthy.");
  } else if (failed === 0) {
    output.warning(`${passed} checks passed, ${warned} warnings.`);
  } else {
    output.error(`${failed} checks failed, ${passed} passed.`);
    output.newline();
    output.info(`Need help? ${output.url(urls.docs)}`);
  }

  output.newline();

  // Exit with error code if any checks failed
  if (failed > 0) {
    process.exit(1);
  }
}
