import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getRequestSession } from "@/lib/server-session";
import { toHistoryEntry } from "@/shared/lib/history";

interface UpdateTranslationBody {
  exported?: unknown;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getRequestSession(request);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as UpdateTranslationBody;
  if (typeof body.exported !== "boolean") {
    return NextResponse.json(
      { message: "Only the exported flag can be updated." },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `
      UPDATE translations
      SET exported = $3
      WHERE id = $1 AND user_id = $2
      RETURNING id, input_text, input_type, gloss_tokens, exported, created_at
    `,
    [params.id, userId, body.exported]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ message: "Translation not found." }, { status: 404 });
  }

  return NextResponse.json(toHistoryEntry(result.rows[0]));
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getRequestSession(request);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await pool.query(
    `DELETE FROM translations WHERE id = $1 AND user_id = $2`,
    [params.id, userId]
  );

  return NextResponse.json({ ok: true });
}
