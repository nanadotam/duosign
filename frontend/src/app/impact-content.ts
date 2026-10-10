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

export interface TimelineItem {
  when: string;
  title: string;
  body: string;
}

export const TIMELINE: TimelineItem[] = [
  {
    when: "2025–26",
    title: "A capstone at Ashesi University",
    body: "A working text-to-sign system, reviewed by Ashesi's accessibility team and piloted with early testers.",
  },
  {
    when: "2026",
    title: "Outstanding Capstone Project Award",
    body: "Ashesi's top capstone award for Computer Science.",
  },
  {
    when: "Jul 2026",
    title: "African Disability Forum",
    body: "A conversation with Shuaib Chalklen, head of the African Disability Forum, on taking DuoSign further across the continent.",
  },
  {
    when: "Oct 2026",
    title: "UNECA Disability Inclusion Desk",
    body: "Introduced through Christina Abraham, DuoSign was taken up by staff with disabilities at the UN Economic Commission for Africa and shared with colleagues across the Commission.",
  },
  {
    when: "Oct 2026",
    title: "DuoSign Pro beta",
    body: "Ghanaian signers, smoother motion captured from real signers, facial expression, and the full fingerspelling alphabet.",
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
