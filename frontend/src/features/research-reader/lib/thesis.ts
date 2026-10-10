import { readFileSync } from "node:fs";
import path from "node:path";
import meta from "../content/thesis.meta.json";

export type ThesisHeading = { id: string; text: string; level: number };

export type Thesis = {
  html: string;
  headings: ThesisHeading[];
  abstract: string;
  words: number;
  minutes: number;
};

export const THESIS_PDF = "/research/DuoSign_Thesis_2026.pdf";

/**
 * The thesis body is generated once by `scripts/thesis-to-html.py` and checked in.
 * It is read at build time (the /research route is static).
 */
export function getThesis(): Thesis {
  const file = path.join(process.cwd(), "src/features/research-reader/content/thesis.html");
  const html = readFileSync(file, "utf8").replace(/^<!--[\s\S]*?-->\s*/, "");
  return {
    html,
    headings: meta.headings as ThesisHeading[],
    abstract: meta.abstract,
    words: meta.words,
    minutes: meta.minutes,
  };
}
