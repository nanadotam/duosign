import type { TaskDefinition } from "./types";

export const TASK_DEFINITIONS: TaskDefinition[] = [
  {
    id: "T01",
    prompt: 'Try translating: "I need help, where is the bathroom?"',
    targetFeature: "text_input",
    triggerCondition: (ctx) =>
      ctx.translationsCount >= 1 && !ctx.shownTaskIds.includes("T01"),
  },
  {
    id: "T02",
    prompt: "Try a longer sentence \u2014 10 or more words",
    targetFeature: "gloss_complexity",
    triggerCondition: (ctx) =>
      (ctx.completedTaskIds.includes("T01") || ctx.sessionDurationMinutes >= 2) &&
      !ctx.shownTaskIds.includes("T02"),
  },
  {
    id: "T03",
    prompt: "Try something you think the system might struggle with",
    targetFeature: "error_discovery",
    triggerCondition: (ctx) =>
      (ctx.completedTaskIds.includes("T02") || ctx.sessionDurationMinutes >= 4) &&
      !ctx.shownTaskIds.includes("T03"),
  },
  {
    id: "T04",
    prompt: "Try using voice input instead of typing",
    targetFeature: "microphone",
    triggerCondition: (ctx) =>
      ctx.translationsCount >= 3 &&
      !ctx.voiceInputUsed &&
      !ctx.shownTaskIds.includes("T04"),
  },
  {
    id: "T05",
    prompt: "Switch to Full World View in Settings and translate again",
    targetFeature: "avatar_viewport",
    triggerCondition: (ctx) =>
      (ctx.completedTaskIds.includes("T04") || ctx.sessionDurationMinutes >= 6) &&
      !ctx.shownTaskIds.includes("T05"),
  },
  {
    id: "T06",
    prompt: "Turn on Skeleton Viewer and watch a translation",
    targetFeature: "skeleton_debug",
    triggerCondition: (ctx) =>
      (ctx.completedTaskIds.includes("T05") || ctx.sessionDurationMinutes >= 8) &&
      !ctx.shownTaskIds.includes("T06"),
  },
  {
    id: "T07",
    prompt:
      "Try something meaningful to you \u2014 any sentence you'd actually want to sign",
    targetFeature: "freeform",
    triggerCondition: (ctx) =>
      (ctx.completedTaskIds.includes("T06") || ctx.sessionDurationMinutes >= 10) &&
      !ctx.shownTaskIds.includes("T07"),
  },
];
