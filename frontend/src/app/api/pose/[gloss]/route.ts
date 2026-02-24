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
const POSES_DIR = path.join(BUCKET_DIR, "best");
const BACKUP_DIR = path.join(BUCKET_DIR, "poses-backup");

export async function GET(
  _request: NextRequest,
  { params }: { params: { gloss: string } }
) {
  const gloss = decodeURIComponent(params.gloss).toUpperCase().replace(/\s+/g, "_");

  // Try primary poses directory first
  const primaryPath = path.join(POSES_DIR, `${gloss}.pose`);
  if (existsSync(primaryPath)) {
    const data = await readFile(primaryPath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=86400, immutable",
        "Content-Disposition": `inline; filename="${gloss}.pose"`,
      },
    });
  }

  // Try backup directory (first backup)
  const backupPath = path.join(BACKUP_DIR, `${gloss}_2.pose`);
  if (existsSync(backupPath)) {
    const data = await readFile(backupPath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  }

  return NextResponse.json(
    { error: `No pose file found for gloss: ${gloss}` },
    { status: 404 }
  );
}
