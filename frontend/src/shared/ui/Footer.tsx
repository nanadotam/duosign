import Link from "next/link";

export default function Footer() {
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
