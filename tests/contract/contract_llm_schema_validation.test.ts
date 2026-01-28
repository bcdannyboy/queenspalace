import { describe, expect, it } from "vitest";
import { generateDeterministicMnemonic } from "../../src/core/mnemonic/generator";
import { DEFAULT_ENCODING_PACK } from "../../src/core/mnemonic/encodingPack";
import {
  MNEMONIC_SCHEMA_VERSION,
  validateMnemonicCardResponse,
} from "../../src/server/llm/schema";

describe("contract_llm_schema_validation", () => {
  it("maps deterministic mnemonics into the LLM schema", () => {
    const mnemonic = generateDeterministicMnemonic({
      uci: "e2e4",
      san: "e4",
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      encodingPack: DEFAULT_ENCODING_PACK,
      toneProfile: "family_friendly",
    });

    const response = {
      version: MNEMONIC_SCHEMA_VERSION,
      cards: [
        {
          title: mnemonic.title,
          imageDescription: mnemonic.imageDescription,
          story: mnemonic.story,
          anchors: mnemonic.anchors,
          toneProfile: mnemonic.toneProfile,
          strengthTags: mnemonic.strengthTags,
        },
      ],
    };

    const result = validateMnemonicCardResponse(response);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
