import type { Metadata } from "next";
import { ArrowDown, DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import SiteNav from "@/widgets/site-nav/SiteNav";
import { ThesisReader } from "@/features/research-reader";
import { getThesis, THESIS_PDF } from "@/features/research-reader/lib/thesis";
import Reception from "./Reception";
import "./research.css";

const TITLE = "DuoSign: A Gloss-Based Approach to Automated ASL Generation";
const DESCRIPTION =
  "Nana Kwaku Amoako's applied project (B.Sc. Computer Science, Ashesi University, 2026): a browser-based pipeline that turns English into ASL using gloss translation, motion from real signing videos and a 3D signer. Read the full thesis online or download the PDF.";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Research: the DuoSign thesis",
  description: DESCRIPTION,
  alternates: { canonical: "/research" },
  openGraph: {
    type: "article",
    url: "/research",
    title: TITLE,
    description: DESCRIPTION,
    authors: ["Nana Kwaku Amoako"],
    images: [{ url: "/og-image.png", width: 1024, height: 1024, alt: "DuoSign" }],
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION, images: ["/og-image.png"] },
};

// Every figure below was checked against the submitted thesis text.
const STATS = [
  { value: "2,000", label: "ASL signs", note: "from 11,980 WLASL videos (WLASL-2000)" },
  { value: "~370 ms", label: "to first sign, cached", note: "~1.2 s on a cold start" },
  { value: "73.5", label: "SUS score: “good”", note: "from 5 completed pilot questionnaires" },
  { value: "AA", label: "WCAG 2.1", note: "Lighthouse accessibility score 100/100" },
];

export default function ResearchPage() {
  const thesis = getThesis();

  const head = (
    <header className="rs-head">
      <p className="rs-caps">The thesis</p>
      <h2 id="thesis-title">{TITLE}</h2>
      <p className="rs-sub">Nana Kwaku Amoako · Supervised by Kwabena Bamfo</p>
      <p className="rs-caps rs-date">
        May 2026 · Applied project · {thesis.minutes} min read
      </p>
      <hr className="rs-rule" />
      <p className="rs-abstract">
        <b>Abstract.</b> {thesis.abstract}
      </p>
    </header>
  );

  return (
    <main className="rs">
      <SiteNav />
      {/* Computer Modern for the "LaTeX" typeface option */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/aaaakshat/cm-web-fonts@latest/fonts.css" />

      <section className="rs-hero" aria-labelledby="research-title">
        <div className="rs-wrap">
          <p className="rs-eyebrow">Research</p>
          <h1 id="research-title">{TITLE}</h1>
          <p className="rs-lede">Applied Project, B.Sc. Computer Science, Ashesi University · May 2026</p>
          <dl className="rs-byline">
            <div>
              <dt>Author</dt>
              <dd>Nana Kwaku Amoako</dd>
            </div>
            <div>
              <dt>Supervisor</dt>
              <dd>Kwabena Bamfo</dd>
            </div>
          </dl>
          <div className="rs-actions">
            <a href="#thesis" className="rs-btn">
              Read the thesis <ArrowDown size={16} weight="bold" aria-hidden />
            </a>
            <a href={THESIS_PDF} download className="rs-btn rs-btn-ghost">
              <DownloadSimple size={16} weight="bold" aria-hidden /> Download PDF
            </a>
          </div>

          <h2 className="rs-sr">At a glance</h2>
          <ul className="rs-stats" aria-label="At a glance">
            {STATS.map((s) => (
              <li key={s.label}>
                <span className="rs-stat-value">{s.value}</span>
                <span className="rs-stat-label">{s.label}</span>
                <span className="rs-stat-note">{s.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Reception />

      <section id="thesis" className="rs-reader" aria-label="Thesis">
        <div className="rs-wrap rs-wrap-wide">
          <ThesisReader head={head} headings={thesis.headings} pdf={THESIS_PDF} title={TITLE} minutes={thesis.minutes}>
            <div dangerouslySetInnerHTML={{ __html: thesis.html }} />
          </ThesisReader>
        </div>
      </section>
    </main>
  );
}
