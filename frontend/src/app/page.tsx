import Link from "next/link";
import Image from "next/image";
import "./impact.css";
import { IMPACT_STATS, TIMELINE, RESEARCH_REFS } from "./impact-content";

/**
 * DuoSign Pro landing page — the story and the impact, not the tech.
 * Content (stats, timeline, references) lives in impact-content.ts so it can be updated without touching layout.
 */
export default function LandingPage() {
  return (
    <main className="ip">
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="ip-nav">
        <Link href="/" className="ip-brand" aria-label="DuoSign home">
          <Image src="/logos/DuoSign_logomark.svg" alt="" width={26} height={26} className="ip-logo" />
          <span>DuoSign</span>
          <em>Pro</em>
          <small>Beta</small>
        </Link>
        <nav aria-label="Sections">
          <a href="#why">Why</a>
          <a href="#how">How it works</a>
          <a href="#built-with">Built with</a>
          <a href="#next">What&apos;s next</a>
          <a href="#research">Research</a>
        </nav>
        <Link href="/translate" className="ip-btn ip-btn-sm">Try the beta</Link>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="ip-hero">
        <div className="ip-hero-copy">
          <p className="ip-eyebrow">Text and speech → sign language</p>
          <h1>
            The internet,<br />
            <span>in sign language.</span>
          </h1>
          <p className="ip-lede">
            For Deaf and hard-of-hearing people, most of digital life arrives as text. DuoSign turns written and
            spoken English into sign language, signed by avatars that look like the people who use them, so content
            meets people in their first language.
          </p>
          <div className="ip-cta">
            <Link href="/translate" className="ip-btn">Try DuoSign Pro (beta)</Link>
            <a href="#why" className="ip-btn ip-btn-ghost">Read the story</a>
          </div>
          <p className="ip-note">Built in Ghana at Ashesi University · reviewed by its accessibility team</p>
        </div>
        <div className="ip-hero-art" aria-hidden="true">
          <Image src="/landing/signer_kofi.webp" alt="" width={420} height={520} className="ip-signer ip-signer-l" priority />
          <Image src="/landing/signer_ama.webp" alt="" width={480} height={600} className="ip-signer ip-signer-c" priority />
          <Image src="/landing/signer_esi.webp" alt="" width={420} height={520} className="ip-signer ip-signer-r" priority />
          <div className="ip-gloss">HELLO · THANK-YOU · YOU</div>
        </div>
      </section>

      {/* ── Why ─────────────────────────────────────────── */}
      <section id="why" className="ip-section ip-why">
        <div className="ip-wrap">
          <p className="ip-eyebrow">The gap</p>
          <h2>Captions are not the same as your own language.</h2>
          <p className="ip-body">
            Sign languages are full languages with their own grammar, not English on the hands. Yet almost every tool
            built for Deaf people works in one direction: helping hearing people understand them. Interpreters appear
            on televised addresses, but rarely on the videos, webinars, forms and feeds where life now happens.
            Access to information is a right under Article 21 of the UN Convention on the Rights of Persons with
            Disabilities, and it is still one of the most persistent barriers.
          </p>
          <ul className="ip-stats">
            {IMPACT_STATS.map((s) => (
              <li key={s.value}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
                <cite>{s.source}</cite>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── How ─────────────────────────────────────────── */}
      <section id="how" className="ip-section">
        <div className="ip-wrap">
          <p className="ip-eyebrow">How it works</p>
          <h2>Type it or say it. See it signed.</h2>
          <ol className="ip-steps">
            <li><b>1</b><h3>Write or speak</h3><p>Type a sentence, paste text, or use your voice.</p></li>
            <li><b>2</b><h3>Sign grammar</h3><p>DuoSign rewrites English into sign order: time first, questions last, names fingerspelled.</p></li>
            <li><b>3</b><h3>A signer you recognise</h3><p>Ama, Kofi or Esi signs it from motion captured from real signers, with facial expression.</p></li>
          </ol>
          <figure className="ip-shot">
            <Image src="/landing/app_signing.webp" alt="DuoSign Pro: an English sentence on the left, Ama signing HELLO on the right" width={2000} height={1250} />
          </figure>
        </div>
      </section>

      {/* ── Built with ──────────────────────────────────── */}
      <section id="built-with" className="ip-section ip-dark">
        <div className="ip-wrap">
          <p className="ip-eyebrow">Nothing about us without us</p>
          <h2>Built to be led by the people it serves.</h2>
          <div className="ip-cards">
            <article><h3>Honest about where we are</h3><p>Reviewed by Ashesi University&apos;s accessibility team and piloted with early testers. The clearest feedback: the signing must get easier to read. That is what this year&apos;s work is about.</p></article>
            <article><h3>Deaf signers as owners</h3><p>The next sign languages will be recorded and evaluated with Deaf signers and Deaf associations, as paid contributors with consent and a say in how their language is used.</p></article>
            <article><h3>Not a replacement</h3><p>Interpreters are a right and a profession. DuoSign is for the web, documents and video, where there is usually no interpreter at all.</p></article>
            <article><h3>Representation</h3><p>The first avatars were stock characters. DuoSign&apos;s signers now look like the people of the continent it was built on.</p></article>
          </div>
        </div>
      </section>

      {/* ── Journey ─────────────────────────────────────── */}
      <section className="ip-section">
        <div className="ip-wrap">
          <p className="ip-eyebrow">The journey so far</p>
          <h2>From a capstone to a conversation across Africa.</h2>
          <ol className="ip-timeline">
            {TIMELINE.map((t) => (
              <li key={t.when + t.title}><time>{t.when}</time><div><h3>{t.title}</h3><p>{t.body}</p></div></li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Next ────────────────────────────────────────── */}
      <section id="next" className="ip-section ip-tint">
        <div className="ip-wrap">
          <p className="ip-eyebrow">Where it&apos;s going</p>
          <h2>Google Translate for sign language.</h2>
          <p className="ip-body">
            The goal is a sign interpreter wherever there are words and no captions: webinars, lectures, public
            service pages, short videos and social feeds, on any device.
          </p>
          <figure className="ip-shot ip-shot-flat">
            <Image src="/landing/pip_mockup.webp" alt="Concept: a DuoSign signer in a picture-in-picture window over a webinar and over a social video" width={2000} height={1125} />
            <figcaption>Concept: picture-in-picture signing over any video, webinar or feed.</figcaption>
          </figure>
          <div className="ip-roadmap">
            <article><span className="ip-pill">In progress</span><h3>African sign languages</h3><p>Starting with Ghanaian Sign Language. We are seeking to work with the Ghana National Association of the Deaf and Deaf signers to build it together.</p></article>
            <article><span className="ip-pill">Coming soon</span><h3>Chrome extension</h3><p>Sign any page or video in your browser. Now in accessibility and compliance review before public release.</p></article>
            <article><span className="ip-pill">Coming soon</span><h3>API &amp; integrations</h3><p>An API and plugins so websites and apps can offer sign language next to their captions.</p></article>
            <article><span className="ip-pill">Research</span><h3>Two-way conversation</h3><p>Sign in, text out — and text in, sign out — so a Deaf person can hold a conversation in their own language.</p></article>
          </div>
        </div>
      </section>

      {/* ── Research ────────────────────────────────────── */}
      <section id="research" className="ip-section">
        <div className="ip-wrap ip-research">
          <div>
            <p className="ip-eyebrow">Research</p>
            <h2>Grounded in evidence.</h2>
            <p className="ip-body">
              DuoSign began as a Computer Science capstone at Ashesi University and won the Outstanding Capstone
              Project Award. The research paper covers the translation pipeline, avatar animation, accessibility
              testing (WCAG 2.1 AA, Lighthouse 100) and a pilot usability study (SUS 73.5, “good”).
            </p>
            <p className="ip-body">Selected references:</p>
            <ul className="ip-refs">
              {RESEARCH_REFS.map((r) => (
                <li key={r.title}>{r.url ? <a href={r.url} target="_blank" rel="noreferrer">{r.title}</a> : r.title}<span>{r.note}</span></li>
              ))}
            </ul>
          </div>
          <aside className="ip-contact">
            <h3>Work with us</h3>
            <p>We are looking to collaborate with Deaf associations, universities, funders and institutions that publish public information.</p>
            <a className="ip-btn" href="mailto:nana.amoako@alumni.ashesi.edu.gh">Get in touch</a>
            <Link className="ip-link" href="/translate">Or try the beta →</Link>
          </aside>
        </div>
      </section>

      <p className="ip-beta-note">
        Beta: American Sign Language today. Sign data comes from the WLASL research dataset (non-commercial use).
      </p>
    </main>
  );
}
