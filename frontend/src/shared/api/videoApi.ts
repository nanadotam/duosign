/**
 * Video API — fetch sign language videos from the backend
 * ========================================================
 * Fetches .mp4 videos for individual glosses from the backend API.
 * Supports blob URL caching and prefetching for smooth sequence playback.
 */

const VIDEO_API_BASE = "/api/video";

/** In-memory blob URL cache — avoids re-fetching the same video */
const blobCache = new Map<string, string>();

/** Set of glosses currently being prefetched */
const prefetchingSet = new Set<string>();

/**
 * Fetch the video URL for a gloss. Returns from cache if available,
 * otherwise fetches from backend and creates a blob URL.
 */
export async function fetchVideoBlobUrl(gloss: string): Promise<string> {
  const cached = blobCache.get(gloss);
  if (cached) return cached;

  const url = `${VIDEO_API_BASE}/${encodeURIComponent(gloss)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch video for ${gloss}: ${response.status}`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  blobCache.set(gloss, blobUrl);
  prefetchingSet.delete(gloss);
  return blobUrl;
}

/**
 * Fire-and-forget prefetch for future glosses in a sequence.
 * Fetches blob URLs in the background so they're ready when needed.
 */
export function prefetchVideos(glosses: string[]): void {
  for (const gloss of glosses) {
    if (blobCache.has(gloss) || prefetchingSet.has(gloss)) continue;
    prefetchingSet.add(gloss);
    fetchVideoBlobUrl(gloss).catch(() => prefetchingSet.delete(gloss));
  }
}

/**
 * Release all cached blob URLs. Call on engine/component unmount.
 */
export function releaseVideoCache(): void {
  blobCache.forEach((url) => URL.revokeObjectURL(url));
  blobCache.clear();
}
