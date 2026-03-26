-- DuoSign Testing Mode Schema
-- All tables prefixed testing_ to isolate research data from production

CREATE TABLE testing_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_code TEXT NOT NULL UNIQUE,       -- e.g. "DS-7F3A", shown to participant
  name            TEXT,                        -- optional, for participant convenience only
  participant_type TEXT NOT NULL CHECK (participant_type IN ('hearing', 'deaf_hoh')),
  device_type     TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
  browser_ua      TEXT,
  consent_given   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE testing_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id      UUID REFERENCES testing_participants(id) ON DELETE CASCADE,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at            TIMESTAMPTZ,
  duration_seconds    INTEGER GENERATED ALWAYS AS (
                        EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER
                      ) STORED,
  translations_count  INTEGER NOT NULL DEFAULT 0,
  tasks_acted_on      INTEGER NOT NULL DEFAULT 0,
  completed           BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE testing_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES testing_sessions(id) ON DELETE CASCADE,
  participant_id  UUID REFERENCES testing_participants(id) ON DELETE CASCADE,
  event_name      TEXT NOT NULL,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata        JSONB
);

CREATE INDEX idx_testing_events_session ON testing_events(session_id);
CREATE INDEX idx_testing_events_name ON testing_events(event_name);

CREATE TABLE testing_task_interactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES testing_sessions(id) ON DELETE CASCADE,
  participant_id  UUID REFERENCES testing_participants(id) ON DELETE CASCADE,
  task_id         TEXT NOT NULL,
  hint_shown_at   TIMESTAMPTZ NOT NULL,
  dismissed_at    TIMESTAMPTZ,
  acted_on_at     TIMESTAMPTZ,
  outcome         TEXT CHECK (outcome IN ('acted_on', 'dismissed', 'expired'))
);

CREATE TABLE testing_onboarding_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES testing_sessions(id) ON DELETE CASCADE,
  participant_id  UUID REFERENCES testing_participants(id) ON DELETE CASCADE,
  step_id         INTEGER NOT NULL,
  seen_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissed_by    TEXT CHECK (dismissed_by IN ('auto', 'user', 'skipped')),
  dismissed_at    TIMESTAMPTZ
);

CREATE TABLE testing_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES testing_sessions(id) ON DELETE CASCADE,
  participant_id  UUID REFERENCES testing_participants(id) ON DELETE CASCADE,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
  tags            TEXT[],
  comment         TEXT,
  trigger_type    TEXT CHECK (trigger_type IN ('widget', 'auto_nudge'))
);

CREATE TABLE testing_survey_responses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID REFERENCES testing_sessions(id) ON DELETE CASCADE,
  participant_id    UUID REFERENCES testing_participants(id) ON DELETE CASCADE,
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sus_01            INTEGER CHECK (sus_01 BETWEEN 1 AND 5),
  sus_02            INTEGER CHECK (sus_02 BETWEEN 1 AND 5),
  sus_03            INTEGER CHECK (sus_03 BETWEEN 1 AND 5),
  sus_04            INTEGER CHECK (sus_04 BETWEEN 1 AND 5),
  sus_05            INTEGER CHECK (sus_05 BETWEEN 1 AND 5),
  sus_06            INTEGER CHECK (sus_06 BETWEEN 1 AND 5),
  sus_07            INTEGER CHECK (sus_07 BETWEEN 1 AND 5),
  sus_08            INTEGER CHECK (sus_08 BETWEEN 1 AND 5),
  sus_09            INTEGER CHECK (sus_09 BETWEEN 1 AND 5),
  sus_10            INTEGER CHECK (sus_10 BETWEEN 1 AND 5),
  sus_score         NUMERIC(5,2),
  avatar_naturalness  INTEGER CHECK (avatar_naturalness BETWEEN 1 AND 5),
  avatar_clarity      INTEGER CHECK (avatar_clarity BETWEEN 1 AND 5),
  avatar_smoothness   INTEGER CHECK (avatar_smoothness BETWEEN 1 AND 5),
  liked_most        TEXT,
  needs_improvement TEXT,
  would_use         TEXT CHECK (would_use IN (
                      'definitely_not', 'probably_not',
                      'not_sure', 'probably_yes', 'definitely_yes'
                    ))
);
