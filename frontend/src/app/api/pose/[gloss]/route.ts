import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

/**
 * GET /api/pose/[gloss]
 *
 * Serves binary .pose files from the bucket directory.
 * Falls back to poses-backup/ if primary not found.
 * Returns 404 if no pose file exists for the gloss.
 */

const BUCKET_DIR = path.join(process.cwd(), "..", "bucket");
const POSES_DIR = path.join(BUCKET_DIR, "poses");
const BACKUP_DIR = path.join(BUCKET_DIR, "poses-backup");

export async function GET(
  _request: NextRequest,
  { params }: { params: { gloss: string } }
) {
  const gloss = decodeURIComponent(params.gloss).toUpperCase().replace(/\s+/g, "_");

  const candidates = [
    path.join(POSES_DIR, `${gloss}.pose`),
    path.join(BACKUP_DIR, `${gloss}_2.pose`),
    path.join(BACKUP_DIR, `${gloss}_3.pose`),
  ];

  for (const filePath of candidates) {
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
