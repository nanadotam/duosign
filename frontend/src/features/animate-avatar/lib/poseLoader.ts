import type { ParsedPoseData } from "./poseReader";
import { readPoseBuffer } from "./poseReader";

const poseCache = new Map<string, Promise<ParsedPoseData | null>>();

function normalizeGloss(gloss: string): string {
  return gloss.trim().replace(/\s+/g, "_").toUpperCase();
}

export function clearPoseCache(): void {
  poseCache.clear();
}

export async function loadPoseData(gloss: string): Promise<ParsedPoseData | null> {
  const normalizedGloss = normalizeGloss(gloss);
  const cached = poseCache.get(normalizedGloss);
  if (cached) return cached;

  const request = (async () => {
    const url = `/api/pose/${encodeURIComponent(normalizedGloss)}`;
    console.log("[PoseLoader] Fetching pose", { gloss, normalizedGloss, url });

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      console.error("[PoseLoader] Pose request failed", {
        gloss: normalizedGloss,
        reason: "network",
        error,
      });
      return null;
    }

    if (!response.ok) {
      const reason = response.status === 404 ? "missing" : "http-error";
      console.warn("[PoseLoader] Pose unavailable", {
        gloss: normalizedGloss,
        status: response.status,
        reason,
      });
      return null;
    }

    const buffer = await response.arrayBuffer();
    console.log("[PoseLoader] Pose bytes", {
      gloss: normalizedGloss,
      byteLength: buffer.byteLength,
    });

    if (buffer.byteLength === 0) {
      console.error("[PoseLoader] Pose unreadable", {
        gloss: normalizedGloss,
        reason: "empty-buffer",
      });
      return null;
    }

    try {
      return await readPoseBuffer(buffer, normalizedGloss);
    } catch (error) {
      console.error("[PoseLoader] Pose corrupt", {
        gloss: normalizedGloss,
        reason: "parse-failed",
        error,
      });
      return null;
    }
  })();

  poseCache.set(normalizedGloss, request);
  return request;
}
