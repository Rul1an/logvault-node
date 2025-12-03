---
"@logvault/eslint-plugin": patch
---

Fix infinite recursion in AST traversal

Skip circular reference keys (parent, tokens, comments, loc, range) during AST node traversal to prevent stack overflow errors.

