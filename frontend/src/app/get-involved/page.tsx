import { Suspense } from "react";
import type { Metadata } from "next";
import SiteNav from "@/widgets/site-nav/SiteNav";
import GetInvolvedForm from "./GetInvolvedForm";
import "../impact.css";
import "./get-involved.css";

export const metadata: Metadata = {
  title: "Get involved",
  description: "Partner with DuoSign, or request the full DuoSign research thesis.",
};

export default function GetInvolvedPage() {
  return (
    <main className="ip gi">
      <SiteNav />
      <section className="gi-hero">
        <div className="ip-wrap gi-layout">
          <div className="gi-side">
            <p className="ip-eyebrow">Get involved</p>
            <h1>Build it with us.</h1>
            <p className="ip-lede">
              DuoSign grows through partners: Deaf organisations, signers and interpreters, researchers, funders and
              institutions that publish information people need.
            </p>
            <ul className="gi-ways">
              <li><b>Deaf organisations &amp; signers</b><span>Lead the next sign languages, as paid contributors.</span></li>
              <li><b>Institutions</b><span>Pilot DuoSign on your videos, pages and webinars.</span></li>
              <li><b>Funders &amp; donors</b><span>Help record Ghanaian Sign Language with Deaf signers.</span></li>
              <li><b>Researchers</b><span>Collaborate, or request the full thesis.</span></li>
            </ul>
          </div>
          <Suspense fallback={<div className="gi-card" />}>
            <GetInvolvedForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
