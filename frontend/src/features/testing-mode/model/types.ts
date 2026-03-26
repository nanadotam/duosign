export interface TestingSession {
  sessionId: string;
  participantId: string;
  participantCode: string;
  participantType: "hearing" | "deaf_hoh";
  startedAt: string;
  translationsCount: number;
  tasksActedOn: number;
  onboardingStep: number; // 0 = not started, 1-7 = current step, 8 = complete
  dismissedTasks: string[];
  feedbackNudgeSent: boolean;
  surveyPrompted: boolean;
  surveyCompleted: boolean;
}

export type TestingEventName =
  | "translation_requested"
  | "translation_completed"
  | "translation_error"
  | "voice_input_started"
  | "voice_input_completed"
  | "voice_input_error"
  | "avatar_playback_started"
  | "avatar_playback_completed"
  | "settings_opened"
  | "settings_worldview_toggled"
  | "settings_skeleton_toggled"
  | "settings_closed"
  | "task_hint_shown"
  | "task_hint_dismissed"
  | "task_hint_acted_on"
  | "onboarding_step_seen"
  | "onboarding_step_dismissed"
  | "feedback_widget_opened"
  | "feedback_submitted"
  | "sus_survey_opened"
  | "sus_survey_submitted"
  | "session_abandoned";

export interface TestingEvent {
  event_name: TestingEventName;
  metadata?: Record<string, unknown>;
}

export interface TaskDefinition {
  id: string;
  prompt: string;
  targetFeature: string;
  triggerCondition: (ctx: TaskTriggerContext) => boolean;
}

export interface TaskTriggerContext {
  translationsCount: number;
  sessionDurationMinutes: number;
  completedTaskIds: string[];
  shownTaskIds: string[];
  voiceInputUsed: boolean;
}
