import { act, renderHook, waitFor } from "@testing-library/react";

import { useTranslate } from "@/features/translate-text/model/useTranslate";
import { translateFast, translateStream } from "@/shared/api/glossApi";

jest.mock("@/shared/api/glossApi", () => ({
  translateFast: jest.fn(),
  translateStream: jest.fn(),
}));

const mockedTranslateFast = jest.mocked(translateFast);
const mockedTranslateStream = jest.mocked(translateStream);

function streamFrom(events: Array<{ event: "rule_based" | "llm_quality" | "done"; data: any }>) {
  return (async function* () {
    for (const event of events) {
      await Promise.resolve();
      yield event;
    }
  })();
}

function blockingStream(signal?: AbortSignal, onAbort?: () => void) {
  return (async function* () {
    while (!signal?.aborted) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    onAbort?.();
  })();
}

describe("useTranslate", () => {
  beforeEach(() => {
    mockedTranslateFast.mockReset();
    mockedTranslateStream.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("starts with the expected initial state", () => {
    const { result } = renderHook(() => useTranslate());

    expect(result.current.inputText).toBe("");
    expect(result.current.glossTokens).toEqual([]);
    expect(result.current.isTranslating).toBe(false);
    expect(result.current.translationPhase).toBe("idle");
  });

  it("updates input metrics when text changes", async () => {
    const { result } = renderHook(() => useTranslate());

    await act(async () => {
      result.current.setInputText("Hello");
    });

    expect(result.current.inputText).toBe("Hello");
    expect(result.current.wordCount).toBe(1);
    expect(result.current.charCount).toBe(5);
  });

  it("does nothing when translate is called with empty input", async () => {
    const { result } = renderHook(() => useTranslate());

    await act(async () => {
      await result.current.translate();
    });

    expect(mockedTranslateFast).not.toHaveBeenCalled();
    expect(mockedTranslateStream).not.toHaveBeenCalled();
  });

  it("uses translateFast for rule-based only mode", async () => {
    mockedTranslateFast.mockResolvedValue({
      input_text: "Rule based only",
      gloss: "HELLO",
      gloss_internal: "HELLO",
      tokens: ["HELLO"],
      method: "rule_based",
      confidence: 1,
    });

    const { result } = renderHook(() => useTranslate());

    await act(async () => {
      await result.current.translate("Rule-based only", "Rule based only");
    });

    expect(mockedTranslateFast).toHaveBeenCalled();
    expect(mockedTranslateStream).not.toHaveBeenCalled();
    expect(result.current.isTranslating).toBe(false);
  });

  it("uses translateStream for hybrid mode", async () => {
    mockedTranslateStream.mockReturnValue(
      streamFrom([
        {
          event: "rule_based",
          data: {
            input_text: "hello",
            gloss: "HELLO",
            gloss_internal: "HELLO",
            tokens: ["HELLO"],
            method: "rule_based",
            confidence: 1,
          },
        },
        { event: "done", data: {} },
      ])
    );

    const { result } = renderHook(() => useTranslate());

    await act(async () => {
      await result.current.translate("Hybrid (Rule + LLM)", "hello");
    });

    expect(mockedTranslateStream).toHaveBeenCalled();
    expect(result.current.translationPhase).toBe("rule_based");
  });

  it("sets translating state while a request is in flight", async () => {
    let resolveFast: ((value: any) => void) | undefined;
    mockedTranslateFast.mockReturnValue(
      new Promise((resolve) => {
        resolveFast = resolve;
      }) as Promise<any>
    );

    const { result } = renderHook(() => useTranslate());

    let pending: Promise<void> | undefined;
    await act(async () => {
      pending = result.current.translate("Rule-based only", "Hello");
    });

    await waitFor(() => {
      expect(result.current.isTranslating).toBe(true);
      expect(result.current.translationPhase).toBe("translating");
    });

    await act(async () => {
      resolveFast?.({
        input_text: "Hello",
        gloss: "HELLO",
        gloss_internal: "HELLO",
        tokens: ["HELLO"],
        method: "rule_based",
        confidence: 1,
      });
      await pending;
    });

    expect(result.current.isTranslating).toBe(false);
  });

  it("maps IX markers to readable display text", async () => {
    mockedTranslateFast.mockResolvedValue({
      input_text: "pronouns",
      gloss: "IX-1 IX-2 IX-3 IX-1+ IX-3+",
      gloss_internal: "IX-1 IX-2 IX-3 IX-1+ IX-3+",
      tokens: ["IX-1", "IX-2", "IX-3", "IX-1+", "IX-3+"],
      method: "rule_based",
      confidence: 1,
    });

    const { result } = renderHook(() => useTranslate());

    await act(async () => {
      await result.current.translate("Rule-based only", "pronouns");
    });

    expect(result.current.glossTokens.map((token) => token.text)).toEqual([
      "I",
      "YOU",
      "HE/SHE",
      "WE",
      "THEY",
    ]);
  });

  it("expands fingerspelled tokens into individual chips", async () => {
    mockedTranslateFast.mockResolvedValue({
      input_text: "name",
      gloss: "N-A-N-A",
      gloss_internal: "N-A-N-A",
      tokens: ["N-A-N-A"],
      method: "rule_based",
      confidence: 1,
    });

    const { result } = renderHook(() => useTranslate());

    await act(async () => {
      await result.current.translate("Rule-based only", "name");
    });

    expect(result.current.glossTokens).toHaveLength(4);
    expect(result.current.glossTokens.every((token) => token.isSpelled)).toBe(true);
  });

  it("leaves regular gloss tokens as non-fingerspelled", async () => {
    mockedTranslateFast.mockResolvedValue({
      input_text: "hello",
      gloss: "HELLO",
      gloss_internal: "HELLO",
      tokens: ["HELLO"],
      method: "rule_based",
      confidence: 1,
    });

    const { result } = renderHook(() => useTranslate());

    await act(async () => {
      await result.current.translate("Rule-based only", "hello");
    });

    expect(result.current.glossTokens[0]?.isSpelled).toBe(false);
  });

  it("clearInput resets state and aborts an in-flight request", async () => {
    let aborted = false;
    mockedTranslateStream.mockImplementation((_text, signal) => blockingStream(signal, () => { aborted = true; }));

    const { result } = renderHook(() => useTranslate());

    await act(async () => {
      void result.current.translate("Hybrid (Rule + LLM)", "hello");
    });

    await act(async () => {
      result.current.clearInput();
    });

    await waitFor(() => {
      expect(aborted).toBe(true);
      expect(result.current.inputText).toBe("");
      expect(result.current.glossText).toBe("");
      expect(result.current.glossTokens).toEqual([]);
      expect(result.current.translationPhase).toBe("idle");
    });
  });

  it("aborts the first request when a second translate call starts", async () => {
    let firstAborted = false;
    mockedTranslateStream
      .mockImplementationOnce((_text, signal) => blockingStream(signal, () => { firstAborted = true; }))
      .mockReturnValueOnce(
        streamFrom([
          {
            event: "rule_based",
            data: {
              input_text: "second",
              gloss: "HELLO",
              gloss_internal: "HELLO",
              tokens: ["HELLO"],
              method: "rule_based",
              confidence: 1,
            },
          },
          { event: "done", data: {} },
        ])
      );

    const { result } = renderHook(() => useTranslate());

    await act(async () => {
      void result.current.translate("Hybrid (Rule + LLM)", "first");
    });

    await act(async () => {
      await result.current.translate("Hybrid (Rule + LLM)", "second");
    });

    await waitFor(() => {
      expect(firstAborted).toBe(true);
      expect(result.current.glossText).toBe("HELLO");
    });
  });

  it("falls back to translateFast when the stream fails", async () => {
    mockedTranslateStream.mockImplementation(() =>
      (async function* () {
        throw new Error("stream failed");
      })()
    );
    mockedTranslateFast.mockResolvedValue({
      input_text: "hello",
      gloss: "HELLO",
      gloss_internal: "HELLO",
      tokens: ["HELLO"],
      method: "rule_based",
      confidence: 1,
    });

    const { result } = renderHook(() => useTranslate());

    await act(async () => {
      await result.current.translate("Hybrid (Rule + LLM)", "hello");
    });

    expect(mockedTranslateFast).toHaveBeenCalled();
    expect(result.current.glossText).toBe("HELLO");
  });

  it("shows the unavailable message when both stream and fast fallback fail", async () => {
    mockedTranslateStream.mockImplementation(() =>
      (async function* () {
        throw new Error("stream failed");
      })()
    );
    mockedTranslateFast.mockRejectedValue(new Error("fallback failed"));

    const { result } = renderHook(() => useTranslate());

    await act(async () => {
      await result.current.translate("Hybrid (Rule + LLM)", "hello");
    });

    expect(result.current.glossText).toContain("⚠ Translation unavailable");
  });
});
