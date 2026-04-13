import React from "react";

import { FAQSection } from "../components/landing/FAQSection";
import { Hero } from "../components/landing/Hero";
import { IndustrySection } from "../components/landing/IndustrySection";

export default function LandingPage() {
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
      <Hero />
      <IndustrySection />
      <FAQSection />
    </main>
  );
}
