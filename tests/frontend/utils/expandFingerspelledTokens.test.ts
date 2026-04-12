import { act, renderHook, waitFor } from "@testing-library/react";

import { useTranslate } from "@/features/translate-text/model/useTranslate";
import { translateFast } from "@/shared/api/glossApi";

jest.mock("@/shared/api/glossApi", () => ({
  translateFast: jest.fn(),
  translateStream: jest.fn(),
}));

const mockedTranslateFast = jest.mocked(translateFast);

describe("expandFingerspelledTokens via useTranslate", () => {
  beforeEach(() => {
    mockedTranslateFast.mockReset();
  });

  it.each([
    [["N-A-N-A"], ["N", "A", "N", "A"]],
    [["IX-1"], ["I"]],
    [["IX-3+"], ["THEY"]],
    [["HELLO", "N-A-N-A"], ["HELLO", "N", "A", "N", "A"]],
    [[], []],
    [["H-E-L-L-O", "IX-2", "GOOD"], ["H", "E", "L", "L", "O", "YOU", "GOOD"]],
  ])("expands %j into %j", async (tokens, expectedText) => {
    mockedTranslateFast.mockResolvedValue({
      input_text: "test",
      gloss: tokens.join(" "),
      gloss_internal: tokens.join(" "),
      tokens,
      method: "rule_based",
      confidence: 1,
    });

    const { result } = renderHook(() => useTranslate());

    await act(async () => {
      await result.current.translate("Rule-based only", "test");
    });

    await waitFor(() => {
      expect(result.current.glossTokens.map((token) => token.text)).toEqual(expectedText);
    });
  });
});
