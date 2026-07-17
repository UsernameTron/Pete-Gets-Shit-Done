# Grok Build — Independent Evaluation
**Prepared:** July 17, 2026 · **Scope:** Should Grok Build become a permanent engineering component alongside Claude Code in a local-first Apple Silicon environment where source-code confidentiality matters?

---

## Verdict: Do not adopt at this time.

Grok Build is a real, well-engineered product — the harness design (kernel-level sandboxing, layered permissions, Claude Code compatibility, local-model support) is genuinely strong. But seven days before this review, an independent wire-level analysis proved that the Grok Build CLI was uploading entire Git repositories — full history and committed secrets included — to an xAI-controlled Google Cloud Storage bucket, regardless of which files the agent actually read, and that the product's only user-facing privacy toggle had no effect on the upload. The fix was a server-side flag under the vendor's control, the pledged deletion of already-uploaded data has not been independently verified, and the client-side upload machinery remains present in the source tree xAI open-sourced two days ago. In an environment where source confidentiality is a stated requirement, this tool has not yet re-earned the trust that repository access requires. A narrow, fully local experiment (compiled from source, pointed at local inference, network-blocked) is defensible now; anything touching xAI's cloud with real code is not. Re-evaluation gates are defined in the roadmap.

---

## Source verification (start-here check)

All five primary sources resolved on July 17, 2026:

| Source | Status | Review date of content |
|---|---|---|
| docs.x.ai/build/overview | Resolved | Last updated July 6, 2026 |
| x.ai/cli | Resolved | Current; reflects Grok 4.5 as backing model |
| x.ai/news/grok-build-cli (launch) | Resolved | Published May 25, 2026 |
| x.ai/news/grok-build-open-source | Resolved | Published July 15, 2026 |
| github.com/xai-org/grok-build | Resolved | Apache-2.0; ~13k stars; 2 squashed sync commits; cloned and inspected directly |

GitHub blocks automated access to individual file pages, so the repository was cloned and the bundled user guide (24 documents covering configuration, sandboxing, permissions, hooks, memory, subagents, and headless mode) was read from source. Note the vendor now brands itself "SpaceXAI" — xAI is described as a division of SpaceX. Assumptions are listed in the evidence log.

## Product summary

Grok Build (`grok`) is xAI's terminal coding agent: a Rust TUI plus agent runtime, launched in beta May 25, 2026 for SuperGrok and X Premium Plus subscribers, open-sourced under Apache-2.0 on July 15, 2026, currently powered by Grok 4.5. It offers plan mode with step-level approval, parallel subagents with worktree support, skills (including capturing a session as a skill), plugins and marketplaces, hooks, MCP servers, AGENTS.md project rules, experimental cross-session memory, headless mode with JSON output for CI, Agent Client Protocol support for editor embedding, and OS-level sandboxing (Seatbelt on macOS, Landlock on Linux). It deliberately interoperates with Claude Code: by default it reads CLAUDE.md files, the `~/.claude` directory, `.claude/rules/`, `.claude/settings.json` permission rules, and Claude-defined hooks. Custom models are first-class — any OpenAI-compatible endpoint, including localhost servers, can be set as default in `~/.grok/config.toml`.

---

## 1. Architecture recommendation

**Grok Build does not belong in this architecture today.** The role it would fill — an independent, second-opinion engineering intelligence layer — is real and valuable, but the value of independent validation depends entirely on the validator being trustworthy with the material it validates. As of this week, that condition fails.

If the re-evaluation gates in the roadmap pass, the correct slot is narrow: a **non-authoring review layer**. Read-only code review of diffs before merge, critique of Claude Code's plans, architecture second opinions, and batch technical-debt scans. It should never be a second author writing into the same working trees Claude Code owns; two agents mutating one tree is a merge-conflict and provenance problem the existing governance was not designed for. If authoring is ever piloted, it happens in dedicated worktrees only.

One configuration is defensible **now**, as an optional experiment rather than an adopted component: compile the harness from source, point it exclusively at local inference (the existing LM Studio server, or Ollama) via the custom-model config, and block all outbound network for it at the operating-system level. That evaluates the harness itself — the TUI, plan mode, review ergonomics — with zero xAI cloud exposure. It fits alongside the existing MCP infrastructure, second-brain knowledge system, and recovery systems without touching any of them; nothing in the existing architecture needs redesign to accommodate it, which is itself a point in the existing architecture's favor.

## 2. Deployment plan (conditional — applies only if pursued under the gates)

**Installation.** Do not use the official one-line `curl | bash` installer on the primary machine account. Build from source: the repository pins its Rust toolchain, and requires DotSlash and protoc; the release binary is `target/release/xai-grok-pager`, shipped officially as `grok`. Building from source ties the running binary to an inspectable tree and to the `SOURCE_REV` file that records the upstream monorepo commit.

**Isolation.** Run under a dedicated macOS standard user account, or at minimum with a separate `GROK_HOME`, so its credential store (`~/.grok/auth.json`), trust store, and state never mix with the primary environment. Enforce network egress with a macOS network filter or proxy allowlist **external to the tool** — this is non-negotiable, because Grok Build's own sandbox explicitly never restricts the agent's in-process HTTP, and its child-process network blocking is documented as a no-op on macOS.

**Updates.** Set `[cli] auto_update = false`. Updates are manual: read the changelog, diff `SOURCE_REV` between versions, rebuild, and re-run the egress verification test (Phase 2) before the new build touches anything real. Auto-updating a tool with this history would reintroduce unreviewed behavior silently.

## 3. Security review

**Documented current behavior (the design, which is largely good):**

- *Permissions* are layered: `PreToolUse` hooks, then declarative rules where deny beats ask beats allow across all sources, then remembered grants, then built-in read-only auto-approvals, then the mode policy (`default`, `dontAsk`, `bypassPermissions`, `acceptEdits`). A built-in dangerous-command list (`rm`, `chmod`, `kill`, `git push`, and similar) always re-prompts. Administrators can lock out bypass mode via a root-owned requirements file.
- *Sandboxing* applies Seatbelt (macOS) or Landlock (Linux) to the whole process at startup, irreversibly for the session, with profiles from `workspace` to `strict` and custom kernel-enforced deny globs for secrets. Documented caveats that matter here: the sandbox is **off by default**; child-process network blocking **does not work on macOS**; and the agent's own HTTP calls are never sandbox-restricted on any platform. The tool's sandbox therefore cannot protect you from the tool.
- *Honest sharp edges the docs themselves disclose:* hooks fail open (a crashed hook allows the call); an allow rule like `Bash(git *)` matches the whole command string, so it auto-approves `git status && rm -rf /` unless paired with deny rules; gitignored files are readable by default (`respect_gitignore = false`); and the very first approval prompt preselects "always allow, all sessions."
- *Cross-harness config bleed:* by default Grok Build ingests CLAUDE.md files, `~/.claude` content, `.claude/rules/`, `.claude/settings.json` permissions, and executes Claude-defined hooks (project-level ones behind a folder-trust gate). Convenient — but it means Claude Code instructions and any client context inside them flow into xAI's model context unless `[compat]` scanning is disabled.
- *Data controls on paper:* a `[features] telemetry` switch with Mixpanel and session-trace-upload sub-toggles; an opt-in, content-scrubbed external OpenTelemetry stream for enterprises; a `/privacy` command for retention status; memory off by default; API-key data governed by xAI's API policy (no training without permission, 30-day retention, enterprise-only Zero Data Retention with a verifiable response header).

**The historical incident (July 2026), distinguished from the above:**

Around July 10–12, 2026, researcher "cereblab" published a wire-level teardown of Grok Build CLI 0.2.93 showing that a normal consumer session uploaded the entire tracked Git repository as a bundle to a GCS bucket named `grok-code-session-traces`, via a `/v1/storage` endpoint, independent of which files the agent opened — on a 12 GB test repo, roughly 5.1 GB left the machine, thousands of times more data than the model conversation itself. File contents the agent did read, including a `.env` secrets file, appeared both in model requests and in a persisted session archive. Disabling the "Improve the model" toggle changed nothing; the researcher recovered a file the agent had been explicitly told not to read from the captured bundle. The behavior was present on free-tier accounts. The product had been marketed with local-first claims. The story reached the Hacker News front page.

xAI's response: Musk publicly pledged (July 13) complete deletion of previously uploaded data; xAI stated (July 14) that enterprise ZDR teams and API-key usage are not retained, and pointed users to `/privacy`; the researcher observed that what actually stopped the uploads was a silent **server-side** flag disabling codebase upload globally, and disputed that `/privacy` — a retention toggle — was the relevant control. The harness was open-sourced July 15. My direct inspection of that tree confirms the `/v1/storage` batch-upload client and the session-traces bucket constant are still present in the published code (one adjacent feature, remote sync of the session search index to that same bucket, is gated default-off in source). No independent audit of the deletion, no affected-user accounting, and no formal security advisory have been published as of this writing.

**Why this dominates the verdict:** the failure was not a bug in a permission check — it was a gap between marketed behavior and wire behavior, remediated by a switch the vendor controls, in a product whose own isolation mechanisms are architecturally unable to constrain its own network traffic. Trust here can only be rebuilt by external verification over time.

**Operational safeguards required before any repository access (post-gate):** API-key authentication only, never subscriber browser login, so the API data policy applies; a wire-level egress test on a canary repository seeded with unique marker strings, captured through a local proxy, on every version before use; OS-level egress allowlist; sandbox custom profile with deny globs for `**/.env`, `**/*.pem`, and credential paths, plus `respect_gitignore = true`; `defaultMode: "dontAsk"` for headless runs; telemetry, trace upload, feedback, and remote catalog fetches explicitly disabled in config; `[compat]` scanning of Claude and Cursor directories disabled unless deliberately wanted; a dedicated account; and periodic review of `~/.grok/sandbox-events.jsonl` and proxy logs.

## 4. Apple Silicon optimization

The binary is native Rust and builds cleanly on Apple Silicon with the pinned toolchain; macOS is a supported build host. Filesystem layout centers on `~/.grok/`: `config.toml` (settings, models, permissions, telemetry), `auth.json` (credentials — protect it), `sandbox.toml` (custom profiles), `hooks/`, `agents/`, `skills/`, `trusted_folders.toml`, and `sandbox-events.jsonl`. Project-level `.grok/` directories layer config, rules, agents, and hooks per repository. Shell integration is ordinary PATH placement; the TUI supports mouse, themes, and an ACP mode for editor embedding.

Sandboxing on macOS uses Seatbelt and its deny-glob enforcement is documented as airtight there (globs are enforced at runtime, covering files created after launch — stronger than the Linux behavior). The offsetting macOS weakness, worth repeating: child-process network restriction is a no-op, so `curl` inside an agent bash command is not blocked by any profile — only an external network filter closes that.

Local inference is directly supported: any OpenAI-compatible localhost server can be registered as a model and set as default. For the existing LM Studio setup:

```toml
# ~/.grok/config.toml
[model.local-qwen]
model = "qwen3.5-27b"
base_url = "http://localhost:1234/v1"
name = "Qwen 3.5 27B (LM Studio)"

[models]
default = "local-qwen"
```

Performance notes: parallel subagents each carry their own context window (memory pressure scales with concurrency — fine at 48 GB for review workloads); reasoning effort is tunable per run (`--effort` from minimal to max); auto-compaction triggers at 85% of context by default; local codebase indexing (`codebase_indexing = true`) speeds navigation, and `grok inspect` shows exactly what config, rules, skills, and servers were discovered in a directory — useful for auditing what the tool would ingest before it runs.

## 5. Integration opportunities (each contingent on the gates)

The constraint was that every recommendation name its specific measurable improvement. In each case the improvement comes from **model independence** — a different model family reviewing work the primary agent produced, catching the blind spots a single model shares with itself:

- **Independent code review:** headless, read-only sandbox, deny rules on edit and bash, reviewing diffs Claude Code produced. Measurable: unique true-positive defects found that Claude Code's own review missed, on seeded-defect benchmarks and live diffs (Phase 3 measures this).
- **Plan review:** feed Claude-authored implementation plans to Grok Build's plan mode or a review prompt for step-level critique before execution. Measurable: pre-execution plan corrections that would otherwise have surfaced as rework.
- **Architecture and technical-debt discovery:** batch headless runs with JSON output across repositories, feeding findings into the existing repository-health and governance tooling rather than a new system. Measurable: confirmed debt items per repository not already tracked.
- **Security and documentation review:** strict-sandbox review of dependency changes and docs-versus-behavior drift. Measurable: confirmed findings per review hour versus the current single-model baseline.
- **Portfolio intelligence:** summarization runs across repos in read-only mode, output routed to existing planning documents. Measurable: reduction in manual portfolio-review time at equal accuracy.

Honest caveat: this independence value does not require this vendor. OpenAI's Codex CLI, Aider with a local or third-party model, or the local LM Studio stack already provide cross-model review with better-understood data posture. Grok Build must beat those alternatives on review quality in Phase 3 to justify its risk overhead — that comparison is the phase's exit criterion, not an assumption.

## 6. Anti-patterns — where Grok Build should not be used

- Not on any confidential, client, or NDA-covered code until the roadmap gates pass — under any configuration that can reach xAI's cloud.
- Never authenticated via subscriber browser login for real work; that path carries consumer-tier data handling and was the tier the incident was demonstrated on.
- Never as a co-author in the same working tree as Claude Code; never with `--yolo` or bypass-permissions outside a disposable sandbox.
- Never trusting its own sandbox as the network boundary on macOS — it is documented not to be one.
- Never as a memory or knowledge system. The workspace already has a canonical cross-session memory system; Grok Build's experimental memory stays disabled so a parallel, unaudited knowledge store does not appear.
- No marketplace plugins or third-party skills without review — plugins bundle hooks and MCP servers, which execute code, and folder trust cascades to subdirectories.
- Never treating `/privacy` as a data-transmission control. It is a retention control; the distinction is the central lesson of the incident.
- Not for replacing Claude Code, and not as the default agent for anything — the mandate here is a second opinion, and nothing in the evidence supports more.

## 7. Phased rollout roadmap

**Gate A (precondition between Phases 2 and 3):** (1) an independent audit, or a reproducible community wire test on a current build, confirming no repository-scale egress and a functioning, client-side, default-off upload control; (2) ninety days from July 14, 2026 with no new data-handling incident; (3) a formal advisory or verification of the pledged deletion. All three, or the evaluation stops at Phase 2.

**Phase 1 — Research.** *Objective:* establish ground truth from primary sources. *Risks:* stale or vendor-favorable information. *Validation:* every material claim tied to a resolvable source; unknowns listed. *Rollback:* none needed. **Status: complete — this report.**

**Phase 2 — Sandbox deployment (permitted now).** *Objective:* build from source in an isolated account; run only against throwaway canary repositories seeded with unique marker strings; two configurations — fully local model with all egress blocked, and (optionally) xAI API-key mode behind a logging proxy. *Risks:* undisclosed egress; credential leakage from the sandbox account. *Validation:* zero unexpected outbound connections in proxy and network-filter logs; no canary markers ever observed leaving the machine; sandbox deny globs verified to block a planted fake secret. *Rollback:* delete the account, `~/.grok`, and the binary; revoke the test API key.

**Phase 3 — Read-only portfolio review (Gate A required).** *Objective:* headless read-only review of non-sensitive repositories; head-to-head against Claude Code review on identical diffs with seeded defects. *Risks:* config bleed from Claude directories; silent behavior change in an update. *Validation:* measurable unique-defect yield versus the Claude-only baseline and versus a local-model alternative; egress logs stay clean across the phase; every version bump re-passes the Phase 2 wire test. *Rollback:* remove read grants and fall back to the existing single-agent review; nothing downstream depends on it yet.

**Phase 4 — Controlled engineering usage.** *Objective:* limited authoring in dedicated worktrees only, plan-mode-gated, narrow allow rules, dangerous commands denied, all merges through normal human review. *Risks:* provenance confusion between agents; scope drift. *Validation:* defect-catch and rework metrics justify the second agent; no permission or sandbox violations logged. *Rollback:* delete the worktrees; primary workflow is untouched by design.

**Phase 5 — Production adoption.** *Objective:* permanent-component status. *Preconditions beyond Gate A:* enterprise ZDR or equivalent contractual data terms verified via the response header; managed configuration locking bypass mode; a monitored update process. *Validation:* two consecutive quarters of clean egress logs and sustained measurable review value. *Rollback:* the Phase 2 removal procedure, plus rotation of any credential the tool ever had line-of-sight to.

---

## Evidence log

| Claim | Source |
|---|---|
| Product exists; TUI/headless/ACP; install; custom local models via config.toml; `grok inspect`; Grok 4.5 backing model | docs.x.ai/build/overview (updated July 6, 2026) |
| Launch May 25, 2026, beta for SuperGrok / X Premium Plus; plan mode; subagents with worktrees; AGENTS.md/plugins/hooks/skills/MCP out of the box | x.ai/news/grok-build-cli |
| Open-sourced July 15, 2026, Apache-2.0; fully local-first operation possible by compiling and pointing at local inference | x.ai/news/grok-build-open-source; github.com/xai-org/grok-build README |
| Feature set incl. memory, code review, sandboxed execution, background tasks; free tier | x.ai/cli |
| Sandbox profiles, Seatbelt/Landlock, macOS child-network no-op, in-process HTTP never restricted, deny-glob enforcement, session-pinned profiles | Repo user guide `18-sandbox.md` (read from cloned source) |
| Permission pipeline, dontAsk, dangerous-command list, allow-rule whole-string pitfall, hooks fail open, Claude settings compatibility, requirements.toml locks | User guide `22-permissions-and-safety.md` |
| Reads CLAUDE.md / `~/.claude` / `.claude/rules` / Cursor rules by default; `[compat]` toggles | User guide `12-project-rules.md` |
| Auth precedence (per-model key > session token > `XAI_API_KEY`); OIDC; external auth provider; `auth.json` | User guide `02-authentication.md` |
| Telemetry master switch, Mixpanel and trace-upload sub-toggles, external OTel privacy model, `respect_gitignore = false`, first-prompt preselection, memory off by default, auto-update setting | User guide `05-configuration.md`, `24-monitoring-usage.md`, `13-memory.md`, `04-slash-commands.md` |
| API data policy: no training without permission, 30-day retention, enterprise-only ZDR with verification header | docs.x.ai developer security FAQ |
| July 2026 incident: full-repo bundle uploads to `grok-code-session-traces`, secrets included, toggle ineffective, free-tier reproduction, server-side kill flag, marketing contradiction, HN reception | Wire-level teardown coverage: the-agent-report.com (Jul 13), aiyu.co.in (Jul 11), qwe.edu.pl (Jul 11), thenextweb.com (Jul 14), explainx.ai incl. xAI's July 14 statement, techtimes.com (Jul 14 and Jul 16) |
| Musk deletion pledge (July 13); researcher's dispute of the `/privacy` framing | techtimes.com (Jul 14, Jul 16); explainx.ai |
| `/v1/storage` batch-upload client and session-traces bucket constant present in the published tree; search-index remote sync gated default-off | Direct inspection of cloned source: `crates/codegen/xai-file-utils/src/storage_client.rs`, `crates/codegen/xai-grok-shell/src/session/storage/search_remote_sync.rs` |

**Explicitly unverified:**
- Completion of the pledged deletion of previously uploaded data — no independent confirmation exists.
- xAI's July 14 statement that all API-key usage respects ZDR; the developer FAQ still describes 30-day retention for standard API use, so the two statements conflict and must be reconciled before relying on either.
- The reported local config key `disable_codebase_upload = true` — described in secondary coverage; I could not find that key in the published source, and the researcher characterized the effective control as server-side. Treat as unconfirmed until tested on a live build.
- The default value of the `[features] telemetry` switch — the sample config shows it false, but the default is not explicitly stated; check `/privacy` and the live config on any install.
- Original "local-first / nothing transmitted" marketing language — reported by secondary coverage; the current x.ai/cli page no longer carries it.
- Secondary-source discrepancies on launch dates (a May 14 SuperGrok-Heavy pre-beta; one outlet says June 4) versus the official May 25 announcement — the official date is used.
- Whether current post-remediation builds transmit anything repository-scale — nobody has published a post-fix wire test; Phase 2 exists to answer this locally.
- Whether the local codebase index ever leaves the machine outside the (default-off) remote-sync path — verify in Phase 2 egress capture.
