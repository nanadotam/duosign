export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const MAX_INPUT_LENGTH = 500;

export const GUEST_TRANSLATION_LIMIT = 10;

export const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2] as const;
export const SPEED_LABELS: Record<number, string> = {
  0.5: "0.5×",
  1: "1×",
  1.5: "1.5×",
  2: "2×",
};

export const DEMO_GLOSSES = [
  "YESTERDAY", "STORE", "I", "GO", "HELP",
  "NEED", "NOW", "PLEASE", "THANK", "YOU",
];

/** Simple gloss lookup matching the HTML prototype */
export const GLOSS_MAP: Record<string, string | null> = {
  hello: "HELLO", hi: "HI", how: "HOW", you: "YOU", are: null,
  good: "GOOD", morning: "MORNING", my: "MY", name: "NAME", is: null,
  what: "WHAT", thank: "THANK", thanks: "THANK", please: "PLEASE",
  yes: "YES", no: "NO", sorry: "SORRY", help: "HELP", i: "ME",
  love: "LOVE", sign: "SIGN", language: "LANGUAGE", nice: "NICE",
  meet: "MEET", understand: "UNDERSTAND", again: "AGAIN", today: "TODAY",
  want: "WANT", need: "NEED", time: "TIME", know: "KNOW",
  yesterday: "YESTERDAY", store: "STORE", go: "GO", now: "NOW",
};

export const STOP_WORDS = new Set([
  "a", "an", "the", "of", "in", "to", "for",
  "with", "on", "at", "by", "it", "this", "that",
]);
