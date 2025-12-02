/**
 * Styled console output utilities
 */

import chalk from "chalk";

// Brand colors
const BRAND_COLOR = "#208A96";

export const output = {
  // Headers and boxes
  banner(title: string, subtitle?: string) {
    console.log("");
    console.log(
      chalk.cyan("╔════════════════════════════════════════════════════╗"),
    );
    console.log(
      chalk.cyan("║") + `  ${chalk.bold(title)}`.padEnd(53) + chalk.cyan("║"),
    );
    if (subtitle) {
      console.log(
        chalk.cyan("║") +
          `  ${chalk.dim(subtitle)}`.padEnd(53) +
          chalk.cyan("║"),
      );
    }
    console.log(
      chalk.cyan("╚════════════════════════════════════════════════════╝"),
    );
    console.log("");
  },

  box(content: string[]) {
    const maxLen = Math.max(...content.map((l) => l.length));
    const width = Math.max(maxLen + 4, 50);

    console.log(chalk.gray("┌" + "─".repeat(width) + "┐"));
    for (const line of content) {
      console.log(
        chalk.gray("│") + " " + line.padEnd(width - 2) + " " + chalk.gray("│"),
      );
    }
    console.log(chalk.gray("└" + "─".repeat(width) + "┘"));
  },

  // Status messages
  success(message: string) {
    console.log(chalk.green("✓") + " " + message);
  },

  error(message: string) {
    console.log(chalk.red("✗") + " " + message);
  },

  warning(message: string) {
    console.log(chalk.yellow("⚠") + " " + message);
  },

  info(message: string) {
    console.log(chalk.blue("ℹ") + " " + message);
  },

  step(message: string) {
    console.log(chalk.cyan("→") + " " + message);
  },

  // Formatted output
  label(label: string, value: string) {
    console.log(chalk.dim(label + ":") + " " + value);
  },

  code(text: string) {
    return chalk.cyan(text);
  },

  url(url: string) {
    return chalk.underline.blue(url);
  },

  dim(text: string) {
    return chalk.dim(text);
  },

  bold(text: string) {
    return chalk.bold(text);
  },

  // Next steps
  nextSteps(steps: string[]) {
    console.log("");
    console.log(chalk.bold("📋 Next steps:"));
    steps.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step}`);
    });
    console.log("");
  },

  // Table
  table(headers: string[], rows: string[][]) {
    const colWidths = headers.map(
      (h, i) => Math.max(h.length, ...rows.map((r) => (r[i] || "").length)) + 2,
    );

    // Header
    console.log(
      chalk.gray("┌" + colWidths.map((w) => "─".repeat(w)).join("┬") + "┐"),
    );
    console.log(
      chalk.gray("│") +
        headers
          .map((h, i) => chalk.bold(h.padEnd(colWidths[i])))
          .join(chalk.gray("│")) +
        chalk.gray("│"),
    );
    console.log(
      chalk.gray("├" + colWidths.map((w) => "─".repeat(w)).join("┼") + "┤"),
    );

    // Rows
    for (const row of rows) {
      console.log(
        chalk.gray("│") +
          row
            .map((cell, i) => (cell || "").padEnd(colWidths[i]))
            .join(chalk.gray("│")) +
          chalk.gray("│"),
      );
    }

    console.log(
      chalk.gray("└" + colWidths.map((w) => "─".repeat(w)).join("┴") + "┘"),
    );
  },

  // JSON output for CI/CD
  json(data: unknown) {
    console.log(JSON.stringify(data, null, 2));
  },

  // Blank line
  newline() {
    console.log("");
  },
};
