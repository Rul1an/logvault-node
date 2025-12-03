# LogVault Examples

Ready-to-use templates and integration guides for LogVault.

## Templates

### [events.template.ts](./events.template.ts)

Type-safe audit event definitions with autocomplete. Copy to your project and customize.

**Features:**

- Pre-defined action taxonomy (auth, user, resource, team, security)
- Actor tracking helpers
- System event helpers
- Validation functions

### [vscode-tasks.json](./vscode-tasks.json)

Generic VS Code tasks for development workflow. Copy to `.vscode/tasks.json`.

**Tasks included:**

- Dev: Start (default build task)
- Lint: Check/Fix
- TypeScript: Check
- Test: Run All / Watch
- Build: Production
- Pre-commit: Full Check

## Integration Guides

### [Next.js Integration](./nextjs-integration/)

Complete guide for integrating LogVault with Next.js App Router:

- SDK singleton setup
- Server Actions examples
- API Routes examples
- ESLint plugin configuration
- Best practices

## Usage

1. Copy the template files you need to your project
2. Customize the actions and configuration for your use case
3. Follow the integration guides for framework-specific setup

## More Resources

- [LogVault Documentation](https://logvault.eu/docs)
- [ESLint Plugin](../packages/eslint-plugin)
- [Schemas Package](../packages/schemas)
- [Client SDK](../packages/client)

