# Moderation Contract v1

This contract defines content tiering and moderation behavior for LLM and user-provided text.

---

## Tone tiers
- Tier 0: family_friendly
- Tier 1: absurd
- Tier 2: cinematic
- Tier 3: mature_nongraphic
- Tier 4: explicit_local_only (LLM disabled)

## Tier rules
- Tier 0-3: LLM allowed with pre/post moderation.
- Tier 4: LLM MUST be disabled; content stored locally only; no upload or sharing.

## Pre-moderation
- Input: user notes, custom text, and requested tone.
- Action: call moderation; if flagged, apply fallback ladder.

## Post-moderation
- Input: LLM output.
- Action: call moderation; if flagged, apply fallback ladder.

## Fallback ladder (must be applied in order)
1. Sanitize and regenerate (remove disallowed elements but preserve anchors).
2. Downgrade tone (e.g., cinematic -> family_friendly) and regenerate.
3. Deterministic template (always safe, local-only).

## Error semantics
- `MODERATION_FLAGGED_INPUT`
- `MODERATION_FLAGGED_OUTPUT`
- `MODERATION_TIER4_BLOCK`

## Logging requirements
- Log moderation decision with category and severity.
- Logs MUST NOT include PII.

