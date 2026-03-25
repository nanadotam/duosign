import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { session_id, increment_translations, increment_tasks, end, completed } = body;

    if (!session_id) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }

    if (increment_translations) {
      await pool.query(
        `UPDATE testing_sessions SET translations_count = translations_count + 1 WHERE id = $1`,
        [session_id]
      );
    }

    if (increment_tasks) {
      await pool.query(
        `UPDATE testing_sessions SET tasks_acted_on = tasks_acted_on + 1 WHERE id = $1`,
        [session_id]
      );
    }

    if (end) {
      await pool.query(
        `UPDATE testing_sessions SET ended_at = NOW(), completed = $2 WHERE id = $1`,
        [session_id, completed ?? false]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Testing session update error:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
