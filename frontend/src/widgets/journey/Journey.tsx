"use client";

import { useEffect, useRef, useState } from "react";
import {
  Question, Database, Cube, ClipboardText, Presentation, Trophy, Handshake, EnvelopeSimple,
  FilmStrip, Buildings, RocketLaunch, GlobeHemisphereEast, type Icon,
} from "@phosphor-icons/react";
import "./journey.css";

export interface JourneyStep {
  when: string;
  title: string;
  body: string;
  icon: keyof typeof ICONS;
  tag?: string;
  next?: boolean;
}

const ICONS = {
  question: Question, database: Database, cube: Cube, clipboard: ClipboardText, presentation: Presentation,
  trophy: Trophy, handshake: Handshake, envelope: EnvelopeSimple, film: FilmStrip, buildings: Buildings,
  rocket: RocketLaunch, globe: GlobeHemisphereEast,
} satisfies Record<string, Icon>;

/**
 * Scroll-driven timeline: the spine fills as you scroll, each milestone slides in and its icon pops.
 * Respects prefers-reduced-motion (everything is shown at rest).
 */
export default function Journey({ steps }: { steps: JourneyStep[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [progress, setProgress] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(new Set());

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setProgress(1); setSeen(new Set(steps.map((_, i) => i))); return; }

    const items = Array.from(list.querySelectorAll<HTMLElement>("[data-step]"));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) setSeen((s) => new Set(s).add(Number((e.target as HTMLElement).dataset.step)));
      }),
      { threshold: 0.35, rootMargin: "0px 0px -10% 0px" }
    );
    items.forEach((el) => io.observe(el));

    const onScroll = () => {
      const r = list.getBoundingClientRect();
      const mid = window.innerHeight * 0.6;
      setProgress(Math.min(1, Math.max(0, (mid - r.top) / r.height)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [steps]);

  return (
    <ol className="jr" ref={listRef} style={{ ["--jr-progress" as string]: progress }}>
      <span className="jr-spine" aria-hidden="true"><span className="jr-fill" /></span>
      {steps.map((s, i) => {
        const Glyph = ICONS[s.icon];
        return (
          <li key={s.when + s.title} data-step={i} className={`jr-step ${seen.has(i) ? "jr-in" : ""} ${s.next ? "jr-next" : ""} ${i % 2 ? "jr-right" : "jr-left"}`}>
            <span className="jr-badge" aria-hidden="true"><Glyph size={26} weight="duotone" /></span>
            <article className="jr-card">
              <header>
                <time>{s.when}</time>
                {s.tag && <span className="jr-tag">{s.tag}</span>}
              </header>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
