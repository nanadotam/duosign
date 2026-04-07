import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      participant_code,
      name,
      participant_type,
      device_type,
      browser_ua,
      browser_name,
      os_name,
      screen_resolution,
      language,
    } = body;

    if (!participant_code || !participant_type) {
      return NextResponse.json(
        { error: "participant_code and participant_type are required" },
        { status: 400 }
      );
    }

    // Vercel sets these geo headers automatically on every request — no API key needed.
    const headers = request.headers as Headers;
    const country_code = headers.get("x-vercel-ip-country") ?? null;
    const city = headers.get("x-vercel-ip-city") ?? null;

    // Create participant (name is optional for anonymity)
    const participantResult = await pool.query<{ id: string }>(
      `INSERT INTO testing_participants
         (participant_code, name, participant_type, device_type, browser_ua,
          browser_name, os_name, screen_resolution, language, country_code, city, consent_given)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
       RETURNING id`,
      [
        participant_code,
        name ?? null,
        participant_type,
        device_type ?? null,
        browser_ua ?? null,
        browser_name ?? null,
        os_name ?? null,
        screen_resolution ?? null,
        language ?? null,
        country_code,
        city,
      ]
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
