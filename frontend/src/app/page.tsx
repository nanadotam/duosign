import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowRight, ArrowUpRight, Play, ChatCircleText, TextAa, UsersThree, Trophy, Quotes,
} from "@phosphor-icons/react/dist/ssr";
import SiteNav from "@/widgets/site-nav/SiteNav";
import Journey from "@/widgets/journey/Journey";
import "./impact.css";
import { IMPACT_STATS, JOURNEY, TESTER_QUOTES } from "./impact-content";

export const metadata: Metadata = {
  title: { absolute: "DuoSign Beta — the internet, in sign language" },
  description:
    "DuoSign turns written and spoken English into sign language, signed by avatars that look like the people who use them. Built in Ghana. Free and open while in beta.",
};

/**
 * DuoSign Beta landing page — the story and the impact, not the tech.
 * Content (stats, journey, quotes) lives in impact-content.ts.
 */
export default function LandingPage() {
  return (
    <main className="ip">
      <SiteNav />

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
            <Link href="/translate" className="ip-btn">Try the beta <ArrowRight size={18} weight="bold" /></Link>
            <a href="#demo" className="ip-btn ip-btn-ghost"><Play size={18} weight="fill" /> Watch the demo</a>
          </div>
          <p className="ip-note">
            <Trophy size={16} weight="duotone" /> Outstanding Capstone Project, Ashesi University 2026 · free and open while in beta
          </p>
        </div>
        <div className="ip-hero-art" aria-hidden="true">
          <Image src="/landing/signer_kofi.webp" alt="" width={420} height={520} className="ip-signer ip-signer-l" priority />
          <Image src="/landing/signer_ama.webp" alt="" width={480} height={600} className="ip-signer ip-signer-c" priority />
          <Image src="/landing/signer_esi.webp" alt="" width={420} height={520} className="ip-signer ip-signer-r" priority />
          <div className="ip-gloss">HELLO · THANK-YOU · YOU</div>
        </div>
      </section>

      {/* ── Demo ────────────────────────────────────────── */}
      <section id="demo" className="ip-demo">
        <div className="ip-wrap">
          <div className="ip-demo-head">
            <div>
              <p className="ip-eyebrow">See it in action</p>
              <h2>Type a sentence. Watch it signed.</h2>
            </div>
            <ul className="ip-chips" aria-label="What the demo shows">
              <li><ChatCircleText size={18} weight="duotone" /> English in</li>
              <li><TextAa size={18} weight="duotone" /> Sign grammar</li>
              <li><UsersThree size={18} weight="duotone" /> Choose your signer</li>
            </ul>
          </div>
          <figure className="ip-video">
            <div className="ip-video-chrome" aria-hidden="true"><i /><i /><i /><span>duosign — beta</span></div>
            <video
              src="/landing/demo.mp4"
              poster="/landing/demo_poster.webp"
              autoPlay muted loop playsInline controls preload="metadata"
              aria-label="Screen recording: a sentence is typed into DuoSign and Ama signs it"
            />
          </figure>
          <p className="ip-demo-cap">Real screen recording of DuoSign Beta. Signs play from motion captured from real signers.</p>
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
          <Link href="/how-it-works" className="ip-more">See how it works, in depth <ArrowRight size={18} weight="bold" /></Link>
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
      <section id="journey" className="ip-section">
        <div className="ip-wrap">
          <p className="ip-eyebrow">The journey so far</p>
          <h2>From a simple question to an open beta.</h2>
          <Journey steps={JOURNEY} />
        </div>
      </section>

      {/* ── Recognition ─────────────────────────────────── */}
      <section id="recognition" className="ip-section ip-recog">
        <div className="ip-wrap">
          <p className="ip-eyebrow">Recognition</p>
          <h2>How the work has been received.</h2>
          <div className="ip-recog-grid">
            <figure className="ip-recog-card ip-recog-award">
              <Image src="/landing/quasar_award.webp" alt="Nana Kwaku Amoako receiving the Outstanding Capstone Project award at Ashesi University's 2026 Quasar Awards" width={1200} height={800} />
              <figcaption>
                <span className="ip-pill"><Trophy size={14} weight="fill" /> Award</span>
                <h3>Outstanding Capstone Project, Computer Science &amp; Information Systems</h3>
                <p>Ashesi University 2026 Quasar Awards, for &ldquo;DuoSign: A Gloss-Based Approach to Automated ASL Generation&rdquo;.</p>
                <a href="https://ashesi.edu.gh/celebrating-excellence-student-research-and-innovation-2/" target="_blank" rel="noreferrer" className="ip-ext">
                  Read Ashesi&apos;s story <ArrowUpRight size={16} weight="bold" />
                </a>
              </figcaption>
            </figure>
            <figure className="ip-recog-card ip-recog-video">
              <video src="/landing/presenting_loop.mp4" poster="/landing/presenting_poster.webp" autoPlay muted loop playsInline aria-label="Nana Kwaku Amoako speaking at Ashesi University" />
              <figcaption>
                <span className="ip-pill">On stage</span>
                <h3>Speaking at Ashesi University</h3>
                <p>Nana Kwaku Amoako, the developer of DuoSign.</p>
              </figcaption>
            </figure>
            <article className="ip-recog-card ip-recog-quotes">
              <span className="ip-pill"><Quotes size={14} weight="fill" /> From the pilot</span>
              <ul>
                {TESTER_QUOTES.map((q) => (
                  <li key={q}><blockquote>&ldquo;{q}&rdquo;</blockquote></li>
                ))}
              </ul>
              <p className="ip-small">Early testers, DuoSign pilot study, March–April 2026.</p>
            </article>
          </div>
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

      {/* ── Research teaser ─────────────────────────────── */}
      <section id="research" className="ip-section">
        <div className="ip-wrap ip-research">
          <div>
            <p className="ip-eyebrow">Research</p>
            <h2>Grounded in evidence.</h2>
            <p className="ip-body">
              DuoSign began as an applied research project in Computer Science at Ashesi University. The thesis covers
              the translation pipeline, avatar animation, accessibility testing (WCAG 2.1 AA, Lighthouse 100) and a
              pilot usability study. Read it in full, right here.
            </p>
            <Link href="/research" className="ip-btn">Read the research <ArrowRight size={18} weight="bold" /></Link>
          </div>
          <aside className="ip-contact">
            <h3>Work with us</h3>
            <p>We are looking to collaborate with Deaf associations, universities, funders and institutions that publish public information.</p>
            <a className="ip-btn" href="mailto:nana.amoako@alumni.ashesi.edu.gh">Get in touch</a>
          </aside>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────── */}
      <section className="ip-final">
        <div className="ip-wrap">
          <h2>Try DuoSign Beta.</h2>
          <p>Free and open while in beta. No account, no limits, nothing to install.</p>
          <Link href="/translate" className="ip-btn ip-btn-light">Try the beta <ArrowRight size={18} weight="bold" /></Link>
        </div>
      </section>
    </main>
  );
}
