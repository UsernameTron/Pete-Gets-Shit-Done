# Grok Build — Full Local Deployment Runbook
**Target:** M4 Pro (48 GB) · LM Studio backend on `localhost:1234` · permanent install
**Scope:** Source-built harness running your local models (example: Qwen3.6 27B primary — use the IDs from section 3; DeepSeek-R1 32B for reasoning). Executable top-to-bottom; hand sections 0–4 to Claude Code to run end-to-end.

---

## 0. Prerequisites (~5 min)

```bash
xcode-select --install 2>/dev/null || true                                # skip if CLT present
command -v rustup >/dev/null || curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
cargo install dotslash                                                    # required for hermetic protoc
```

## 1. Build and install

The repo pins its own Rust toolchain (`rust-toolchain.toml`); rustup fetches it on first build. First compile is a large Rust workspace — expect a long build.

```bash
mkdir -p ~/projects && cd ~/projects
git clone https://github.com/xai-org/grok-build.git && cd grok-build
cargo build -p xai-grok-pager-bin --release
mkdir -p ~/.local/bin && cp target/release/xai-grok-pager ~/.local/bin/grok
grep -q '.local/bin' ~/.zshrc || echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc && grok --version
```

## 2. Configuration — write BEFORE first launch

### `~/.grok/config.toml`

```toml
[models]
default = "qwen-local"

[model.qwen-local]
model = "REPLACE_WITH_LMSTUDIO_ID"        # section 3 gives you the exact ID
base_url = "http://localhost:1234/v1"
name = "Qwen3.6 27B (LM Studio) — example; use IDs from the curl in section 3"
api_backend = "chat_completions"
api_key = "lm-studio"                     # LM Studio ignores keys; a per-model key keeps requests off xAI auth entirely
context_window = 32768                    # match LM Studio's loaded context; omitted = 200k default, which mistimes auto-compaction
max_completion_tokens = 8192

[model.r1-local]
model = "REPLACE_WITH_LMSTUDIO_ID"
base_url = "http://localhost:1234/v1"
name = "DeepSeek-R1 32B (LM Studio)"
api_backend = "chat_completions"
api_key = "lm-studio"
context_window = 32768

[cli]
auto_update = false                       # updates are manual — section 6

[features]
telemetry = false
feedback = false
remote_fetch = false                      # the documented switch for air-gapped deployments
codebase_indexing = true                  # local code-graph index; keep

[telemetry]
mixpanel_enabled = false
trace_upload = false

[tools]
respect_gitignore = true                  # agent skips .env and friends by default

[sandbox]
profile = "workspace"                     # write-scope every session to CWD + temp; `--sandbox off` lifts it per-session

[memory]
enabled = false                           # second-brain stays the canonical cross-session memory

[compat.claude]
agents = true                             # your ~/.claude/CLAUDE.md + project CLAUDE.md load automatically —
rules = true                              #   safety rules and exclusions carry straight over
skills = true
hooks = false                             # Claude Code hooks don't fire under grok
mcps = false                              # keep the harness self-contained; flip to true when you want your MCP servers in

[compat.cursor]
agents = false
rules = false
skills = false
hooks = false
mcps = false
```

### `~/.grok/sandbox.toml` (secrets deny profile, kernel-enforced via Seatbelt)

```toml
[profiles.dev]
extends = "workspace"
deny = ["**/.env", "**/.env.*", "**/*.pem", "**/*.key", "**/id_rsa*", "**/.aws/**"]
```

Use with `grok --sandbox dev` when working in repos that hold credentials. On macOS these deny globs are enforced at runtime and cover files created mid-session. A malformed profile refuses to start rather than under-enforce.

## 3. Wire up the LM Studio models

LM Studio server running with both models available, then:

```bash
curl -s localhost:1234/v1/models | jq -r '.data[].id'
```

Paste the two IDs into the `model =` fields in `config.toml`.

## 4. First launch and verification

```bash
cd ~/projects/second-brain            # any real repo works
grok inspect                          # shows discovered config, instructions, skills, hooks, MCP — confirm CLAUDE.md files listed
grok                                  # TUI; /model switches qwen-local ↔ r1-local
```

Smoke tests:

```bash
grok -p "Summarize this repo's structure" --output-format json | head -20
lsof -i -a -p "$(pgrep -f xai-grok-pager)"     # expect loopback :1234 only
```

**One checkpoint:** the docs' auth precedence puts a per-model `api_key` above everything, so inference never needs an xAI session — but whether the TUI still shows a sign-in screen on very first launch with a local default is the one thing the docs don't state. If it does, tell me what it shows and I'll route around it; don't sign in.

## 5. Optional — air-gap the binary

Puts the harness on the same footing as your LM Studio inference: install LuLu (free, Objective-See) or use Little Snitch, add a block-all-outbound rule for `~/.local/bin/grok`. Loopback traffic to `:1234` is unaffected, so the harness runs at full function.

## 6. Updates (manual)

```bash
cd ~/projects/grok-build && git pull
cat SOURCE_REV                        # upstream monorepo commit this tree was cut from — log it
cargo build -p xai-grok-pager-bin --release
cp target/release/xai-grok-pager ~/.local/bin/grok && grok --version
```

## 7. Rollback (complete removal)

```bash
rm -rf ~/.grok ~/projects/grok-build ~/.local/bin/grok
```

## Adding cloud models later

Any OpenAI-compatible endpoint slots in with the same `[model.X]` block — including `https://api.x.ai/v1` with `env_key = "XAI_API_KEY"` if you ever want hosted Grok 4.5 in the picker. Nothing in this deployment forecloses it.

## Operating notes

- Your 27B/32B models are strong for review, Q&A, and plan-mode work; long autonomous chains are where local models drop off versus frontier — plan mode plus the workspace sandbox is the right default posture, and both are already set above.
- `/model` mid-session for Qwen ↔ R1; `--sandbox dev` for credential-bearing repos; `grok inspect` any time you want to audit exactly what a directory feeds the harness.
