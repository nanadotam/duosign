import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpenText, Quotes, CheckCircle, XCircle } from "@phosphor-icons/react/dist/ssr";
import SiteNav from "@/widgets/site-nav/SiteNav";
import Reception from "./Reception";
import { DayJourney, WhoInterprets, SignFamilyTree, DataShelf, PriorWorkTimeline, HowStrip, CoDesignLoop } from "./illustrations";
import "../impact.css";
import "./story.css";

export const metadata: Metadata = {
  title: "Research",
  description:
    "The story behind DuoSign: the gap Deaf people face online, the sign languages and data behind it, the work that came before, and what our research learned.",
  alternates: { canonical: "/research" },
};

const SOURCES = [
  { t: "World Federation of the Deaf, via UN International Day of Sign Languages", u: "https://www.un.org/en/observances/sign-languages-day" },
  { t: "WHO, Deafness and hearing loss fact sheet (3 March 2026)", u: "https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss" },
  { t: "UN Convention on the Rights of Persons with Disabilities (Arts. 9, 21, 24, 30)", u: "https://www.un.org/development/desa/disabilities/convention-on-the-rights-of-persons-with-disabilities.html" },
  { t: "WFD & WASLI, Statement on the use of signing avatars (2018)", u: "https://wasli.org/news/wfd-wasli-statement-use-signing-avatars/" },
  { t: "GNA, Health facilities without sign language interpreters (2023)", u: "https://gna.org.gh/2023/07/health-facilities-without-sign-language-interpreters-bane-to-achieving-sdgs/" },
  { t: "The Conversation, Sign language needs policy protection in Ghana", u: "https://theconversation.com/sign-language-needs-policy-protection-in-ghana-109774" },
  { t: "Ghanaian Times, GNAD on the 2021 Census and hearing difficulty", u: "https://ghanaiantimes.com.gh/world-hearing-day-gnad-makes-case-for-schools-for-the-deaf-others" },
  { t: "Endangered Languages Project, Adamorobe Sign Language", u: "https://endangeredlanguages.com/lang/6909" },
];

const BIBTEX = `@misc{amoako2026duosign,
  author = {Amoako, Nana Kwaku},
  title  = {DuoSign: A Gloss-Based Approach to Automated ASL Generation},
  note   = {Applied Project, B.Sc. Computer Science},
  school = {Ashesi University},
  year   = {2026},
  url    = {https://duosign.nanaamoako.com/research}
}`;

export default function ResearchStoryPage() {
  return (
    <main className="ip rx">
      <SiteNav />

      {/* Hero */}
      <section className="rx-hero">
        <div className="ip-wrap">
          <p className="ip-eyebrow">Research</p>
          <h1>Information shouldn&apos;t need a middleman.</h1>
          <p className="ip-lede">
            DuoSign started with a simple question: if I can call someone and talk in my own language, why does a Deaf
            person still have to read nearly everything online? This page tells the story behind the research: the
            people it is for, the gap they face, the work that came before us, and what we have learned.
          </p>
          <div className="ip-cta">
            <Link href="/translate" className="ip-btn">Try DuoSign <ArrowRight size={18} weight="bold" /></Link>
            <Link href="/research/paper" className="ip-btn ip-btn-ghost"><BookOpenText size={18} weight="duotone" /> Read the full thesis</Link>
          </div>
          <ul className="rx-big">
            <li><strong>70M+</strong><span>Deaf people worldwide</span><cite>World Federation of the Deaf</cite></li>
            <li><strong>300+</strong><span>sign languages, each a full language</span><cite>World Federation of the Deaf</cite></li>
            <li><strong>~80%</strong><span>of the 430 million people with disabling hearing loss live in low- and middle-income countries</span><cite>WHO, 2026</cite></li>
          </ul>
        </div>
      </section>

      {/* 1 Day */}
      <section className="ip-section rx-sec">
        <div className="ip-wrap">
          <p className="rx-num">01 · A day without access</p>
          <h2>Most of the day arrives as sound or text.</h2>
          <p className="ip-body">
            For a Deaf person whose first language is a sign language, written English is often a second language. A
            day is full of information that is spoken aloud, or written in a language that isn&apos;t theirs, and only
            occasionally signed.
          </p>
          <DayJourney />
        </div>
      </section>

      {/* 2 Who interprets */}
      <section className="ip-section rx-sec rx-white">
        <div className="ip-wrap">
          <p className="rx-num">02 · Who interprets?</p>
          <h2>Interpreters are vital, and stretched thin.</h2>
          <p className="ip-body">
            In Ghana, the 2021 Census counted about 470,000 people with some difficulty hearing, including about 19,000 who
            cannot hear at all (as reported by the Ghana National Association of the Deaf). Many public health
            facilities have no sign language interpreter, and Ghana&apos;s disability law, Act 715, says nothing about
            sign language. Interpreters rightly go to courts, clinics and ceremonies. The internet, where more and more
            of life happens, is left almost entirely unsigned. Captions help, but they are written English: for many Deaf
            people that is a second language, not their natural, first way of communicating.
          </p>
          <WhoInterprets />
        </div>
      </section>

      {/* 3 Languages */}
      <section className="ip-section rx-sec">
        <div className="ip-wrap rx-two">
          <div>
            <p className="rx-num">03 · Sign languages are languages</p>
            <h2>Not English on the hands.</h2>
            <p className="ip-body">
              Sign languages have their own grammar, word order and use of the face and space. Ghanaian Sign Language
              grew from American Sign Language, brought by Andrew Foster&apos;s schools from 1957, mixed with local
              Ghanaian signs. The UN Convention on the Rights of Persons with Disabilities recognises sign languages and
              Deaf linguistic identity (Articles 21 and 30).
            </p>
            <p className="ip-body">
              That is why DuoSign rewrites English into sign order rather than swapping word for word, and why a
              Ghanaian version must be built with Deaf Ghanaians.
            </p>
          </div>
          <SignFamilyTree />
        </div>
      </section>

      {/* 4 Data */}
      <section className="ip-section rx-sec rx-white">
        <div className="ip-wrap">
          <p className="rx-num">04 · The data gap</p>
          <h2>The technology follows the data, and the data isn&apos;t here.</h2>
          <p className="ip-body">
            Computers learn to sign from recordings of people signing. American Sign Language has large public
            collections; most African sign languages have little or none. This is why DuoSign speaks American Sign
            Language today, and why Ghanaian Sign Language has to be recorded with Deaf signers, not scraped from the
            internet.
          </p>
          <DataShelf />
        </div>
      </section>

      {/* 5 Who came before */}
      <section className="ip-section rx-sec">
        <div className="ip-wrap">
          <p className="rx-num">05 · Who came before</p>
          <h2>Standing on many shoulders.</h2>
          <p className="ip-body">
            DuoSign was inspired by researchers, companies and Deaf organisations around the world, and especially by
            work across Africa. Here is the work that shaped it.
          </p>
          <PriorWorkTimeline />
        </div>
      </section>

      {/* 6 How */}
      <section className="ip-section rx-sec rx-white">
        <div className="ip-wrap">
          <p className="rx-num">06 · What DuoSign does</p>
          <h2>One idea, four steps.</h2>
          <HowStrip />
          <Link href="/how-it-works" className="ip-more">How it works, in depth <ArrowRight size={18} weight="bold" /></Link>
        </div>
      </section>

      {/* 7 Learned */}
      <section className="ip-section rx-sec">
        <div className="ip-wrap">
          <p className="rx-num">07 · What we learned</p>
          <h2>Easy to use. The signing had to get clearer.</h2>
          <p className="ip-body">
            Our pilot, with Ashesi University&apos;s accessibility team and early testers, gave one consistent message:
            the interface was easy, but the avatar&apos;s signing was hard to follow. That feedback drove the rebuild:
            motion captured from real signers, smoother movement, facial expression and a full fingerspelling alphabet.
          </p>
          <div className="rx-cards">
            <article className="rx-can">
              <h3><CheckCircle size={22} weight="duotone" /> DuoSign can</h3>
              <ul>
                <li>Sign everyday English sentences in American Sign Language</li>
                <li>Fingerspell names and words it doesn&apos;t know</li>
                <li>Run in any browser, free, with no account</li>
              </ul>
            </article>
            <article className="rx-cant">
              <h3><XCircle size={22} weight="duotone" /> Not yet</h3>
              <ul>
                <li>Ghanaian or other African sign languages</li>
                <li>The full grammar of space, direction and role shift</li>
                <li>Replace interpreters, especially in medical or legal settings</li>
              </ul>
            </article>
          </div>
          <blockquote className="rx-quote">
            <Quotes size={28} weight="fill" aria-hidden="true" />
            <p>Signing avatars should never take the place of qualified human interpreters.</p>
            <footer>
              Our summary of the{" "}
              <a href="https://wasli.org/news/wfd-wasli-statement-use-signing-avatars/" target="_blank" rel="noreferrer">
                World Federation of the Deaf &amp; WASLI statement on signing avatars (2018)
              </a>
              , which DuoSign follows.
            </footer>
          </blockquote>
        </div>
      </section>

      <Reception />

      {/* 8 With not for */}
      <section className="ip-section rx-sec">
        <div className="ip-wrap rx-two">
          <div>
            <p className="rx-num">08 · With, not for</p>
            <h2>Next: Ghanaian Sign Language, built by Deaf Ghanaians.</h2>
            <p className="ip-body">
              We are seeking to work with the Ghana National Association of the Deaf, Deaf signers, and Ghanaian
              researchers already building sign-language data, with Ashesi University as a research home. Deaf signers
              will be paid contributors, and the community decides when it works.
            </p>
            <a className="ip-btn" href="mailto:nana.amoako@alumni.ashesi.edu.gh">Partner with us <ArrowRight size={18} weight="bold" /></a>
          </div>
          <CoDesignLoop />
        </div>
      </section>

      {/* Thesis + cite + sources */}
      <section className="ip-section rx-sec rx-white">
        <div className="ip-wrap rx-paper">
          <div className="rx-paper-card">
            <BookOpenText size={36} weight="duotone" />
            <h2>Read the full thesis.</h2>
            <p>DuoSign: A Gloss-Based Approach to Automated ASL Generation. Applied Project, B.Sc. Computer Science, Ashesi University, 2026. Outstanding Capstone Project award.</p>
            <Link href="/research/paper" className="ip-btn">Open the reader <ArrowRight size={18} weight="bold" /></Link>
          </div>
          <div>
            <h3 className="rx-h3">Cite this work</h3>
            <pre className="rx-bib">{BIBTEX}</pre>
            <h3 className="rx-h3">Sources on this page</h3>
            <ul className="rx-sources">
              {SOURCES.map((s) => <li key={s.u}><a href={s.u} target="_blank" rel="noreferrer">{s.t}</a></li>)}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
