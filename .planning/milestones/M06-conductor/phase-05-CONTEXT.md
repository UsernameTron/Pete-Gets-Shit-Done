# CONDUCTOR — Phase 05 Context (stub)
**Status:** Not yet in PHASE_DISCUSSING. Scope of record: the gap-analysis review of 2026-07-17, which correctly found no image-generation capability anywhere in the package and specified the lane so the original vision does not quietly leave the roadmap.

## Scope carried in (eight items, verbatim intent)
1. `visual-job.v1` contract: prompt, negative prompt, source images, mask, reference images, model, workflow reference (hashed), seed, dimensions, sampler settings, outputs, cost, and the standard provenance block.
2. Local image adapter — likely behind ComfyUI's headless API (workflow-as-JSON pins the entire generation graph into provenance; benchmark alternatives at PHASE_DISCUSSING).
3. Model evaluation on the M4 Pro / 48 GB: FLUX, SDXL, Qwen Image, and efficient instruction-editing models. **The image-model landscape moves monthly — candidates are probed at PHASE_DISCUSSING, never assumed from memory**, same doctrine as the CLI probe.
4. Hosted premium fallback for jobs too slow or too weak locally. The standing operator preference for hosted image generation (GPT-4o-class, never DALL·E) is the default candidate; decided at PHASE_DISCUSSING.
5. Text-to-image, image-to-image, inpainting, reference conditioning, and character-consistency workflows (LoRA / ControlNet where the chosen stack supports them).
6. Original-image preservation: sources are never overwritten; every output carries complete generation metadata.
7. **Resource leases** — the genuinely new control-plane element: a visual job acquires a memory lease from the conductor before loading; local coding-lane jobs defer or the idle model unloads. A 48 GB machine cannot host a large diffusion model and the coding models simultaneously; the router arbitrates instead of letting them fight.
8. The same classification, cost, approval, and provenance controls CONDUCTOR already established. Image assets classify like repos — a confidential client brand asset never reaches a hosted image lane.

## Architecture (target)
```
Claude Code / CONDUCTOR
      ├── Grok local coding lane
      ├── Gemini long-context lane
      └── Visual Intelligence lane
            ├── Local image runtime (ComfyUI or benchmarked equivalent)
            │     └── FLUX / SDXL / Qwen Image (probe-selected)
            └── Hosted premium fallback (classification-gated)
```

## Entry criteria & sequencing
Phase-01 gates green (contracts, router, classification, log exist to plug into). Depends on phase-01 only — may run in parallel with 02–04 at the operator's direction, subject to the resource-lease design landing first.
