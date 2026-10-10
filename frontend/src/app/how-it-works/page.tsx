import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowRight, ChatCircleText, Microphone, TextAa, FilmStrip, UsersThree, Smiley, HandWaving, Gauge,
  CheckCircle, WarningCircle, Eye, Keyboard, ClosedCaptioning, Database, Cpu, ArrowsLeftRight, Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import SiteNav from "@/widgets/site-nav/SiteNav";
import "../impact.css";
import "./how.css";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How DuoSign turns English into sign language: sign grammar, motion captured from real signers, facial expression and a signer that runs in your browser.",
};

const STAGES = [
  { n: "01", icon: ChatCircleText, title: "Your words", body: "Typed, pasted or spoken" },
  { n: "02", icon: TextAa, title: "Sign grammar", body: "English rewritten into sign order" },
  { n: "03", icon: FilmStrip, title: "Motion library", body: "Signs captured from real signers" },
  { n: "04", icon: UsersThree, title: "Your signer", body: "Ama, Kofi or Esi signs it" },
];

const GLOSS_EXAMPLES = [
  { en: "I went to the store yesterday.", gloss: "YESTERDAY I STORE GO", rule: "Time comes first; the verb comes after its object." },
  { en: "Hello, how are you?", gloss: "HELLO YOU HOW", rule: "Question words move to the end." },
  { en: "Where is the bathroom?", gloss: "BATHROOM WHERE", rule: "Linking words like “is” and “the” are dropped." },
  { en: "I do not understand.", gloss: "I UNDERSTAND NOT", rule: "Negation goes at the end." },
  { en: "My name is Kofi.", gloss: "NAME K-O-F-I", rule: "Names and unknown words are fingerspelled." },
  { en: "Thank you for your help.", gloss: "HELP THANK-YOU", rule: "Phrases with one sign stay one sign." },
];

export default function HowItWorksPage() {
  return (
    <main className="ip hw">
      <SiteNav />

      {/* Hero + pipeline */}
      <section className="hw-hero">
        <div className="ip-wrap">
          <p className="ip-eyebrow">How it works</p>
          <h1>From your words to a signer, in about a second.</h1>
          <p className="ip-lede">
            DuoSign does three things: it rewrites English into the order a sign language uses, finds each sign in a
            library of motion captured from real signers, and has a 3D signer perform it smoothly in your browser.
            Nothing to install.
          </p>
          <ol className="hw-pipe" aria-label="The four stages">
            {STAGES.map((s, i) => (
              <li key={s.n} style={{ ["--i" as string]: i }}>
                <span className="hw-pipe-n">{s.n}</span>
                <s.icon size={30} weight="duotone" />
                <h2>{s.title}</h2>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 01 Input */}
      <section className="ip-section hw-stage">
        <div className="ip-wrap hw-split">
          <div>
            <p className="hw-num">01 · Your words</p>
            <h2>Type it, paste it, or say it.</h2>
            <p className="ip-body">
              Write a sentence of up to 500 characters, paste text from anywhere, or press the microphone and speak.
              Speech is transcribed to text first, so spoken and written English take the same path.
            </p>
          </div>
          <ul className="hw-facts">
            <li><ChatCircleText size={24} weight="duotone" /><div><b>Text or paste</b><span>Any English sentence, up to 500 characters</span></div></li>
            <li><Microphone size={24} weight="duotone" /><div><b>Voice</b><span>Speak naturally; it becomes text, then sign</span></div></li>
          </ul>
        </div>
      </section>

      {/* 02 Sign grammar */}
      <section className="ip-section hw-stage hw-alt">
        <div className="ip-wrap">
          <p className="hw-num">02 · Sign grammar</p>
          <h2>Sign languages are not English on the hands.</h2>
          <p className="ip-body">
            American Sign Language has its own word order and drops words that English needs. DuoSign rewrites your
            sentence into <em>gloss</em>, the written form signers use to note down signs, using grammar rules that run
            in a few milliseconds. An AI language model then double-checks the result in the background and improves
            it if it can, within about three seconds.
          </p>
          <div className="hw-table" role="table" aria-label="Examples of English rewritten into ASL gloss">
            <div role="row" className="hw-th"><span role="columnheader">You write</span><span role="columnheader">DuoSign signs</span><span role="columnheader">Why</span></div>
            {GLOSS_EXAMPLES.map((g) => (
              <div role="row" key={g.en}>
                <span role="cell">{g.en}</span>
                <span role="cell" className="hw-gloss">{g.gloss}</span>
                <span role="cell" className="hw-why">{g.rule}</span>
              </div>
            ))}
          </div>
          <p className="hw-note">These are real outputs from DuoSign Beta today.</p>
        </div>
      </section>

      {/* 03 Motion library */}
      <section className="ip-section hw-stage">
        <div className="ip-wrap">
          <p className="hw-num">03 · Motion library</p>
          <h2>Every sign comes from a real signer.</h2>
          <p className="ip-body">
            DuoSign&apos;s signs come from the WLASL research dataset: thousands of short videos of people signing
            American Sign Language words. For each sign, DuoSign picks the clearest, sharpest recording, then works out
            how the body, arms, every finger and the face move, frame by frame. That work is done once, ahead of time,
            and saved as a compact motion clip. When you press Translate, nothing has to be worked out live. The signs
            are ready to play.
          </p>
          <div className="hw-grid">
            <article><Database size={28} weight="duotone" /><strong>2,000</strong><span>signs, drawn from 11,980 videos of real signers</span></article>
            <article><Smiley size={28} weight="duotone" /><strong>1,749</strong><span>signs carry the signer&apos;s facial expression. In sign language the face carries grammar</span></article>
            <article><HandWaving size={28} weight="duotone" /><strong>26 / 26</strong><span>letters for fingerspelling. The original dataset had no C, L, X, Y or Z, so we added them</span></article>
            <article><CheckCircle size={28} weight="duotone" /><strong>524</strong><span>signs pass every automatic quality check. Up from 229 before this month&apos;s rebuild</span></article>
          </div>
          <div className="hw-steps">
            <div><span>1</span><p><b>Choose the best recording.</b> Of all the videos of a sign, take the sharpest one that shows the hands clearly.</p></div>
            <div><span>2</span><p><b>Track the body, hands and face.</b> Pose, both hands (21 points each) and 52 facial expression channels, every frame.</p></div>
            <div><span>3</span><p><b>Turn it into joint rotations.</b> Positions become rotations for 43 joints, with limits so elbows and fingers bend like real ones.</p></div>
            <div><span>4</span><p><b>Check it.</b> Automatic checks flag shaky fingers, missing hands and low-quality sources for human review.</p></div>
          </div>
        </div>
      </section>

      {/* 04 Signer */}
      <section className="ip-section hw-stage hw-alt">
        <div className="ip-wrap hw-split hw-split-art">
          <div>
            <p className="hw-num">04 · Your signer</p>
            <h2>A signer who looks like the people who use it.</h2>
            <p className="ip-body">
              Ama, Kofi and Esi are semi-realistic 3D signers made for DuoSign, alongside the original DS Proto. Choose
              one with a single click. Because every clip also records where the hands are relative to the face and
              chest, a sign lands in the right place on any body, whether a hand touches the chin or rests on the chest.
            </p>
            <ul className="hw-list">
              <li><ArrowsLeftRight size={20} weight="duotone" /> Signs blend smoothly into each other, with no jumps between words</li>
              <li><Smiley size={20} weight="duotone" /> Facial expression is smoothed so it reads naturally</li>
              <li><Gauge size={20} weight="duotone" /> Runs in any modern browser; each signer is about 5 MB</li>
              <li><Sparkle size={20} weight="duotone" /> Close-up, full-body and 3D views, and playback from half speed to double</li>
            </ul>
          </div>
          <div className="hw-signers" aria-hidden="true">
            <Image src="/landing/signer_kofi.webp" alt="" width={420} height={520} />
            <Image src="/landing/signer_ama.webp" alt="" width={480} height={600} />
            <Image src="/landing/signer_esi.webp" alt="" width={420} height={520} />
          </div>
        </div>
      </section>

      {/* Accessibility */}
      <section className="ip-section hw-stage">
        <div className="ip-wrap">
          <p className="hw-num">Built accessible</p>
          <h2>An accessibility tool has to be accessible itself.</h2>
          <div className="hw-grid hw-grid-3">
            <article><Eye size={28} weight="duotone" /><strong>WCAG 2.1 AA</strong><span>Audited with axe-core (0 violations) and Lighthouse (accessibility 100/100)</span></article>
            <article><Keyboard size={28} weight="duotone" /><strong>Keyboard first</strong><span>Every control works from the keyboard, with shortcuts and visible focus</span></article>
            <article><ClosedCaptioning size={28} weight="duotone" /><strong>Captions on the signer</strong><span>The current sign is shown as a caption, and the full gloss is listed next to the input</span></article>
          </div>
        </div>
      </section>

      {/* Honest limits */}
      <section className="ip-section ip-dark">
        <div className="ip-wrap">
          <p className="ip-eyebrow">Plainly</p>
          <h2>What DuoSign can&apos;t do yet.</h2>
          <ul className="hw-limits">
            <li><WarningCircle size={22} weight="duotone" /><span><b>American Sign Language only.</b> Ghanaian Sign Language and other African sign languages need new recordings, made with Deaf signers.</span></li>
            <li><WarningCircle size={22} weight="duotone" /><span><b>Word by word.</b> Signs are joined in sign order, but the richer grammar of space, direction and role-shift isn&apos;t modelled yet.</span></li>
            <li><WarningCircle size={22} weight="duotone" /><span><b>Not yet evaluated by Deaf users in a structured study.</b> That is the next step, led with Deaf organisations.</span></li>
            <li><WarningCircle size={22} weight="duotone" /><span><b>Not a replacement for interpreters.</b> Not for medical, legal or other high-stakes settings.</span></li>
          </ul>
          <div className="hw-cta">
            <Link href="/translate" className="ip-btn ip-btn-light">Try the beta <ArrowRight size={18} weight="bold" /></Link>
            <Link href="/research" className="hw-link">Read the research <ArrowRight size={16} weight="bold" /></Link>
          </div>
          <p className="hw-tech"><Cpu size={16} weight="duotone" /> Under the hood: Next.js, FastAPI, spaCy, MediaPipe, three.js and three-vrm.</p>
        </div>
      </section>
    </main>
  );
}
