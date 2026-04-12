import {
  buildTestingHref,
  getResearchLinks,
  getResearchVideoSource,
} from "@/features/testing-mode/lib/researchConfig";

describe("researchConfig", () => {
  it("builds a testing URL while preserving existing params", () => {
    const href = buildTestingHref(
      "/translate",
      new URLSearchParams("text=hello&autoplay=true")
    );

    expect(href).toBe("/translate?text=hello&autoplay=true&testing=1");
  });

  it("prefers an iframe embed URL when both video env vars are provided", () => {
    const source = getResearchVideoSource({
      NEXT_PUBLIC_TRANSLATE_TEST_VIDEO_EMBED_URL: "https://example.com/embed/demo",
      NEXT_PUBLIC_TRANSLATE_TEST_VIDEO_URL: "https://example.com/demo.mp4",
    });

    expect(source).toEqual({
      type: "iframe",
      src: "https://example.com/embed/demo",
    });
  });

  it("returns research links only when values are present", () => {
    const links = getResearchLinks({
      NEXT_PUBLIC_TESTING_CONSENT_URL: "https://example.com/consent",
      NEXT_PUBLIC_TESTING_DATA_URL: "https://example.com/data",
    });

    expect(links).toEqual({
      consentUrl: "https://example.com/consent",
      dataUrl: "https://example.com/data",
      feedbackFormUrl: null,
    });
  });
});
