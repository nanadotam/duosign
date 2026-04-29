import type { Metadata } from "next";
import Link from "next/link";
import NavigationBar from "@/widgets/navigation-bar/NavigationBar";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "DuoSign Terms of Service — including WLASL C-UDA license obligations for all users.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-mono text-text-3 uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl font-serif font-bold text-text-1 mb-2">Terms of Service</h1>
          <p className="text-sm text-text-2">Last Updated: May 2026 · Effective upon first use</p>
        </div>

        <div className="prose-legal">

          <section className="mb-8">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using DuoSign (&ldquo;the Service,&rdquo; &ldquo;the Software&rdquo;), whether as a guest
              or as a registered user, you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do
              not agree to these Terms, you must not use the Service.
            </p>
            <p>
              These Terms apply to all users of DuoSign, including guest users who have not created an account.
            </p>
          </section>

          <section className="mb-8">
            <h2>2. Description of Service</h2>
            <p>
              DuoSign is a web-based English-to-American Sign Language (ASL) translation system developed as
              an academic applied project at Ashesi University. It converts English text and voice input into
              animated ASL avatar output using a three-stage pipeline: text-to-gloss conversion, pose data
              retrieval, and 3D avatar animation.
            </p>
            <p>
              The Service is provided for <strong>academic, educational, accessibility, and non-commercial
              research purposes only.</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2>3. Permitted Use</h2>
            <p>You may use DuoSign to:</p>
            <ul>
              <li>Translate English text or voice input into ASL avatar animations for personal, educational, or accessibility purposes</li>
              <li>Export translated animations as MP4 video files for non-commercial use (authenticated users only)</li>
              <li>Access the Service&apos;s REST API endpoints for non-commercial research or integration purposes, subject to rate limits</li>
            </ul>
            <p>You may not use DuoSign to:</p>
            <ul>
              <li>Reproduce, download, scrape, copy, or redistribute any sign motion data, video files, pose data, or assets served through the Service&apos;s CDN or storage infrastructure</li>
              <li>Reverse-engineer, decompile, or extract the underlying motion data or pose sequences from the Service</li>
              <li>Use the Service or any data derived from it for commercial purposes without prior written permission from the developer</li>
              <li>Access any CDN-hosted media assets, storage bucket URLs, or API endpoints outside of the normal operation of the DuoSign web application</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>4. WLASL Dataset — Third-Party License Obligations</h2>
            <p>
              DuoSign uses motion data derived from the{" "}
              <strong>Word-Level American Sign Language (WLASL) dataset</strong>, created by Dongxu Li,
              Cristian Rodriguez, Xin Yu, and Hongdong Li (Australian National University). The WLASL dataset
              is licensed under the{" "}
              <strong>Computational Use of Data Agreement v1.0 (C-UDA)</strong>.
            </p>
            <p>By using DuoSign, you acknowledge and agree that:</p>
            <ul>
              <li>
                <strong>4.1.</strong> The sign motion data and any pose sequences served by DuoSign are derived
                from the WLASL dataset and are subject to the C-UDA v1.0 license terms.
              </li>
              <li>
                <strong>4.2.</strong> You are a <em>Downstream Recipient</em> of WLASL-derived data as defined
                in C-UDA §5.4 and are bound by the C-UDA&apos;s terms with respect to any such data you access
                through DuoSign.
              </li>
              <li>
                <strong>4.3.</strong> Your use of any WLASL-derived data accessed through DuoSign is limited
                to <em>Computational Use</em> as defined in C-UDA §5.1: &ldquo;activities necessary to enable the
                use of Data (alone or along with other material) for analysis by a computer.&rdquo;
              </li>
              <li>
                <strong>4.4.</strong> You may not redistribute, republish, or make available to any third party
                any WLASL-derived data accessed through DuoSign without binding those recipients to the C-UDA.
              </li>
              <li>
                <strong>4.5.</strong> The full text of the C-UDA v1.0 is available at:{" "}
                <a href="https://cdla.dev/computational-use-of-data-agreement-v1-0/" target="_blank" rel="noopener noreferrer">
                  cdla.dev/computational-use-of-data-agreement-v1-0
                </a>
              </li>
              <li>
                <strong>4.6.</strong> The WLASL dataset repository and citation information is available at:{" "}
                <a href="https://github.com/dxli94/WLASL" target="_blank" rel="noopener noreferrer">
                  github.com/dxli94/WLASL
                </a>
              </li>
            </ul>
            <div className="bg-surface-2 border border-border rounded-panel p-4 mt-4">
              <p className="text-xs font-mono text-text-3 uppercase tracking-widest mb-2">Required Citation (C-UDA §3.1.1)</p>
              <p className="text-sm text-text-2 italic">
                Li, Dongxu, Cristian Rodriguez, Xin Yu, and Hongdong Li. &ldquo;Word-level Deep Sign Language
                Recognition from Video: A New Large-scale Dataset and Methods Comparison.&rdquo;{" "}
                <em>Proceedings of the IEEE/CVF Winter Conference on Applications of Computer Vision (WACV)</em>,
                2020, pp. 1459&ndash;1469.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2>5. Unauthorised Access to CDN and Storage</h2>
            <p>
              DuoSign&apos;s media assets &mdash; including video files, pose binary files, and avatar models &mdash;
              are hosted on Supabase Storage and delivered via CDN. These assets constitute WLASL-derived data
              subject to the C-UDA.
            </p>
            <p>
              <strong>Any access to these assets outside of the normal operation of the DuoSign web application
              is explicitly prohibited.</strong> This includes, but is not limited to:
            </p>
            <ul>
              <li>Directly accessing storage bucket URLs or CDN-hosted file paths</li>
              <li>Scraping or crawling media asset endpoints</li>
              <li>Using leaked, shared, or discovered asset URLs to access data without agreeing to these Terms</li>
            </ul>
            <p>
              Unauthorised access to CDN-hosted assets does not constitute permitted Computational Use and is
              not covered by any license, whether the C-UDA or otherwise.
            </p>
          </section>

          <section className="mb-8">
            <h2>6. Account Registration and Guest Use</h2>
            <ul>
              <li><strong>6.1.</strong> Guest users may perform up to a configurable number of translations per session without creating an account.</li>
              <li><strong>6.2.</strong> To access features including unlimited translation, history management, and MP4 export, users must create an account and agree to these Terms.</li>
              <li><strong>6.3.</strong> You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li><strong>6.4.</strong> You must not create an account on behalf of another person without their consent.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>7. Privacy and Data Collection</h2>
            <p>
              Your use of DuoSign is also governed by the{" "}
              <Link href="/privacy" className="text-accent hover:underline">DuoSign Privacy Policy</Link>,
              incorporated into these Terms by reference. Key principles:
            </p>
            <ul>
              <li>DuoSign collects only the minimum data necessary for the Service to function.</li>
              <li>Audio and image data submitted for transcription is discarded by the server immediately after the request is processed.</li>
              <li>Translation text is stored only to provide authenticated users with their history. Guest translations are not stored server-side.</li>
              <li>DuoSign does not sell, share, or transfer user data to third parties for commercial purposes.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>8. Intellectual Property</h2>
            <ul>
              <li><strong>8.1.</strong> DuoSign, its codebase, design, and documentation are the intellectual property of Nana Kwaku Amoako and Ashesi University, developed as an academic applied project.</li>
              <li><strong>8.2.</strong> The WLASL dataset and all pose data derived from it remain the property of their respective owners and are used under the C-UDA. DuoSign makes no ownership claim over this data.</li>
              <li><strong>8.3.</strong> The VRM avatar models used in DuoSign are used under their respective open licenses. See <Link href="/licenses" className="text-accent hover:underline">/licenses</Link> for full attribution.</li>
              <li><strong>8.4.</strong> The spaCy NLP library, Kalidokit, MediaPipe, and all other open-source dependencies are used under their respective licenses. See <Link href="/licenses" className="text-accent hover:underline">/licenses</Link> for full attribution.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>9. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind,
              express or implied. The developer does not warrant that:
            </p>
            <ul>
              <li>The Service will be uninterrupted, error-free, or secure</li>
              <li>ASL translations will be linguistically accurate or appropriate for all contexts</li>
              <li>The avatar animations accurately represent the full phonological or grammatical content of any sign</li>
            </ul>
            <p className="font-semibold">
              DuoSign is an academic prototype. It is not a certified accessibility tool and should not be
              used as the sole means of communication in high-stakes or safety-critical contexts.
            </p>
          </section>

          <section className="mb-8">
            <h2>10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, the developer shall not be liable for any
              indirect, incidental, special, or consequential damages arising from your use of the Service,
              including but not limited to reliance on translation output, loss of data, or unauthorised
              access to stored data.
            </p>
          </section>

          <section className="mb-8">
            <h2>11. Changes to Terms</h2>
            <p>
              These Terms may be updated from time to time. Continued use of the Service after any change
              constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2>12. Contact</h2>
            <p>For questions about these Terms, licensing, or the WLASL attribution requirements, contact:</p>
            <div className="bg-surface-2 border border-border rounded-panel p-4">
              <p className="text-sm text-text-1 font-semibold">Nana Kwaku Amoako</p>
              <p className="text-sm text-text-2">Department of Computer Science &amp; Information Systems</p>
              <p className="text-sm text-text-2">Ashesi University</p>
              <p className="text-sm text-text-2">
                Email:{" "}
                <a href="mailto:sorotechnologies@protonmail.com" className="text-accent hover:underline">
                  sorotechnologies@protonmail.com
                </a>
              </p>
            </div>
          </section>

        </div>

        <div className="border-t border-border pt-6 mt-10 flex flex-wrap gap-4 text-sm text-text-3">
          <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
          <Link href="/licenses" className="text-accent hover:underline">Third-Party Licenses</Link>
          <a href="https://cdla.dev/computational-use-of-data-agreement-v1-0/" target="_blank" rel="noopener noreferrer" className="hover:underline">C-UDA v1.0</a>
          <a href="https://github.com/dxli94/WLASL" target="_blank" rel="noopener noreferrer" className="hover:underline">WLASL Dataset</a>
        </div>
      </main>
    </div>
  );
}
