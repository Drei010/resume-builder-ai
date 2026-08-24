import { useState } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { useGsap } from "@/hooks/use-gsap";
import { loadSavedResumes, type SavedResume } from "@/lib/saved-resume-store";

export function SavedResumesSection() {
  const [resumes] = useState<SavedResume[]>(() => loadSavedResumes());
  const [active, setActive] = useState(0);
  const motionRef = useGsap<HTMLElement>((root, prefersReducedMotion) => {
    if (prefersReducedMotion) return;
    const card = root.querySelector<HTMLElement>("[data-saved-card]");
    if (card) gsap.from(card, { x: 18, opacity: 0, duration: 0.35, ease: "power2.out" });
  }, [active]);
  if (!resumes.length) return null;
  const current = resumes[active % resumes.length];
  return <section ref={motionRef} data-motion-section className="border-t border-border px-4 py-20 sm:px-6 sm:py-28" aria-labelledby="saved-resumes-title"><div className="mx-auto max-w-wide"><p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Your library</p><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="saved-resumes-title" className="text-section">Saved resumes, ready when you are.</h2><p className="mt-4 max-w-2xl text-lg text-muted-foreground">Keep tailored versions for different roles and revisit them anytime.</p></div><div className="flex gap-2"><Button variant="outline" className="rounded-pill" onClick={() => setActive((active - 1 + resumes.length) % resumes.length)} aria-label="Previous saved resume">←</Button><Button variant="outline" className="rounded-pill" onClick={() => setActive((active + 1) % resumes.length)} aria-label="Next saved resume">→</Button></div></div><div className="mt-10 grid gap-5 md:grid-cols-[1fr_1.4fr]"><div className="rounded-panel border border-border bg-card p-6"><p className="text-sm text-muted-foreground">{active + 1} / {resumes.length}</p><h3 className="mt-5 text-2xl font-semibold">{current.title}</h3><p className="mt-2 text-sm text-muted-foreground">Saved {new Date(current.createdAt).toLocaleDateString()}</p></div><div data-saved-card className="max-h-[360px] overflow-auto rounded-panel bg-white p-8 text-black shadow-lg"><pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{current.text}</pre></div></div></div></section>;
}
