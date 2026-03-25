import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, participant_id, rating, tags, comment, trigger_type } = body;

    if (!session_id || !participant_id) {
      return NextResponse.json({ error: "session_id and participant_id required" }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO testing_feedback (session_id, participant_id, rating, tags, comment, trigger_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [session_id, participant_id, rating ?? null, tags ?? null, comment ?? null, trigger_type ?? "widget"]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Testing feedback insert error:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
