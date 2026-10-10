"use client";

// Native thesis body (PDF → HTML) in Computer Modern or sans, with a tab to the
// original PDF, a sticky "On this page" contents rail and a reading-progress pill.
// The article HTML is rendered on the server and passed in as children.

import { useEffect, useState, type ReactNode } from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import ThesisToc, { type TocHeading } from "./ThesisToc";
import ReadingProgress from "./ReadingProgress";

type View = "read" | "pdf";
type Face = "latex" | "sans";
const FONT_KEY = "duosign-reader-font";

type Props = {
  head: ReactNode;
  headings: TocHeading[];
  pdf: string;
  title: string;
  minutes: number;
  children: ReactNode;
};

export default function ThesisReader({ head, headings, pdf, title, minutes, children }: Props) {
  const [view, setView] = useState<View>("read");
  const [font, setFont] = useState<Face>("latex");

  useEffect(() => {
    const saved = localStorage.getItem(FONT_KEY);
    if (saved === "latex" || saved === "sans") setFont(saved);
  }, []);

  const pickFont = (f: Face) => {
    setFont(f);
    try {
      localStorage.setItem(FONT_KEY, f);
    } catch {
      /* private mode */
    }
  };

  return (
    <div className="rs-article" data-view={view}>
      <article className="rs-read-target" aria-labelledby="thesis-title">
        {head}

        <div className="rs-reader-bar">
          <div className="rs-seg" role="group" aria-label="View">
            <button type="button" aria-pressed={view === "read"} onClick={() => setView("read")}>
              Read here
            </button>
            <button type="button" aria-pressed={view === "pdf"} onClick={() => setView("pdf")}>
              Original PDF
            </button>
          </div>
          {view === "read" && (
            <div className="rs-seg" role="group" aria-label="Typeface">
              <button type="button" aria-pressed={font === "latex"} onClick={() => pickFont("latex")} className="rs-seg-cm">
                LaTeX
              </button>
              <button type="button" aria-pressed={font === "sans"} onClick={() => pickFont("sans")}>
                Sans
              </button>
            </div>
          )}
          <a href={pdf} download className="rs-btn rs-btn-ghost rs-bar-dl">
            <DownloadSimple size={16} weight="bold" aria-hidden />
            Download PDF
          </a>
        </div>

        {headings.length > 0 && view === "read" && (
          <details className="rs-toc-mobile">
            <summary>Contents</summary>
            <nav aria-label="Thesis contents">
              {headings.map((h) => (
                <a key={h.id} href={`#${h.id}`} data-level={h.level}>
                  {h.text}
                </a>
              ))}
            </nav>
          </details>
        )}

        <div className="rs-latex" data-font={font} hidden={view !== "read"}>
          {children}
        </div>

        {view === "pdf" && (
          <div className="rs-pdf">
            <iframe src={`${pdf}#view=FitH&toolbar=1`} title={`${title} (original PDF)`} />
            <p className="rs-pdf-fallback">
              PDF not showing? <a href={pdf} target="_blank" rel="noopener">Open it in a new tab</a>.
            </p>
          </div>
        )}

        <div className="rs-after">
          <a href={pdf} download className="rs-btn">
            <DownloadSimple size={16} weight="bold" aria-hidden />
            Download PDF
          </a>
          <a href="#thesis" className="rs-btn rs-btn-ghost">Back to top</a>
        </div>
      </article>

      {view === "read" ? <ThesisToc headings={headings} /> : <aside className="rs-toc" aria-hidden />}
      {view === "read" && <ReadingProgress minutes={minutes} />}
    </div>
  );
}
