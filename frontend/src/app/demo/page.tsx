import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Handshake } from "@phosphor-icons/react/dist/ssr";
import SiteNav from "@/widgets/site-nav/SiteNav";
import "../impact.css";

export const metadata: Metadata = {
  title: "Demo",
  description: "Watch DuoSign sign a YouTube video in a small window, and translate a typed sentence into sign language.",
  alternates: { canonical: "/demo" },
};

export default function DemoPage() {
  return (
    <main className="ip">
      <SiteNav />
      <section className="ip-section ip-demo" style={{ paddingTop: 140 }}>
        <div className="ip-wrap">
          <div className="ip-demo-head">
            <div>
              <p className="ip-eyebrow">Demo</p>
              <h2>DuoSign, signing online video.</h2>
            </div>
            <Link href="/translate" className="ip-btn">Try the beta <ArrowRight size={18} weight="bold" /></Link>
          </div>
          <figure className="ip-video">
            <div className="ip-video-chrome" aria-hidden="true"><i /><i /><i /><span>duosign — prototype</span></div>
            <video
              src="/landing/youtube_pip_demo.mp4"
              poster="/landing/youtube_pip_poster.webp"
              controls playsInline preload="metadata"
              style={{ aspectRatio: "16 / 9", objectFit: "contain" }}
              aria-label="Prototype: DuoSign signing a YouTube video in a small window"
            />
          </figure>
          <p className="ip-demo-cap">Prototype: DuoSign signing a YouTube video in a small window.</p>
        </div>
      </section>
      <section className="ip-section ip-demo">
        <div className="ip-wrap">
          <div className="ip-demo-head">
            <h2>Type a sentence, watch it signed.</h2>
            <Link href="/get-involved?type=partner" className="ip-btn ip-btn-ghost"><Handshake size={18} weight="duotone" /> Partner with us</Link>
          </div>
          <figure className="ip-video">
            <div className="ip-video-chrome" aria-hidden="true"><i /><i /><i /><span>duosign — beta</span></div>
            <video src="/landing/demo.mp4" poster="/landing/demo_poster.webp" controls muted loop playsInline preload="metadata"
              aria-label="Screen recording: a sentence is typed into DuoSign and “Ama” signs it" />
          </figure>
          <p className="ip-demo-cap">Real screen recording of DuoSign Beta.</p>
        </div>
      </section>
    </main>
  );
}
