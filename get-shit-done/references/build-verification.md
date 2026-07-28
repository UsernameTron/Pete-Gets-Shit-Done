<purpose>
Shared build/test/lint verification procedure. Referenced by finalize (Gate 2),
closeout (Gate 2b), and confidence (Leg 3) so the logic lives in exactly one place.
Project-agnostic: commands come from the project's CLAUDE.md, with manifest-based
fallback detection — never hardcode `npm test` or `make`.
</purpose>

<procedure>
1. Read `CLAUDE.md`. Look for `## Tests`, `## Commands`, or fenced `bash` blocks
   listing build/test/lint commands.
2. Identify candidate commands, in this order:
   - Scaffold/structure check (if the project defines one)
   - Type check (tsc, mypy, etc.)
   - Lint (biome, ruff, eslint, etc.)
   - Test suite (npm test, bun test, pytest, cargo test, make test-all, etc.)
3. If CLAUDE.md lists no commands, fall back to manifest detection:
   - `package.json` → `scripts.build` / `scripts.lint` / `scripts.test` (run via npm/bun/pnpm per lockfile)
   - `Cargo.toml` → `cargo build` / `cargo clippy` / `cargo test`
   - `pyproject.toml` or `requirements.txt` → `ruff check .` (if installed) / `python -m pytest -q`
   - `Makefile` → `make test` if the target exists
4. For each command, probe availability first (`command -v`, or the script key in the
   manifest). Execute each available command and record `PASS` / `FAIL` / `SKIPPED (not available)`.
   Capture stderr on failure.
5. Present the verification table:

   ```
   | Check        | Result | Detail            |
   |--------------|--------|-------------------|
   | scaffold     | PASS   | 43/43             |
   | type-check   | PASS   | 0 errors          |
   | lint         | PASS   | clean             |
   | tests        | PASS   | 2,644 passed      |
   ```

6. Verdict line for callers (parseable — the caller greps this, never the prose):

   ```
   build-verification: PASS | FAIL (<first failing check>: <first stderr line>)
   ```
</procedure>

<caller_contract>
- Callers MUST stop or route to their own failure handler on `FAIL`. Never proceed
  past a failing build-verification with mutation gates ahead.
- Callers running this more than once in a chain (e.g. closeout Gate 2b then
  finalize Gate 2) are an intentional double-check, not duplication — the later run
  catches anything the chain itself broke.
- A project with zero detectable commands reports every row `SKIPPED` and the verdict
  `PASS` with detail `no build commands defined` — absence of tooling is not a failure,
  but callers SHOULD surface it as a warning.
</caller_contract>
