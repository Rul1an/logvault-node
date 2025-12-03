# @logvault/eslint-plugin

## 0.2.1

### Patch Changes

- efedc29: Fix npm publish for scoped package

  Added publishConfig with access: public to enable publishing scoped packages to npm.

## 0.2.0

### Minor Changes

- 7f9d45e: Initial release of @logvault/eslint-plugin for Shift-Left Compliance

  ### Features
  - **require-audit-in-catch**: Warn when catch blocks don't log errors to audit trail
  - **require-audit-in-mutations**: Warn on DELETE/PUT/POST/PATCH handlers without audit logging
  - **no-pii-in-logs**: Error when PII fields are logged directly without transformation

  ### Presets
  - `recommended`: Warns on missing audits, errors on PII
  - `strict`: Errors on all violations

  ### Configuration

  Supports ESLint v9 flat config with full TypeScript type safety.

  ```javascript
  import logvault from "@logvault/eslint-plugin";

  export default [logvault.configs.recommended];
  ```
