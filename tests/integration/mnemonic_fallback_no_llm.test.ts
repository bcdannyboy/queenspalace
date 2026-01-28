import { describe, expect, it, vi } from "vitest";
import { handleMnemonicPayload } from "../../src/server/api/mnemonic";
import { validateMnemonicCardResponse } from "../../src/server/llm/schema";
import { generateWithModeration } from "../../src/server/llm/fallback";

describe("mnemonic_fallback_no_llm", () => {
  it("returns deterministic fallback when LLM is unavailable", async () => {
    const body = {
      trainingItemId: "item-1",
      fen: "8/8/8/8/8/8/8/8 w - - 0 1",
      uci: "e2e4",
      san: "e4",
      toneProfile: "family_friendly",
      encodingPackId: "pack-1",
    };

    const result = await handleMnemonicPayload(body);
    expect(result.status).toBe(200);
    expect(result.errorCode).toBe("LLM_UNAVAILABLE");

    const validation = validateMnemonicCardResponse(result.body);
    expect(validation.ok).toBe(true);

    const response = result.body as { cards: Array<{ anchors: unknown }> };
    expect(response.cards[0].anchors).toEqual([
      { token: "from", value: "e2" },
      { token: "to", value: "e4" },
    ]);
  });

  it("bypasses LLM calls for explicit_local_only tier", async () => {
    const generate = vi.fn(async () => ({
      version: "1.0",
      cards: [
        {
          title: "LLM",
          imageDescription: "Ignored",
          story: "Ignored",
          anchors: [{ token: "from", value: "e2" }],
          toneProfile: "family_friendly",
          strengthTags: ["clarity"],
        },
      ],
    }));

    const result = await generateWithModeration(
      {
        trainingItemId: "item-2",
        fen: "8/8/8/8/8/8/8/8 w - - 0 1",
        uci: "e2e4",
        san: "e4",
        toneProfile: "explicit_local_only",
        encodingPackId: "pack-2",
      },
      {
        generate,
        moderate: async () => ({ flagged: false, categories: [], severity: "low" }),
      },
    );

    expect(generate).not.toHaveBeenCalled();
    expect(result.errorCode).toBe("LLM_BLOCKED_TIER4");
    expect(result.moderationError).toBe("MODERATION_TIER4_BLOCK");
    expect(validateMnemonicCardResponse(result.response).ok).toBe(true);
  });
});
