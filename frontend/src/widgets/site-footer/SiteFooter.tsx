import Link from "next/link";
import Image from "next/image";
import { EnvelopeSimple, MapPin } from "@phosphor-icons/react/dist/ssr";
import "./site-footer.css";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/translate", label: "Try the beta" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/guide", label: "User guide" },
      { href: "/status", label: "System status" },
      { href: "/get-involved?type=partner", label: "Partner with us" },
    ],
  },
  {
    title: "Research",
    links: [
      { href: "/get-involved?type=research", label: "Request the thesis" },
      { href: "/research#received", label: "How it was received" },
      { href: "/#journey", label: "Our journey" },
      { href: "https://github.com/dxli94/WLASL", label: "WLASL dataset", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/licenses", label: "Licenses & credits" },
    ],
  },
];

/** Full footer for the public pages (landing, how it works, research). */
export default function SiteFooter() {
  return (
    <footer className="sf">
      <div className="sf-inner">
        <div className="sf-top">
          <div className="sf-brand">
            <Link href="/" className="sf-logo" aria-label="DuoSign home">
              <Image src="/logos/DuoSign_logo.svg" alt="DuoSign" width={190} height={58} />
            </Link>
            <p>
              Sign language for the digital world. DuoSign turns text and speech into sign language, signed by
              avatars that look like the people who use them.
            </p>
            <ul className="sf-contact">
              <li><EnvelopeSimple size={18} weight="duotone" /><a href="mailto:nana.amoako@alumni.ashesi.edu.gh">nana.amoako@alumni.ashesi.edu.gh</a></li>
              <li><MapPin size={18} weight="duotone" /><span>Built in Ghana · Ashesi University</span></li>
            </ul>
          </div>
          {COLUMNS.map((c) => (
            <nav key={c.title} className="sf-col" aria-label={c.title}>
              <h3>{c.title}</h3>
              <ul>
                {c.links.map((l) =>
                  "external" in l && l.external ? (
                    <li key={l.href}><a href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a></li>
                  ) : (
                    <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
                  )
                )}
              </ul>
            </nav>
          ))}
        </div>
        <div className="sf-word" aria-hidden="true">DuoSign</div>
        <div className="sf-bottom">
          <span>© 2026 Nana Kwaku Amoako · DuoSign Beta</span>
          <span>
            American Sign Language today · sign data from the WLASL research dataset (non-commercial use) · not a
            replacement for qualified interpreters
          </span>
        </div>
      </div>
    </footer>
  );
}
