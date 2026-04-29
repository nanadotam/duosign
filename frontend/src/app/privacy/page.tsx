import type { Metadata } from "next";
import Link from "next/link";
import NavigationBar from "@/widgets/navigation-bar/NavigationBar";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "DuoSign Privacy Policy — what data we collect, how it's used, and your rights.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-mono text-text-3 uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl font-serif font-bold text-text-1 mb-2">Privacy Policy</h1>
          <p className="text-sm text-text-2">Last Updated: May 2026</p>
        </div>

        <div className="prose-legal">

          <section className="mb-8">
            <p>
              DuoSign is committed to collecting only the minimum data necessary for the Service to operate.
              This policy explains what data is collected, how it is used, and your rights.
            </p>
          </section>

          <section className="mb-8">
            <h2>1. Who We Are</h2>
            <p>
              DuoSign is an academic web application developed by Nana Kwaku Amoako at Ashesi University.
              It is not a commercial product. References to &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo; refer
              to the developer and the project.
            </p>
          </section>

          <section className="mb-8">
            <h2>2. Data We Collect</h2>

            <h3>2.1 Guest Users</h3>
            <div className="overflow-x-auto mb-4">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Why</th>
                    <th>Retention</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Session identifier (browser-local)</td>
                    <td>To track guest translation count and enforce usage limits</td>
                    <td>Stored in your browser only; not on our servers</td>
                  </tr>
                  <tr>
                    <td>Translation text (typed or voice-transcribed)</td>
                    <td>To produce ASL animation output</td>
                    <td>Processed in memory; not stored on our servers</td>
                  </tr>
                  <tr>
                    <td>Audio files (uploaded for transcription)</td>
                    <td>To transcribe via Groq Whisper API</td>
                    <td>Discarded immediately after transcription; not stored</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>2.2 Registered Users</h3>
            <div className="overflow-x-auto mb-4">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Why</th>
                    <th>Retention</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Email address</td>
                    <td>Account creation and authentication</td>
                    <td>Stored until account deletion</td>
                  </tr>
                  <tr>
                    <td>Password (hashed, never plaintext)</td>
                    <td>Account authentication</td>
                    <td>Stored until account deletion</td>
                  </tr>
                  <tr>
                    <td>Translation history (text and metadata)</td>
                    <td>To power the history, replay, and export features</td>
                    <td>Stored until the user deletes entries or their account</td>
                  </tr>
                  <tr>
                    <td>Authentication tokens (HttpOnly cookies)</td>
                    <td>To maintain login sessions securely</td>
                    <td>Cleared on logout or session expiry</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>2.3 Data We Do Not Collect</h3>
            <ul>
              <li>We do not collect your name, phone number, address, or any biometric data</li>
              <li>We do not collect browser fingerprints or tracking cookies</li>
              <li>We do not use advertising cookies or third-party analytics trackers</li>
              <li>We do not store audio, images, or raw voice data after a request is processed</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>3. Third-Party Services</h2>
            <p>DuoSign uses the following third-party services which may process data on our behalf:</p>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Purpose</th>
                    <th>Their Privacy Policy</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Supabase</td>
                    <td>Database and file storage</td>
                    <td><a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a></td>
                  </tr>
                  <tr>
                    <td>Vercel</td>
                    <td>Frontend hosting</td>
                    <td><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a></td>
                  </tr>
                  <tr>
                    <td>Render</td>
                    <td>Backend API hosting</td>
                    <td><a href="https://render.com/privacy" target="_blank" rel="noopener noreferrer">render.com/privacy</a></td>
                  </tr>
                  <tr>
                    <td>Groq API</td>
                    <td>Audio transcription (Whisper)</td>
                    <td><a href="https://groq.com/privacy-policy" target="_blank" rel="noopener noreferrer">groq.com/privacy-policy</a></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              Audio submitted for transcription is sent to Groq&apos;s API and subject to their data handling
              policies. Audio is not retained by Groq for training purposes under their standard API terms.
            </p>
          </section>

          <section className="mb-8">
            <h2>4. WLASL Data and CDN Assets</h2>
            <p>
              The motion data and video assets served by DuoSign are derived from the WLASL dataset
              (C-UDA licensed). These assets are not personal data. Access to these assets through the
              Service constitutes acceptance of the C-UDA terms as described in the{" "}
              <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link>.
            </p>
            <p>
              Unauthorised access to CDN-hosted assets &mdash; including accessing storage bucket URLs
              directly &mdash; is prohibited and not covered by any data use agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access</strong> the data we hold about you (your email and translation history)</li>
              <li><strong>Delete</strong> your account and all associated data at any time through the account settings page</li>
              <li><strong>Export</strong> your translation history before deletion</li>
              <li><strong>Correct</strong> your email address through account settings</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:sorotechnologies@protonmail.com" className="text-accent hover:underline">
                sorotechnologies@protonmail.com
              </a>{" "}
              or use the in-app account management features.
            </p>
          </section>

          <section className="mb-8">
            <h2>6. Security</h2>
            <ul>
              <li>Passwords are stored using industry-standard irreversible hashing (bcrypt)</li>
              <li>Session tokens are stored in HttpOnly cookies inaccessible to browser JavaScript</li>
              <li>API endpoints enforce per-user rate limits to prevent misuse</li>
              <li>Supabase Storage buckets are access-controlled; media assets are served through the application layer</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>7. Children&apos;s Privacy</h2>
            <p>
              DuoSign is not directed at children under the age of 13. We do not knowingly collect data
              from children under 13. If you believe a child has provided us with personal data, contact
              us and we will delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2>8. Changes to This Policy</h2>
            <p>
              We may update this policy. Continued use of the Service after an update constitutes acceptance
              of the revised policy. We will note the &ldquo;Last Updated&rdquo; date at the top of this page.
            </p>
          </section>

          <section className="mb-8">
            <h2>9. Contact</h2>
            <div className="bg-surface-2 border border-border rounded-panel p-4">
              <p className="text-sm text-text-1 font-semibold">Nana Kwaku Amoako</p>
              <p className="text-sm text-text-2">Department of Computer Science &amp; Information Systems, Ashesi University</p>
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
          <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link>
          <Link href="/licenses" className="text-accent hover:underline">Third-Party Licenses</Link>
        </div>
      </main>
    </div>
  );
}
