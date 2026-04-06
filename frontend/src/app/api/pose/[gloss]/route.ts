import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path, { resolve, sep } from "path";

/**
 * GET /api/pose/[gloss]
 *
 * Serves binary .pose files from the bucket directory.
 * Priority: poses_v3 (contour-only, 60% smaller) → poses → poses-backup
 * Returns 404 if no pose file exists for the gloss.
 */

const BUCKET_DIR  = path.join(process.cwd(), "..", "bucket");
const POSES_V3    = path.join(BUCKET_DIR, "poses_v3");
const POSES_DIR   = path.join(BUCKET_DIR, "poses");
const BACKUP_DIR  = path.join(BUCKET_DIR, "poses-backup");

function isWithinBucket(filePath: string, bucketDir: string): boolean {
  const resolved = resolve(filePath);
  const base = resolve(bucketDir) + sep;
  return resolved.startsWith(base);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { gloss: string } }
) {
  const decoded = decodeURIComponent(params.gloss);

  // Reject any gloss containing path-traversal sequences
  if (/[/\\]|\.\./.test(decoded)) {
    return NextResponse.json({ error: "Invalid gloss" }, { status: 400 });
  }

  const gloss = decoded.toUpperCase().replace(/\s+/g, "_");

  const candidates = [
    path.join(POSES_V3,   `${gloss}.pose`),      // contour-only, 60% smaller
    path.join(POSES_DIR,  `${gloss}.pose`),       // original full mesh fallback
    path.join(BACKUP_DIR, `${gloss}_2.pose`),
    path.join(BACKUP_DIR, `${gloss}_3.pose`),
  ];

  for (const filePath of candidates) {
    if (!isWithinBucket(filePath, BUCKET_DIR)) {
      return NextResponse.json({ error: "Invalid gloss" }, { status: 400 });
    }
    if (existsSync(filePath)) {
      const data = await readFile(filePath);
      return new NextResponse(data, {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
          "Cache-Control": "public, max-age=86400, immutable",
          "Content-Disposition": `inline; filename="${gloss}.pose"`,
        },
      });
    }
  }

  return NextResponse.json(
    { error: `No pose file found for gloss: ${gloss}` },
    { status: 404 }
  );
}
