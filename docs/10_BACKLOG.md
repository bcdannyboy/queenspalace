# Backlog

Format: `ID | Priority | Phase | Requirements | Title | Description | Acceptance`

---

- BL-001 | P0 | Phase 00 | REQ-LIC-001, REQ-LIC-002 | Licensing policy contract | Create licensing policy and checklist in contracts. | Policy file exists and is referenced in CI.
- BL-002 | P0 | Phase 00 | REQ-FUNC-001 | No-auth app entry point | Ensure app starts without login. | App loads training entry without auth.
- BL-003 | P0 | Phase 01 | REQ-FUNC-013 | Chess rules wrapper | Implement chess.js wrapper for legality, SAN, UCI, FEN. | Unit tests for legality pass.
- BL-004 | P0 | Phase 01 | REQ-FUNC-004 | fenKey canonicalization | Implement fenKey derivation and tests. | fenKey ignores move counters; tests pass.
- BL-005 | P0 | Phase 02 | REQ-FUNC-003, REQ-FUNC-004 | PGN parser and DAG builder | Parse PGN and build transposition-aware DAG. | import_to_training_items test passes.
- BL-006 | P0 | Phase 02 | REQ-FUNC-005 | Route generation | Generate stable routes from DAG. | Route steps stable across imports.
- BL-007 | P0 | Phase 03 | REQ-FUNC-008, REQ-FUNC-009 | SM-2 scheduler | Implement SM-2 with learning steps and caps. | srs_queue_under_cap test passes.
- BL-008 | P0 | Phase 04 | REQ-FUNC-010, REQ-FUNC-011 | Palace + deterministic mnemonics | Implement palace CRUD and deterministic generator. | mnemonic_fallback_no_llm test passes.
- BL-009 | P0 | Phase 05 | REQ-FUNC-014, REQ-FUNC-015 | Level system and review session UX | Implement level map and 5-minute session. | E2E onboarding and daily session pass.
- BL-009A | P0 | Phase 05 | REQ-FUNC-021 | Graduation test flow | Implement Level 8 graduation test with 7-day retention check. | Graduation test criteria are enforced and logged.
- BL-010 | P0 | Phase 06 | REQ-FUNC-012, REQ-SAFE-003 | LLM optional endpoints + moderation | Implement LLM routes with schema validation and fallback. | contract_llm_schema_validation test passes.
- BL-011 | P1 | Phase 03 | REQ-FUNC-016 | Transposition drills | Add transposition injection prompts in queue. | Items show alternate routes for same fenKey.
- BL-012 | P1 | Phase 04 | REQ-FUNC-017 | Plan/chunk items | Add plan prompts for tabiya anchors. | Plan items are schedulable in SRS.
- BL-013 | P1 | Phase 05 | REQ-NF-003 | Accessibility pass | Keyboard and SR-friendly move feedback. | Accessibility test checklist complete.
- BL-014 | P1 | Phase 07 | REQ-FUNC-019 | Optional analytics | Add opt-in analytics events and endpoint. | Analytics opt-out preserves full functionality.
- BL-015 | P1 | Phase 02 | REQ-NF-001 | PGN import performance | Add worker-based parsing path. | Parsing meets performance budgets.
- BL-016 | P1 | Phase 00 | REQ-FUNC-018 | Export/import backup | Define backup format and contract. | Export/import restores data without loss.
- BL-019 | P0 | Phase 05 | REQ-NF-006 | Local setup script | Add `scripts/dev-setup.sh` that installs deps and starts the app at `http://localhost:3000`. | End-to-end training flow works after running the script.
- BL-017 | P2 | Phase 06 | REQ-SAFE-002 | Image generation | Optional image generation with moderation. | Only available for Tier 0-3 and fully moderated.
- BL-018 | P2 | Phase 05 | REQ-FUNC-020 | Post-game deviation loop | Import PGN and detect first deviation. | Deviation shown with add-branch option.
