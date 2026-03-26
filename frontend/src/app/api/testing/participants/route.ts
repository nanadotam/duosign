import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { participant_code, name, participant_type, device_type, browser_ua } = body;

    if (!participant_code || !participant_type) {
      return NextResponse.json(
        { error: "participant_code and participant_type are required" },
        { status: 400 }
      );
    }

    // Create participant (name is optional for anonymity)
    const participantResult = await pool.query<{ id: string }>(
      `INSERT INTO testing_participants (participant_code, name, participant_type, device_type, browser_ua, consent_given)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id`,
      [participant_code, name ?? null, participant_type, device_type ?? null, browser_ua ?? null]
    );

    const participantId = participantResult.rows[0].id;

    // Create session
    const sessionResult = await pool.query<{ id: string }>(
      `INSERT INTO testing_sessions (participant_id)
       VALUES ($1)
       RETURNING id`,
      [participantId]
    );

    const sessionId = sessionResult.rows[0].id;

    return NextResponse.json({
      participant_id: participantId,
      session_id: sessionId,
    });
  } catch (error) {
    console.error("Testing participant registration error:", error);
    return NextResponse.json(
      { error: "Failed to register participant" },
      { status: 500 }
    );
  }
}
