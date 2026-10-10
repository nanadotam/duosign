"use client";

// "56% in" pill with a progress bar, pinned to the bottom of the viewport while
// reading. Measures progress through the article element, not the whole page.

import { useEffect, useState } from "react";

export default function ReadingProgress({ target = ".rs-read-target", minutes }: { target?: string; minutes?: number }) {
  const [p, setP] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = document.querySelector(target);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const total = r.height - innerHeight * 0.6;
        setP(Math.min(1, Math.max(0, (innerHeight * 0.4 - r.top) / Math.max(total, 1))));
        setInView(r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.3);
      });
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => {
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
      cancelAnimationFrame(raf);
    };
  }, [target]);

  const pct = Math.round(p * 100);
  const left = minutes ? Math.max(0, Math.ceil(minutes * (1 - p))) : null;
  return (
    <div
      className="rs-progress"
      data-done={pct >= 100}
      data-visible={inView}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <span className="rs-progress-label">{pct >= 100 ? "Finished ✓" : pct === 0 ? "Start reading" : `${pct}% in`}</span>
      <span className="rs-progress-track" aria-hidden>
        <span style={{ transform: `scaleX(${p})` }} />
      </span>
      {left != null && pct < 100 && <span className="rs-progress-left">{left} min left</span>}
    </div>
  );
}
