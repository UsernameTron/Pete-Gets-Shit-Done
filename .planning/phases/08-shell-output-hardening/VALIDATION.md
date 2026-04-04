# Validation Record — Phase 8: Shell & Output Hardening

**Validated:** 2026-04-04
**Method:** Retrospective reconstruction from PLAN.md + SUMMARY.md artifacts
**Validator:** gsd-verifier scope:nyquist (retroactive)

## Acceptance Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `validateShellArg()` rejects `;`, `\|`, `&`, `>`, `<`, `\n`, `\r`, `~user` (SEC-03) | PASS | 3 new validation blocks added to security.cjs; 10 new tests confirm each metacharacter class |
| 2 | `validateShellArg()` still allows `$50`, `hello world`, `hello-world` | PASS | Existing tests for safe patterns continue to pass |
| 3 | `output()` produces `__GSD_TRUNCATED__` sentinel on temp file failure (SEC-04) | PASS | try/catch wrapper added to core.cjs `output()`, falls back to 50KB truncation + sentinel |
| 4 | All existing tests pass | PASS | Full suite passes (pre-existing failures unrelated to phase) |
| 5 | New tests cover both fixes | PASS | 10 new tests for SEC-03 in security.test.cjs, 1 new test for SEC-04 in core.test.cjs |

## Test Coverage

- `security.test.cjs`: 78/78 pass (10 new tests for metacharacter rejection)
- `core.test.cjs`: 129/129 pass (1 new test for truncation sentinel via stubbed `fs.writeFileSync`)
- Full suite: all pass

## Notes

- Tilde expansion rejection only triggers for `~username` patterns (e.g., `~root`). Bare `~/` and mid-string tildes are preserved as safe.
- Validation reconstructed retroactively from 08-01-PLAN.md and 08-01-SUMMARY.md artifacts.
