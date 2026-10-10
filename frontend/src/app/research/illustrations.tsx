import {
  Radio, Van, FirstAid, MonitorPlay, Bank, Television, ChatCircleDots, Gavel, HandWaving, Globe,
  Microphone, TextAa, FilmStrip, UsersThree, ArrowRight, Users, Eye, Wrench, CheckCircle,
} from "@phosphor-icons/react/dist/ssr";

/* ───────────────────────── 1. A day without access ───────────────────────── */

type Access = "none" | "partial" | "full";
const DAY: { time: string; icon: typeof Radio; place: string; what: string; access: Access }[] = [
  { time: "6:30", icon: Radio, place: "Morning news", what: "Spoken on the radio", access: "none" },
  { time: "8:00", icon: Van, place: "Trotro", what: "Stops called out by the mate", access: "none" },
  { time: "10:00", icon: FirstAid, place: "Clinic", what: "Many facilities have no interpreter", access: "none" },
  { time: "13:00", icon: MonitorPlay, place: "Lecture video", what: "Auto-captions, in a second language", access: "partial" },
  { time: "16:00", icon: Bank, place: "Bank form", what: "Written English only", access: "partial" },
  { time: "20:00", icon: Television, place: "State address", what: "An interpreter in the corner", access: "full" },
  { time: "21:30", icon: ChatCircleDots, place: "Family group chat", what: "A voice note", access: "none" },
];
const ACCESS_LABEL: Record<Access, string> = { none: "No access", partial: "Text only", full: "Signed" };

export function DayJourney() {
  return (
    <figure className="rx-fig rx-day">
      <ol className="rx-day-track">
        {DAY.map((d) => (
          <li key={d.time} className={`rx-day-stop rx-${d.access}`}>
            <span className="rx-day-time">{d.time}</span>
            <span className="rx-day-icon"><d.icon size={26} weight="duotone" /></span>
            <strong>{d.place}</strong>
            <span className="rx-day-what">{d.what}</span>
            <span className="rx-day-tag">{ACCESS_LABEL[d.access]}</span>
          </li>
        ))}
      </ol>
      <figcaption>
        <span className="rx-key"><i className="rx-none" /> No access <i className="rx-partial" /> Text only <i className="rx-full" /> Signed</span>
        An illustration drawn from reported experiences in Ghana, not one person&apos;s diary.
      </figcaption>
    </figure>
  );
}

/* ───────────────────────── 2. Who interprets? ───────────────────────── */

const COVERAGE = [
  { icon: Gavel, title: "Live & high-stakes", where: "Courts, hospitals, ceremonies", level: 3, who: "Qualified interpreters, when one can be found", note: "Must stay human" },
  { icon: Television, title: "Broadcast", where: "State addresses, some news", level: 2, who: "Sometimes an interpreter in the corner", note: "Patchy" },
  { icon: Globe, title: "Everything online", where: "Videos, webinars, forms, feeds, voice notes", level: 1, who: "Captions, at best: written English, not a first language", note: "Where DuoSign works" },
];

export function WhoInterprets() {
  return (
    <figure className="rx-fig">
      <div className="rx-who">
        {COVERAGE.map((c) => (
          <div key={c.title} className={`rx-who-col ${c.level === 1 ? "rx-who-us" : ""}`}>
            <div className="rx-who-bar" aria-hidden="true">
              {[1, 2, 3].map((n) => <span key={n} className={n <= c.level ? "on" : ""} />)}
            </div>
            <c.icon size={28} weight="duotone" />
            <h4>{c.title}</h4>
            <p className="rx-who-where">{c.where}</p>
            <p className="rx-who-who">{c.who}</p>
            <span className="rx-who-note">{c.note}</span>
          </div>
        ))}
      </div>
      <figcaption>Interpreter coverage, illustrated qualitatively. DuoSign aims at the right-hand column, as a complement to interpreters, never a replacement.</figcaption>
    </figure>
  );
}

/* ───────────────────────── 3. Ghanaian Sign Language family tree ───────────────────────── */

export function SignFamilyTree() {
  return (
    <figure className="rx-fig">
      <svg viewBox="0 0 760 330" className="rx-tree" role="img" aria-labelledby="tree-t tree-d">
        <title id="tree-t">How Ghanaian Sign Language came to be</title>
        <desc id="tree-d">American Sign Language, brought by Andrew Foster&apos;s schools from 1957, mixed with local Ghanaian signs to form Ghanaian Sign Language. Adamorobe Sign Language is a separate village sign language.</desc>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#9aa69e" /></marker>
        </defs>
        <g className="rx-node"><rect x="20" y="30" width="210" height="74" rx="16" /><text x="125" y="62">American Sign Language</text><text x="125" y="84" className="rx-small">via Andrew Foster&apos;s schools, 1957</text></g>
        <g className="rx-node"><rect x="20" y="150" width="210" height="74" rx="16" /><text x="125" y="182">Local Ghanaian signs</text><text x="125" y="204" className="rx-small">home and community signing</text></g>
        <path d="M230 67 C 300 67, 300 140, 350 160" className="rx-edge" markerEnd="url(#arr)" />
        <path d="M230 187 C 290 187, 300 180, 350 178" className="rx-edge" markerEnd="url(#arr)" />
        <g className="rx-node rx-node-main"><rect x="352" y="120" width="240" height="100" rx="20" /><text x="472" y="160">Ghanaian Sign Language</text><text x="472" y="186" className="rx-small">national dictionary 2021 · school curriculum 2025</text></g>
        <g className="rx-node rx-node-alt"><rect x="352" y="250" width="240" height="64" rx="16" /><text x="472" y="278">Adamorobe Sign Language</text><text x="472" y="298" className="rx-small">a village sign language, now endangered</text></g>
        <path d="M592 170 L 690 170" className="rx-edge rx-edge-us" markerEnd="url(#arr)" />
        <g className="rx-node rx-node-us"><rect x="640" y="40" width="110" height="74" rx="16" /><text x="695" y="70">DuoSign</text><text x="695" y="92" className="rx-small">next: GSL</text></g>
        <path d="M695 114 L 695 150" className="rx-edge rx-edge-us" />
      </svg>
      <figcaption>Ghanaian Sign Language grew from American Sign Language and local signs; Adamorobe Sign Language developed separately in one village. Sources: University of Ghana; Endangered Languages Project.</figcaption>
    </figure>
  );
}

/* ───────────────────────── 4. The data gap ───────────────────────── */

const SHELVES = [
  {
    lang: "American Sign Language", tone: "us",
    sets: [
      { name: "WLASL", size: "2,000 words · 100+ signers", w: 3 },
      { name: "How2Sign", size: "80+ hours", w: 4 },
      { name: "ASL Citizen", size: "83,399 videos", w: 5 },
      { name: "SignAvatars", size: "70,000 videos (multi-language)", w: 5 },
    ],
  },
  {
    lang: "Ghanaian Sign Language", tone: "gh",
    sets: [
      { name: "GSL Lexicon", size: "1,200+ signs", w: 2 },
      { name: "SignTalk-Gh", size: "9,000+ healthcare videos", w: 3 },
    ],
  },
  { lang: "Kenyan Sign Language", tone: "gh", sets: [{ name: "AI4KSL", size: "~15,000 sentences", w: 3 }] },
  { lang: "Most other African sign languages", tone: "none", sets: [] },
];

export function DataShelf() {
  return (
    <figure className="rx-fig">
      <div className="rx-shelf">
        {SHELVES.map((s) => (
          <div key={s.lang} className={`rx-shelf-row rx-${s.tone}`}>
            <span className="rx-shelf-lang">{s.lang}</span>
            <div className="rx-shelf-books">
              {s.sets.length === 0 && <span className="rx-shelf-empty">Little or no public data</span>}
              {s.sets.map((b) => (
                <span key={b.name} className="rx-book" style={{ flexGrow: b.w }}>
                  <b>{b.name}</b><small>{b.size}</small>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <figcaption>Notable public sign-language datasets we found, by language. Units differ between datasets, so read this as a picture of who has data, not an exact comparison.</figcaption>
    </figure>
  );
}

/* ───────────────────────── 5. Who came before ───────────────────────── */

export const PRIOR_WORK: { year: string; name: string; who: string; what: string; url: string; africa?: boolean; context?: boolean }[] = [
  { year: "2010s", name: "SASL ↔ English with a 3D signer", who: "University of the Western Cape, South Africa", what: "Years of machine translation research for South African Sign Language, an early African avatar effort.", url: "https://etd.uwc.ac.za/handle/11394/4322", africa: true },
  { year: "2013", name: "Hand Talk", who: "Brazil", what: "Hugo the avatar translates Portuguese into Libras: proof that a friendly signer from the Global South can reach millions.", url: "https://www.handtalk.me/en/" },
  { year: "2018", name: "Statement on signing avatars", who: "World Federation of the Deaf & WASLI", what: "Avatars must not replace qualified interpreters, and sign languages cannot be rendered word for word. Our guiding constraint.", url: "https://wasli.org/news/wfd-wasli-statement-use-signing-avatars/", context: true },
  { year: "2019", name: "An interdisciplinary perspective", who: "Bragg et al., ASSETS Best Paper", what: "Sign-language technology fails when built in silos; Deaf people must be involved from the start.", url: "https://arxiv.org/abs/1908.08597" },
  { year: "2020", name: "WLASL", who: "Li et al., WACV", what: "Word-level ASL videos from 100+ signers. Today's DuoSign vocabulary comes from it.", url: "https://dxli94.github.io/WLASL/" },
  { year: "2020", name: "Ghanaian Sign Language app & lexicon", who: "Leiden University & University of Ghana", what: "1,200+ GSL signs, built with Deaf Ghanaians.", url: "https://www.universiteitleiden.nl/en/news/2020/02/learning-african-sign-languages-via-a-video-app", africa: true },
  { year: "2021", name: "How2Sign", who: "Duarte et al., CVPR", what: "80+ hours of continuous signing: what sentence-level data looks like.", url: "https://how2sign.github.io" },
  { year: "2021", name: "SignTown / Project Shuwa", who: "Google, CUHK, Nippon Foundation", what: "A multi-country partnership of universities and Deaf organisations.", url: "https://www.arts.cuhk.edu.hk/web/news/cuhk-google-and-japanese-counterparts-achieve-technological-breakthrough-in-automatic-sign-language-recognition-launching-signtown-the-world-first-multi-language-online-sign-language-game" },
  { year: "2021", name: "Harmonised GSL Dictionary", who: "GES, UNICEF Ghana, GNAD", what: "A national reference for Ghanaian Sign Language; a school curriculum followed in 2025.", url: "https://www.graphic.com.gh/news/general-news/ghana-news-harmonised-ghanaian-sign-language-dictionary-introduced.html", africa: true },
  { year: "2023", name: "ASL Citizen", who: "Microsoft Research & Boston University", what: "Data recorded by consenting Deaf and hard-of-hearing signers: a model for collecting data with the community.", url: "https://www.microsoft.com/en-us/research/project/asl-citizen/" },
  { year: "2024", name: "sign.mt", who: "Amit Moryossef", what: "Open-source text-to-sign translation; the closest open counterpart to DuoSign.", url: "https://sign.mt" },
  { year: "2024", name: "AI4KSL", who: "Maseno University, Kenya", what: "English to Kenyan Sign Language with virtual signers.", url: "https://arxiv.org/abs/2410.18295", africa: true },
  { year: "2025", name: "NVIDIA Signs", who: "NVIDIA & American Society for Deaf Children", what: "Motion captured from real signers and checked by Deaf reviewers. DuoSign's motion rebuild learns from this approach.", url: "https://signs-ai.com" },
  { year: "2026", name: "SignTalk-Gh", who: "KNUST, Ghana", what: "9,000+ Ghanaian Sign Language videos for healthcare.", url: "https://gna.org.gh/2026/09/scientists-develop-ai-assisted-ghanaian-sign-language-recognition-model-for-inclusive-healthcare/", africa: true },
];

export function PriorWorkTimeline() {
  return (
    <ol className="rx-tl">
      {PRIOR_WORK.map((p) => (
        <li key={p.name} className={`${p.africa ? "rx-tl-africa" : ""} ${p.context ? "rx-tl-context" : ""}`}>
          <time>{p.year}</time>
          <div>
            <h4><a href={p.url} target="_blank" rel="noreferrer">{p.name}</a>{p.africa && <span className="rx-flag">Africa</span>}</h4>
            <p className="rx-tl-who">{p.who}</p>
            <p>{p.what}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ───────────────────────── 6. How it works strip ───────────────────────── */

const STEPS = [
  { icon: Microphone, t: "You type or speak", d: "Any English sentence" },
  { icon: TextAa, t: "Meaning becomes sign order", d: "Time first, questions last" },
  { icon: FilmStrip, t: "Signs from real signers", d: "Motion captured from video" },
  { icon: UsersThree, t: "Your signer signs it", d: "Ama, Kofi or Esi, in your browser" },
];

export function HowStrip() {
  return (
    <ol className="rx-how">
      {STEPS.map((s, i) => (
        <li key={s.t}>
          <span className="rx-how-icon"><s.icon size={28} weight="duotone" /></span>
          <strong>{s.t}</strong>
          <span>{s.d}</span>
          {i < STEPS.length - 1 && <ArrowRight className="rx-how-arrow" size={20} weight="bold" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}

/* ───────────────────────── 7. Co-design loop ───────────────────────── */

const LOOP = [
  { icon: HandWaving, t: "Deaf signers record", d: "Paid, with consent" },
  { icon: Eye, t: "The community reviews", d: "Is it natural? Is it correct?" },
  { icon: Wrench, t: "DuoSign improves", d: "Motion, grammar, faces" },
  { icon: Users, t: "Deaf users test", d: "Comprehension, not just clicks" },
];

export function CoDesignLoop() {
  return (
    <figure className="rx-fig rx-loop-fig">
      <div className="rx-loop" role="list" aria-label="Co-design loop">
        <svg viewBox="0 0 400 400" className="rx-loop-ring" aria-hidden="true">
          <circle cx="200" cy="200" r="150" />
          <path d="M200 50 A150 150 0 0 1 350 200" className="rx-loop-arc" />
          <path d="M350 200 A150 150 0 0 1 200 350" className="rx-loop-arc" />
          <path d="M200 350 A150 150 0 0 1 50 200" className="rx-loop-arc" />
          <path d="M50 200 A150 150 0 0 1 200 50" className="rx-loop-arc" />
        </svg>
        {LOOP.map((l, i) => (
          <div key={l.t} role="listitem" className={`rx-loop-node rx-loop-${i}`}>
            <l.icon size={26} weight="duotone" />
            <strong>{l.t}</strong>
            <span>{l.d}</span>
          </div>
        ))}
        <div className="rx-loop-center"><CheckCircle size={30} weight="duotone" /><span>With,<br />not for</span></div>
      </div>
      <figcaption>How Ghanaian Sign Language will be built: a loop led by Deaf signers and Deaf organisations, repeated until the community says it works.</figcaption>
    </figure>
  );
}
