/**
 * Landing page content. Every statistic needs a source a reader can check.
 */

export interface ImpactStat {
  value: string;
  label: string;
  source: string;
}

export const IMPACT_STATS: ImpactStat[] = [
  {
    value: "70M",
    label: "Deaf people worldwide, using more than 300 sign languages",
    source: "World Federation of the Deaf",
  },
  {
    value: "430M",
    label: "people need rehabilitation for disabling hearing loss — nearly 80% of them in low- and middle-income countries",
    source: "World Health Organization fact sheet, March 2026",
  },
  {
    value: "Art. 21",
    label: "of the CRPD makes access to information in sign language a right",
    source: "UN Convention on the Rights of Persons with Disabilities",
  },
];

import type { JourneyStep } from "@/widgets/journey/Journey";

export const JOURNEY: JourneyStep[] = [
  {
    when: "Late 2025", icon: "question", title: "A simple question",
    body: "If I can call someone and talk in my own language, why does a Deaf person still have to read everything online? Why isn't digital content available in their primary language?",
  },
  {
    when: "2025–26", icon: "database", title: "Teaching a computer to sign",
    body: "11,980 videos of real signers from the WLASL research dataset were processed into body, hand and face motion for 2,000 American Sign Language signs, in about 76 minutes on a laptop.",
  },
  {
    when: "2025–26", icon: "cube", title: "The first DuoSign",
    body: "A rule-based engine rewrites English into sign order, and a 3D avatar in the browser signs it. Typing or speaking both work, with no install.",
  },
  {
    when: "Mar–Apr 2026", icon: "clipboard", tag: "Pilot", title: "Putting it in front of people",
    body: "Ashesi's accessibility team reviewed the signing, and early testers completed a usability study. Everyone said the same thing: easy to use, but the avatar must get clearer.",
  },
  {
    when: "May 2026", icon: "trophy", tag: "Award", title: "Outstanding Capstone Project",
    body: "At Ashesi's 2026 Quasar Awards, DuoSign received the Outstanding Capstone Project award in Computer Science & Information Systems.",
  },
  {
    when: "Sep 2026", icon: "film", tag: "Improvements", title: "Smarter, smoother signing",
    body: "Improvements to the translation algorithm, and a rebuilt signing engine that learns from NVIDIA's approach: motion captured from real signers is prepared ahead of time, so signs play smoothly, with facial expression.",
  },
  {
    when: "Oct 2026", icon: "rocket", tag: "Now", title: "DuoSign Beta opens",
    body: "Free and open to everyone while in beta. No account needed.",
  },
  {
    when: "Next", icon: "globe", next: true, title: "African sign languages, built with Deaf communities",
    body: "Seeking to work with the Ghana National Association of the Deaf to build and evaluate Ghanaian Sign Language with Deaf signers, then more of the continent's sign languages.",
  },
];

export interface ResearchRef {
  title: string;
  note: string;
  url?: string;
}

export const RESEARCH_REFS: ResearchRef[] = [
  {
    title: "UN Convention on the Rights of Persons with Disabilities",
    note: "Articles 9 (accessibility) and 21 (access to information)",
    url: "https://www.un.org/development/desa/disabilities/convention-on-the-rights-of-persons-with-disabilities.html",
  },
  {
    title: "United Nations Disability Inclusion Strategy (UNDIS)",
    note: "Partnerships and procurement provisions",
    url: "https://www.un.org/en/disabilitystrategy",
  },
  {
    title: "WHO: Deafness and hearing loss",
    note: "Global prevalence fact sheet",
    url: "https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss",
  },
  {
    title: "World Federation of the Deaf",
    note: "Sign language rights and statistics",
    url: "https://wfdeaf.org/our-work/",
  },
  {
    title: "Li et al., WLASL: Word-Level American Sign Language dataset (WACV 2020)",
    note: "The sign data behind today's ASL beta",
    url: "https://dxli94.github.io/WLASL/",
  },
];

/** Verbatim from the pilot survey (anonymised); see the thesis, section 5.6. */
export const TESTER_QUOTES: string[] = [
  "It's such a lovely UI. I think it's clean and smooth and you don't need so much guidance.",
  "I really appreciate that I can use it to learn sign language at my own pace.",
  "I like how the breakdown of the words and letters is visible.",
];
