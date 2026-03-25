import { NextRequest, NextResponse } from "next/server";
import { existsSync, statSync } from "fs";
import { open } from "fs/promises";
import path from "path";

/**
 * GET /api/pose-video/[gloss]
 *
 * Serves pre-rendered skeleton MP4 videos from bucket/poses_v2/.
 * Supports HTTP range requests so browsers can seek without buffering fully.
 * Falls back through poses_v2 → 404.
 *
 * ~8x smaller than raw .pose binaries (30–80 KB vs 300–600 KB).
 */

const POSES_V2_DIR = path.join(process.cwd(), "..", "bucket", "poses_v2");

export async function GET(
  request: NextRequest,
  { params }: { params: { gloss: string } }
) {
  const gloss = decodeURIComponent(params.gloss).toUpperCase().replace(/\s+/g, "_");
  const filePath = path.join(POSES_V2_DIR, `${gloss}.mp4`);

  if (!existsSync(filePath)) {
    return NextResponse.json(
      { error: `No pose video found for gloss: ${gloss}` },
      { status: 404 }
    );
  }

  const stat = statSync(filePath);
  const fileSize = stat.size;
  const rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    // Range request — browser seeking or streaming
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const fh = await open(filePath, "r");
    const buffer = Buffer.alloc(chunkSize);
    await fh.read(buffer, 0, chunkSize, start);
    await fh.close();

    return new NextResponse(buffer, {
      status: 206,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  }

  // Full file response
  const fh = await open(filePath, "r");
  const buffer = Buffer.alloc(fileSize);
  await fh.read(buffer, 0, fileSize, 0);
  await fh.close();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
      "Content-Length": String(fileSize),
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Disposition": `inline; filename="${gloss}.mp4"`,
    },
  });
}
