import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, participant_type, device_type, browser_ua } = body;

    if (!name || !participant_type) {
      return NextResponse.json(
        { error: "name and participant_type are required" },
        { status: 400 }
      );
    }

    // Create participant
    const participantResult = await pool.query<{ id: string }>(
      `INSERT INTO testing_participants (name, participant_type, device_type, browser_ua, consent_given)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id`,
      [name, participant_type, device_type ?? null, browser_ua ?? null]
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
