import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { events } = body;

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "events array required" }, { status: 400 });
    }

    // Batch insert using unnest for efficiency
    const sessionIds: string[] = [];
    const participantIds: string[] = [];
    const eventNames: string[] = [];
    const timestamps: string[] = [];
    const metadataArr: string[] = [];

    for (const evt of events) {
      sessionIds.push(evt.session_id);
      participantIds.push(evt.participant_id);
      eventNames.push(evt.event_name);
      timestamps.push(evt.timestamp);
      metadataArr.push(JSON.stringify(evt.metadata ?? null));
    }

    await pool.query(
      `INSERT INTO testing_events (session_id, participant_id, event_name, timestamp, metadata)
       SELECT * FROM unnest(
         $1::uuid[], $2::uuid[], $3::text[], $4::timestamptz[], $5::jsonb[]
       )`,
      [sessionIds, participantIds, eventNames, timestamps, metadataArr]
    );

    return NextResponse.json({ inserted: events.length });
  } catch (error) {
    console.error("Testing events insert error:", error);
    return NextResponse.json({ error: "Failed to insert events" }, { status: 500 });
  }
}
