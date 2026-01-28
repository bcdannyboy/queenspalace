# LLM API Endpoints Contract v1

This contract defines optional server endpoints for LLM-based mnemonic generation. These endpoints MUST NOT be required for core training.

---

## POST /api/mnemonic

### Purpose
Generate mnemonic cards for a given move or training item using structured output.

### Request body
```json
{
  "trainingItemId": "uuid",
  "fen": "FEN string",
  "uci": "e2e4",
  "san": "e4",
  "toneProfile": "family_friendly | absurd | cinematic | mature_nongraphic",
  "encodingPackId": "uuid",
  "userNotes": "optional string"
}
```

### Response body (success)
- MUST conform to `contracts/v1/llm.mnemonic_card.schema.json`.

### Response body (fallback)
```json
{
  "version": "1.0",
  "cards": [
    {
      "title": "Deterministic fallback",
      "imageDescription": "...",
      "story": "...",
      "anchors": [{"token": "from", "value": "e2"}],
      "toneProfile": "family_friendly",
      "strengthTags": ["clarity"]
    }
  ]
}
```

### Error semantics
- `LLM_BLOCKED_TIER4`: request rejected because explicit_local_only is active.
- `LLM_INPUT_FLAGGED`: input failed moderation.
- `LLM_OUTPUT_FLAGGED`: output failed moderation and was sanitized or replaced by fallback.
- `LLM_UNAVAILABLE`: network or provider error; deterministic fallback MUST be returned.

---

## POST /api/moderate

### Purpose
Moderate user text or generated content before or after LLM.

### Request body
```json
{ "text": "string" }
```

### Response body
```json
{
  "flagged": true,
  "categories": ["sexual", "violence"],
  "severity": "low|medium|high"
}
```

---

## Fallback behavior
- The client MUST accept deterministic fallback as a success response.
- The client MUST NOT block training if the LLM is unavailable.

