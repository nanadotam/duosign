import type { Metadata } from "next";
import Link from "next/link";
import NavigationBar from "@/widgets/navigation-bar/NavigationBar";

export const metadata: Metadata = {
  title: "Third-Party Licenses & Attributions",
  description: "DuoSign third-party licenses, open-source attributions, and WLASL dataset citation.",
};

interface LicenseCardProps {
  name: string;
  creator: string;
  license: string;
  url: string;
  description?: string;
}

function LicenseCard({ name, creator, license, url, description }: LicenseCardProps) {
  return (
    <div className="bg-surface-2 border border-border rounded-panel p-4 mb-4">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
        <h3 className="text-base font-semibold text-text-1">{name}</h3>
        <span className="text-xs font-mono bg-surface-3 border border-border px-2 py-0.5 rounded text-text-2 whitespace-nowrap">
          {license}
        </span>
      </div>
      <p className="text-sm text-text-2 mb-1">by {creator}</p>
      {description && <p className="text-sm text-text-2 mb-2">{description}</p>}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-accent hover:underline font-mono"
      >
        {url}
      </a>
    </div>
  );
}

export default function LicensesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-mono text-text-3 uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl font-serif font-bold text-text-1 mb-2">Third-Party Licenses & Attributions</h1>
          <p className="text-sm text-text-2">
            DuoSign is built on open datasets and open-source software. Full attributions are listed below.
          </p>
        </div>

        {/* WLASL — prominent, first */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-text-1 mb-4 pb-2 border-b border-border">
            Dataset — WLASL
          </h2>

          <div className="bg-surface-2 border border-accent/30 rounded-panel p-5 mb-4">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <h3 className="text-base font-semibold text-text-1">
                Word-Level American Sign Language (WLASL)
              </h3>
              <span className="text-xs font-mono bg-accent/10 border border-accent/30 px-2 py-0.5 rounded text-accent whitespace-nowrap">
                C-UDA v1.0
              </span>
            </div>
            <p className="text-sm text-text-2 mb-1">
              Created by: Dongxu Li, Cristian Rodriguez, Xin Yu, Hongdong Li (Australian National University)
            </p>
            <p className="text-sm text-text-2 mb-3">
              The sign motion data and pose sequences used in DuoSign are derived from the WLASL dataset.
              By using DuoSign, you become a Downstream Recipient under the C-UDA and agree to use this
              data for <strong>Computational Use only</strong> — academic, educational, and non-commercial purposes.
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              <a
                href="https://github.com/dxli94/WLASL"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline font-mono"
              >
                github.com/dxli94/WLASL
              </a>
              <a
                href="https://cdla.dev/computational-use-of-data-agreement-v1-0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline font-mono"
              >
                C-UDA v1.0 full text
              </a>
            </div>

            <div className="bg-surface border border-border rounded p-4">
              <p className="text-xs font-mono text-text-3 uppercase tracking-widest mb-2">Required Citation</p>
              <pre className="text-xs text-text-2 whitespace-pre-wrap font-mono leading-relaxed">
{`@inproceedings{li2020word,
  title={Word-level Deep Sign Language Recognition from Video:
         A New Large-scale Dataset and Methods Comparison},
  author={Li, Dongxu and Rodriguez, Cristian and Yu, Xin and Li, Hongdong},
  booktitle={The IEEE Winter Conference on Applications of Computer Vision},
  pages={1459--1469},
  year={2020}
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Avatar & 3D */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-text-1 mb-4 pb-2 border-b border-border">
            Avatar & 3D
          </h2>
          <LicenseCard
            name="@pixiv/three-vrm & VRM Format"
            creator="pixiv Inc."
            license="MIT"
            url="https://github.com/pixiv/three-vrm"
            description="VRM 3D avatar format and Three.js integration used for all signing avatars."
          />
          <LicenseCard
            name="Kalidokit"
            creator="yeemachine"
            license="MIT"
            url="https://github.com/yeemachine/kalidokit"
            description="Pose and face retargeting library for VRM avatar animation."
          />
          <LicenseCard
            name="MediaPipe Tasks"
            creator="Google LLC"
            license="Apache 2.0"
            url="https://github.com/google-ai-edge/mediapipe"
            description="Hand, face, and pose landmark detection for avatar motion."
          />
          <LicenseCard
            name="Three.js"
            creator="mrdoob and contributors"
            license="MIT"
            url="https://github.com/mrdoob/three.js"
            description="3D rendering engine powering the avatar canvas."
          />
        </section>

        {/* NLP & Backend */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-text-1 mb-4 pb-2 border-b border-border">
            NLP & Backend
          </h2>
          <LicenseCard
            name="spaCy"
            creator="Explosion AI"
            license="MIT"
            url="https://spacy.io"
            description="NLP library used for English text processing and gloss conversion."
          />
          <LicenseCard
            name="FastAPI"
            creator="Sebastián Ramírez"
            license="MIT"
            url="https://fastapi.tiangolo.com"
            description="Python web framework powering the DuoSign translation API."
          />
          <LicenseCard
            name="FFmpeg"
            creator="FFmpeg contributors"
            license="LGPL v2.1+ / GPL v2+"
            url="https://ffmpeg.org/legal.html"
            description="Used for MP4 video export and codec operations."
          />
        </section>

        {/* Frontend */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-text-1 mb-4 pb-2 border-b border-border">
            Frontend
          </h2>
          <LicenseCard
            name="Next.js"
            creator="Vercel Inc."
            license="MIT"
            url="https://nextjs.org"
            description="React framework for the DuoSign web application."
          />
          <LicenseCard
            name="Tailwind CSS"
            creator="Tailwind Labs"
            license="MIT"
            url="https://tailwindcss.com"
            description="Utility-first CSS framework used throughout the UI."
          />
          <LicenseCard
            name="react-hook-form"
            creator="react-hook-form contributors"
            license="MIT"
            url="https://react-hook-form.com"
            description="Form state and validation library."
          />
        </section>

        <div className="border-t border-border pt-6 mt-10 flex flex-wrap gap-4 text-sm text-text-3">
          <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link>
          <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
          <a href="https://cdla.dev/computational-use-of-data-agreement-v1-0/" target="_blank" rel="noopener noreferrer" className="hover:underline">C-UDA v1.0</a>
        </div>
      </main>
    </div>
  );
}
