"use client";

import { useScramble } from "use-scramble";

interface GlossDisplayProps {
  glossText: string;
}

/**
 * GlossDisplay — ASL gloss text with decode animation.
 *
 * Uses use-scramble to show a "matrix decode" effect when text arrives
 * or changes (e.g. rule-based → LLM quality update). The overflow
 * setting makes text morph character-by-character instead of clearing.
 */
export default function GlossDisplay({ glossText }: GlossDisplayProps) {
  const { ref } = useScramble({
    text: glossText,
    speed: 0.8,
    tick: 1,
    step: 3,
    scramble: 8,
    seed: 1,
    chance: 0.9,
    overflow: true,
    range: [65, 90],
    ignore: [" ", "+", "-"],
  });

  if (!glossText) return null;

  return (
    <div className="px-4 py-3 border-t border-border transition-colors duration-250">
      <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2 transition-colors duration-250 flex items-center gap-1.5">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
          aria-hidden
        />
        ASL Gloss
      </div>
      <p
        ref={ref}
        className="font-mono text-[18px] font-bold tracking-[0.08em] text-accent leading-relaxed select-all"
        style={{
          textShadow: "0 0 20px var(--accent-glow)",
          minHeight: "1.8em",
        }}
      />
    </div>
  );
}
