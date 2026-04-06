import Link from "next/link";
import { CONSENT_DOCUMENTS, type ConsentAudience } from "@/features/testing-mode/lib/consentContent";
import { DUOSIGN_VERSION } from "@/features/testing-mode/lib/researchConfig";

const AUDIENCE_ORDER: ConsentAudience[] = ["hearing", "deaf_hoh", "combined"];

function normalizeAudience(value?: string): ConsentAudience {
  if (value === "hearing" || value === "deaf_hoh" || value === "combined") {
    return value;
  }
  return "combined";
}

export default function ConsentPage({
  searchParams,
}: {
  searchParams?: { audience?: string };
}) {
  const activeAudience = normalizeAudience(searchParams?.audience);
  const document = CONSENT_DOCUMENTS[activeAudience];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(91,142,240,0.16),transparent_30%),linear-gradient(180deg,#10131b_0%,#151925_100%)] text-text-1">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-[color-mix(in_srgb,var(--accent)_20%,var(--border-hi))] bg-[linear-gradient(180deg,rgba(20,24,35,0.96),rgba(16,19,28,0.99))] shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
          <div className="border-b border-white/8 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-[var(--font-jetbrains)] text-[11px] uppercase tracking-[0.22em] text-accent/90">
                  DuoSign Research Study {DUOSIGN_VERSION}
                </p>
                <h1 className="mt-2 font-[var(--font-instrument)] text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                  Informed Consent Form
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:rgba(234,238,246,0.76)]">
                  Styled for on-site review and adapted from the supplied study
                  documents. Switch audience views below to read the relevant
                  participant version.
                </p>
              </div>
              <Link
                href="/translate?testing=1"
                className="inline-flex h-11 items-center justify-center rounded-btn border border-border-hi bg-surface-2 px-4 text-sm font-medium text-text-1 no-underline transition-all hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--border-hi))] hover:bg-surface-3"
              >
                Back to study entry
              </Link>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
            <aside className="border-b border-white/8 p-5 lg:border-b-0 lg:border-r">
              <p className="font-[var(--font-jetbrains)] text-[11px] uppercase tracking-[0.18em] text-text-3">
                Audience
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {AUDIENCE_ORDER.map((audience) => {
                  const item = CONSENT_DOCUMENTS[audience];
                  const isActive = audience === activeAudience;
                  return (
                    <Link
                      key={audience}
                      href={`/research/consent?audience=${audience}`}
                      className={[
                        "rounded-[18px] border px-4 py-3 no-underline transition-all",
                        isActive
                          ? "border-accent/45 bg-accent/10 text-white"
                          : "border-border bg-surface-2 text-text-2 hover:border-border-hi hover:text-text-1",
                      ].join(" ")}
                    >
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 text-xs text-text-3">
                        {item.participantLabel}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </aside>

            <section className="px-6 py-6 sm:px-8">
              <div className="mb-6 rounded-[22px] border border-white/8 bg-white/[0.03] p-5">
                <p className="font-[var(--font-jetbrains)] text-[11px] uppercase tracking-[0.18em] text-text-3">
                  Participant group
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  {document.participantLabel}
                </p>
                <p className="mt-3 text-sm leading-7 text-text-3">
                  Research Study: DuoSign: A Two-Way Sign Language Translation
                  Framework Using ML and Motion Synthesis
                </p>
                <p className="text-sm leading-7 text-text-3">
                  Principal Investigator: Nana Kwaku Amoako
                </p>
                <p className="text-sm leading-7 text-text-3">
                  Faculty Supervisor: Kwabena Bamfo
                </p>
              </div>

              <div className="space-y-5">
                {document.sections.map((section) => (
                  <article
                    key={section.title}
                    className="rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.025)] p-5"
                  >
                    <h2 className="font-[var(--font-instrument)] text-2xl text-white">
                      {section.title}
                    </h2>
                    {section.paragraphs?.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="mt-3 text-sm leading-7 text-[color:rgba(234,238,246,0.8)]"
                      >
                        {paragraph}
                      </p>
                    ))}
                    {section.bullets && (
                      <ul className="mt-4 space-y-2">
                        {section.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="rounded-[16px] border border-white/6 bg-black/15 px-4 py-3 text-sm leading-6 text-[color:rgba(242,245,251,0.88)]"
                          >
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
