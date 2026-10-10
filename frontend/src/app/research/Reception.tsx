import Image from "next/image";
import {
  Trophy, ArrowUpRight, Buildings, Handshake, EnvelopeSimple, Users, Quotes, ThumbsUp, Wrench, Presentation,
} from "@phosphor-icons/react/dist/ssr";
import "./research-reception.css";

const CONVERSATIONS = [
  {
    icon: Buildings, when: "Oct 2026", who: "UNECA Disability Inclusion Desk",
    what: "Staff with disabilities at the UN Economic Commission for Africa discussed DuoSign at their weekly meeting, met with Nana by phone, and are sharing it with colleagues across the UN. They asked where DuoSign has been tested, with whom, and what users said, and pointed to the procurement provisions of the UN Disability Inclusion Strategy as an opportunity.",
  },
  {
    icon: EnvelopeSimple, when: "Sep 2026", who: "Christina Abraham, Ashesi University Foundation",
    what: "A former UNECA colleague who introduced DuoSign to the Commission's disability inclusion working group, framing it as innovation from Africa that people working on inclusion should know about.",
  },
  {
    icon: Handshake, when: "Jul 2026", who: "Shuaib Chalklen, African Disability Forum",
    what: "Head of the African Disability Forum and former UN Special Rapporteur on Disability. A conversation about taking DuoSign further across the continent and connecting with disability-rights funders.",
  },
  {
    icon: Users, when: "Mar–Apr 2026", who: "Ashesi University accessibility team",
    what: "Expert reviewers for the pilot. They responded well to the idea and the overall design, and valued the 2D skeleton view as a supporting aid. Their main concern was the avatar: its signing was harder to follow, and they often relied on the skeleton to confirm a sign.",
  },
];

const LIKED = [
  "It's such a lovely UI. I think it's clean and smooth and you don't need so much guidance.",
  "I really appreciate that I can use it to learn sign language at my own pace.",
  "I like how the breakdown of the words and letters is visible.",
];
const IMPROVE = [
  "The avatar's movements can be a bit difficult to understand.",
  "The animated avatar is not as fluid, so her signing is not really understandable. The skeleton, I think, is good.",
  "It works slowly and kept freezing.",
];

/** "How it was received": recognition, conversations and pilot feedback, good and bad. */
export default function Reception() {
  return (
    <section id="reception" className="rc">
      <div className="rc-wrap">
        <p className="rc-eyebrow">How it was received</p>
        <h2>Recognition, conversations and honest feedback.</h2>

        <div className="rc-hero">
          <figure className="rc-award">
            <Image src="/landing/quasar_award.webp" alt="Nana Kwaku Amoako receiving the Outstanding Capstone Project award at Ashesi University's 2026 Quasar Awards" width={1200} height={800} />
            <figcaption>
              <span className="rc-pill"><Trophy size={14} weight="fill" /> May 2026</span>
              <h3>Outstanding Capstone Project, Computer Science &amp; Information Systems</h3>
              <p>Ashesi University 2026 Quasar Awards, for &ldquo;DuoSign: A Gloss-Based Approach to Automated ASL Generation&rdquo;, recognised for its contribution to accessibility and inclusive communication.</p>
              <a href="https://ashesi.edu.gh/celebrating-excellence-student-research-and-innovation-2/" target="_blank" rel="noreferrer">
                Ashesi University: 2026 Quasar Awards <ArrowUpRight size={15} weight="bold" />
              </a>
            </figcaption>
          </figure>
          <div className="rc-side">
            <figure className="rc-video">
              <video src="/landing/presenting_loop.mp4" poster="/landing/presenting_poster.webp" autoPlay muted loop playsInline aria-label="Nana Kwaku Amoako speaking at Ashesi University" />
              <figcaption><Presentation size={16} weight="duotone" /> Speaking at Ashesi University</figcaption>
            </figure>
            <div className="rc-mini">
              <span className="rc-pill">Mar 2026</span>
              <p>Submitted to the Ashesi Undergraduate Research Conference.</p>
            </div>
          </div>
        </div>

        <h3 className="rc-sub">Conversations</h3>
        <ol className="rc-convos">
          {CONVERSATIONS.map((c) => (
            <li key={c.who}>
              <span className="rc-icon"><c.icon size={24} weight="duotone" /></span>
              <div>
                <p className="rc-when">{c.when}</p>
                <h4>{c.who}</h4>
                <p>{c.what}</p>
              </div>
            </li>
          ))}
        </ol>

        <h3 className="rc-sub">What pilot testers said</h3>
        <div className="rc-quotes">
          <div>
            <p className="rc-qhead"><ThumbsUp size={18} weight="duotone" /> What they liked</p>
            {LIKED.map((q) => <blockquote key={q}><Quotes size={16} weight="fill" aria-hidden="true" /> {q}</blockquote>)}
          </div>
          <div>
            <p className="rc-qhead"><Wrench size={18} weight="duotone" /> What needed work</p>
            {IMPROVE.map((q) => <blockquote key={q}><Quotes size={16} weight="fill" aria-hidden="true" /> {q}</blockquote>)}
          </div>
        </div>
        <p className="rc-foot">
          Pilot study, March–April 2026: 5 completed questionnaires from hearing testers (System Usability Scale 73.5, &ldquo;good&rdquo;)
          plus an expert review by Ashesi&apos;s accessibility team. A structured evaluation with Deaf users is the next step.
          The feedback on the avatar is what drove the October 2026 rebuild of how DuoSign signs.
        </p>
      </div>
    </section>
  );
}
