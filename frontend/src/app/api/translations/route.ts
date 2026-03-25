import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getRequestSession } from "@/lib/server-session";
import {
  mapHistoryTypeToStoredType,
  toHistoryEntry,
  type HistoryEntryType,
} from "@/shared/lib/history";

interface CreateTranslationBody {
  text?: unknown;
  glossTokens?: unknown;
  type?: unknown;
}

export async function GET(request: Request) {
  const session = await getRequestSession(request);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query(
    `
      SELECT id, input_text, input_type, gloss_tokens, exported, created_at
      FROM translations
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 100
    `,
    [userId]
  );

  return NextResponse.json(result.rows.map(toHistoryEntry));
}

export async function POST(request: Request) {
  const session = await getRequestSession(request);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CreateTranslationBody;
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const glossTokens = Array.isArray(body.glossTokens)
    ? body.glossTokens.filter((token): token is string => typeof token === "string" && token.trim().length > 0)
    : [];
  const type = body.type === "voiced" || body.type === "typed"
    ? (body.type as HistoryEntryType)
    : "typed";

  if (!text || glossTokens.length === 0) {
    return NextResponse.json(
      { message: "Text and gloss tokens are required." },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `
      INSERT INTO translations (user_id, input_text, input_type, gloss_tokens)
      VALUES ($1, $2, $3, $4::jsonb)
      RETURNING id, input_text, input_type, gloss_tokens, exported, created_at
    `,
    [userId, text, mapHistoryTypeToStoredType(type), JSON.stringify(glossTokens)]
  );

  return NextResponse.json(toHistoryEntry(result.rows[0]), { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getRequestSession(request);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await pool.query(`DELETE FROM translations WHERE user_id = $1`, [userId]);
  return NextResponse.json({ ok: true });
}
