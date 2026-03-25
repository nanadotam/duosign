import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      session_id, participant_id,
      sus_01, sus_02, sus_03, sus_04, sus_05,
      sus_06, sus_07, sus_08, sus_09, sus_10,
      avatar_naturalness, avatar_clarity, avatar_smoothness,
      liked_most, needs_improvement, would_use,
    } = body;

    if (!session_id || !participant_id) {
      return NextResponse.json({ error: "session_id and participant_id required" }, { status: 400 });
    }

    // Compute SUS score: ((sum of (odd-1)) + (sum of (5-even))) * 2.5
    const odd = [sus_01, sus_03, sus_05, sus_07, sus_09].filter(Boolean);
    const even = [sus_02, sus_04, sus_06, sus_08, sus_10].filter(Boolean);
    let sus_score: number | null = null;
    if (odd.length === 5 && even.length === 5) {
      const oddSum = odd.reduce((a: number, b: number) => a + (b - 1), 0);
      const evenSum = even.reduce((a: number, b: number) => a + (5 - b), 0);
      sus_score = (oddSum + evenSum) * 2.5;
    }

    await pool.query(
      `INSERT INTO testing_survey_responses (
        session_id, participant_id,
        sus_01, sus_02, sus_03, sus_04, sus_05,
        sus_06, sus_07, sus_08, sus_09, sus_10,
        sus_score,
        avatar_naturalness, avatar_clarity, avatar_smoothness,
        liked_most, needs_improvement, would_use
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [
        session_id, participant_id,
        sus_01, sus_02, sus_03, sus_04, sus_05,
        sus_06, sus_07, sus_08, sus_09, sus_10,
        sus_score,
        avatar_naturalness, avatar_clarity, avatar_smoothness,
        liked_most ?? null, needs_improvement ?? null, would_use ?? null,
      ]
    );

    // Mark session as completed
    await pool.query(
      `UPDATE testing_sessions SET completed = TRUE WHERE id = $1`,
      [session_id]
    );

    return NextResponse.json({ ok: true, sus_score });
  } catch (error) {
    console.error("Testing survey insert error:", error);
    return NextResponse.json({ error: "Failed to submit survey" }, { status: 500 });
  }
}
