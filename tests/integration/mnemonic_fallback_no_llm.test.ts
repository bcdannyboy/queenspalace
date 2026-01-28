import { describe, expect, it } from "vitest";
import {
  buildDeterministicMnemonicCard,
  isMnemonicLocalOnly,
} from "../../src/core/mnemonic/cards";
import { DEFAULT_ENCODING_PACK } from "../../src/core/mnemonic/encodingPack";

describe("mnemonic_fallback_no_llm", () => {
  it("produces deterministic mnemonic cards without LLM", () => {
    const baseInput = {
      trainingItemId: "item_1",
      palaceId: "palace_1",
      locusId: "locus_1",
      uci: "g1f3",
      san: "Nf3",
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      encodingPack: DEFAULT_ENCODING_PACK,
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as const;

    const first = buildDeterministicMnemonicCard(baseInput);
    const second = buildDeterministicMnemonicCard(baseInput);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.value).toEqual(second.value);
      expect(first.value.userEdits).toBe(false);
      expect(first.value.anchors).toEqual(
        expect.arrayContaining([
          { token: "from", value: "g1" },
          { token: "to", value: "f3" },
          { token: "piece", value: "N" },
        ]),
      );
    }
  });

  it("marks Tier 4 requests as local-only", () => {
    const result = buildDeterministicMnemonicCard({
      trainingItemId: "item_2",
      palaceId: "palace_1",
      locusId: "locus_2",
      uci: "e2e4",
      san: "e4",
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      encodingPack: DEFAULT_ENCODING_PACK,
      toneProfile: "explicit_local_only",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.toneProfile).toBe("explicit_local_only");
      expect(isMnemonicLocalOnly(result.value)).toBe(true);
    }
  });
});
