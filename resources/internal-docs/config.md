## VS Code

A nice feature of eslint/prettier is "fix all" on save. However, this can lead to unexpected behaviors: https://stackoverflow.com/questions/66951499/prevent-deleting-dead-code-during-auto-format-on-save. In particular, dead code is automatically eliminated, even when this dead code is the result of a temporary syntax error. For instance, while writing "return", everything afterwards in the scope gets marked as dead code, and saving then deletes all the code.

The fix is to make the fixAll action less aggressive, in the VS Code config:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```
