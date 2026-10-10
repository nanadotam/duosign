"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteFooter from "@/widgets/site-footer/SiteFooter";

// Public pages get the full footer; the app keeps this compact one.
const SITE_ROUTES = ["/", "/how-it-works", "/research", "/get-involved"];

export default function Footer() {
  const pathname = usePathname();
  if (SITE_ROUTES.includes(pathname)) return <SiteFooter />;
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-[1300px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-text-3 text-center sm:text-left">
          &copy; 2026 Nana Kwaku Amoako &middot; Ashesi University
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/terms" className="text-xs text-text-3 hover:text-text-2 transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-xs text-text-3 hover:text-text-2 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/licenses" className="text-xs text-text-3 hover:text-text-2 transition-colors">
            Licenses
          </Link>
          <a
            href="https://github.com/dxli94/WLASL"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-3 hover:text-text-2 transition-colors"
          >
            WLASL Dataset
          </a>
        </nav>
      </div>
    </footer>
  );
}
