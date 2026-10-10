"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { List, X } from "@phosphor-icons/react";
import "./site-nav.css";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/#journey", label: "Journey" },
  { href: "/research", label: "Research" },
  { href: "/#recognition", label: "Recognition" },
];

/** Sticky marketing navigation shared by the landing, how-it-works and research pages. */
export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={`sn ${scrolled ? "sn-scrolled" : ""}`}>
      <div className="sn-inner">
        <Link href="/" className="sn-brand" aria-label="DuoSign Beta home">
          <Image src="/logos/DuoSign_logomark.svg" alt="" width={26} height={26} className="sn-logo" />
          <span>DuoSign</span>
          <small>Beta</small>
        </Link>
        <nav aria-label="Main" className={open ? "sn-open" : ""}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
          <Link href="/translate" className="sn-cta sn-cta-mobile">Try the beta</Link>
        </nav>
        <div className="sn-right">
          <Link href="/translate" className="sn-cta">Try the beta</Link>
          <button className="sn-burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X size={22} /> : <List size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}
