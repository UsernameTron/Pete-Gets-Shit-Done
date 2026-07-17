# CONDUCTOR — Phase 05 (stub)
# Visual Intelligence Lane

**GSD lifecycle state:** stub — flesh out at PHASE_DISCUSSING. Premature detail rots; model choices especially.

## What you're building
A third delegate lane for image generation and editing behind the existing contract/routing/provenance spine: a `visual-job.v1` contract; a local adapter over a headless image runtime with the generation graph hashed into provenance; an M4 Pro benchmark selecting the local model set; a classification-gated hosted fallback; and conductor-level resource leases so image and coding models never contend for the same 48 GB unannounced.

## Gates (summary)
Contract round-trip with a generated image whose provenance replays to a comparable output (seed + workflow hash + model hash); source-image immutability demonstrated; confidential-classed asset provably unable to route hosted; a resource-lease contention test where a visual job and a coding delegation arbitrate cleanly; per-job cost logged.

## Rollback
Remove the visual adapter skill and lane config; ComfyUI (or equivalent) uninstalls independently; contracts and router unaffected.
