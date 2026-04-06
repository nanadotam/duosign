export const RESEARCH_INTRO_DISMISSED_KEY = "duosign:research_intro_dismissed";
export const TESTING_QUERY_PARAM = "testing";
export const DUOSIGN_VERSION = "v1.0.23";

type EnvMap = Partial<Record<string, string | undefined>>;

export interface ResearchVideoSource {
  type: "iframe" | "video";
  src: string;
}

function normalizeUrl(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getResearchVideoSource(env: EnvMap = process.env): ResearchVideoSource | null {
  const embedUrl = normalizeUrl(env.NEXT_PUBLIC_TRANSLATE_TEST_VIDEO_EMBED_URL);
  if (embedUrl) {
    return { type: "iframe", src: embedUrl };
  }

  const videoUrl = normalizeUrl(env.NEXT_PUBLIC_TRANSLATE_TEST_VIDEO_URL);
  if (videoUrl) {
    return { type: "video", src: videoUrl };
  }

  return null;
}

export function getResearchLinks(env: EnvMap = process.env) {
  return {
    consentUrl: normalizeUrl(env.NEXT_PUBLIC_TESTING_CONSENT_URL),
    dataUrl: normalizeUrl(env.NEXT_PUBLIC_TESTING_DATA_URL),
    feedbackFormUrl: normalizeUrl(env.NEXT_PUBLIC_TESTING_FEEDBACK_FORM_URL),
  };
}

export function getResearchVideoCaptionsUrl(env: EnvMap = process.env) {
  return normalizeUrl(env.NEXT_PUBLIC_TRANSLATE_TEST_VIDEO_CAPTIONS_URL);
}

export function buildTestingHref(
  pathname: string,
  params: URLSearchParams | string,
  testingValue = "1"
) {
  const nextParams = new URLSearchParams(
    typeof params === "string" ? params : params.toString()
  );
  nextParams.set(TESTING_QUERY_PARAM, testingValue);
  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
