/**
 * Pose API Client
 * ================
 * Fetch binary .pose files and check availability.
 */

export async function fetchPose(gloss: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(`/api/pose/${encodeURIComponent(gloss)}`);
    if (!response.ok) return null;
    return response.arrayBuffer();
  } catch {
    return null;
  }
}

export async function checkPoseExists(gloss: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/pose/${encodeURIComponent(gloss)}`, {
      method: "HEAD",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchAvailableGlosses(): Promise<string[]> {
  try {
    const response = await fetch("/api/pose/list");
    if (!response.ok) return [];
    const data = await response.json();
    return data.glosses ?? [];
  } catch {
    return [];
  }
}
