import React from "react";
import { Header } from "../layout/Header";
import { Footer } from "../layout/Footer";

type InfoSection = {
  title: string;
  paragraphs: string[];
};

type InfoPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: InfoSection[];
};

export function InfoPageLayout({
  eyebrow,
  title,
  description,
  updatedAt,
  sections,
}: InfoPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header isAuthenticated={false} currentEmail="" activePath="" />

      <main className="relative flex-grow overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f3f4615_1px,transparent_1px),linear-gradient(to_bottom,#3f3f4615_1px,transparent_1px)] bg-[size:44px_44px] opacity-20 pointer-events-none"></div>

        <div className="relative z-10 mx-auto w-full max-w-4xl px-8 py-20">
          <div className="mb-12 rounded-3xl border border-outline-variant/30 bg-surface-container-low/70 p-8 shadow-2xl shadow-black/30 backdrop-blur-sm">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              <span className="material-symbols-outlined text-[14px]">policy</span>
              {eyebrow}
            </div>
            <h1 className="mb-4 text-4xl font-extrabold tracking-tighter text-on-surface md:text-6xl">
              {title}
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant">
              {description}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-outline-variant/30 bg-[#09090b] px-3 py-1 text-[11px] uppercase tracking-widest text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              最近更新：{updatedAt}
            </div>
          </div>

          <div className="space-y-5">
            {sections.map((section) => (
              <section
                key={section.title}
                className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/80 p-7 shadow-lg shadow-black/20"
              >
                <div className="mb-4 flex items-center gap-3 border-b border-outline-variant/15 pb-4">
                  <div className="h-8 w-1 rounded-full bg-primary"></div>
                  <h2 className="text-xl font-bold tracking-tight text-on-surface">
                    {section.title}
                  </h2>
                </div>
                <div className="space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="leading-relaxed text-on-surface-variant">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
