---
tags: [gotcha]
summary: gotcha implementation decisions and patterns
relevantTo: [gotcha]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 80
  referenced: 56
  successfulFeatures: 56
---
# gotcha

#### [Gotcha] Duplicate mypy config entries in pyproject.toml cause config errors (2026-01-28)

- **Situation:** Adding multiple `[[tool.mypy.overrides]]` sections for the same module with different `disable_error_code` values causes mypy to fail with a config error before even checking types.
- **Root cause:** Mypy doesn't merge duplicate module entries; it treats them as conflicting configuration.
- **How to avoid:** When adding new `disable_error_code` entries for an existing module, merge them into a single list instead of creating a new section:
  ```toml
  # ❌ WRONG - Duplicate module entries cause config error
  [[tool.mypy.overrides]]
  module = "src.services.streaming_enhanced"
  disable_error_code = ["call-overload"]

  [[tool.mypy.overrides]]
  module = "src.services.streaming_enhanced"
  disable_error_code = ["arg-type"]

  # ✅ CORRECT - Single entry with merged error codes
  [[tool.mypy.overrides]]
  module = "src.services.streaming_enhanced"
  disable_error_code = ["call-overload", "arg-type"]
  ```

#### [Gotcha] Missing return type annotation on inner async functions causes mypy to infer Any (2026-01-28)

- **Situation:** Inner functions (especially async functions passed to higher-order functions) without explicit return type annotations cause mypy to infer `Any`, leading to `no-any-return` errors.
- **Root cause:** Mypy cannot infer return types for functions passed as arguments without explicit annotations.
- **How to avoid:** Always add return type annotations to inner functions, even when the type seems obvious:
  ```python
  # ❌ WRONG - No return type annotation
  async def run_workflow():
      return await self._execute_workflow(...)

  # ✅ CORRECT - Explicit return type annotation
  async def run_workflow() -> dict[str, Any]:
      return await self._execute_workflow(...)
  ```

#### [Gotcha] External library type stubs may be incomplete, requiring type: ignore comments (2026-01-28)

- **Situation:** Some libraries (like pydantic_ai) have incomplete type stubs where `result.output` returns `Any` even when the Agent is properly typed with `Agent[ResultType, DepsType]`.
- **Root cause:** The library's type stubs don't fully capture the generic relationship between Agent type parameters and run() return types.
- **How to avoid:** Use explicit type casts with explanatory `# type: ignore` comments when external libraries have incomplete type support:
  ```python
  # Type cast needed because pydantic_ai's Agent.run() returns Any for output
  # due to incomplete type stubs in the library
  output: GeneratedTitle = result.output  # type: ignore[assignment]
  title = output.title.strip()
  ```
- **When to use:** Only after confirming the library's type stubs are incomplete. Check the library's GitHub issues or type stub definitions first. Prefer fixing the type stubs upstream if possible.

#### [Gotcha] Email processor doesn't validate sender address format, delegates to SendGrid (2026-01-21)

- **Situation:** Invalid from-address would cause SendGrid 403 errors at send-time, not queue-time
- **Root cause:** SendGrid API validates sender format and verified addresses. Local validation would duplicate their logic and might diverge. Errors at send-time still trigger retries and notification status updates, so not silent failures.
- **How to avoid:** Simpler code but errors only discoverable when running against actual SendGrid, not in unit tests
