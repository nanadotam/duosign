"use client";

import { useEffect, useRef, useState } from "react";

export type TocHeading = { id: string; text: string; level: number };

/** Sticky "On this page" rail with active-section highlighting. */
export default function ThesisToc({ headings }: { headings: TocHeading[] }) {
  const [active, setActive] = useState<string | undefined>(headings[0]?.id);
  const listRef = useRef<HTMLDivElement>(null);

  // Active section = the last heading that has scrolled past the top band.
  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const line = innerHeight * 0.3;
        let current = els[0].id;
        for (const el of els) {
          if (el.getBoundingClientRect().top <= line) current = el.id;
          else break;
        }
        setActive(current);
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
  }, [headings]);

  // Keep the active entry visible inside the scroll box.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !active) return;
    const a = list.querySelector<HTMLAnchorElement>(`a[href="#${CSS.escape(active)}"]`);
    if (!a) return;
    const top = a.offsetTop - list.offsetTop;
    if (top < list.scrollTop + 20 || top > list.scrollTop + list.clientHeight - 60) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      list.scrollTo({ top: top - list.clientHeight / 3, behavior: reduce ? "auto" : "smooth" });
    }
  }, [active]);

  if (!headings.length) return <aside className="rs-toc" />;
  return (
    <aside className="rs-toc" aria-label="On this page">
      <p className="rs-caps">
        On this page<span className="rs-toc-count">{headings.length}</span>
      </p>
      <nav className="rs-toc-list" ref={listRef}>
        {headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            data-level={h.level}
            data-active={active === h.id}
            aria-current={active === h.id ? "location" : undefined}
          >
            {h.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}
