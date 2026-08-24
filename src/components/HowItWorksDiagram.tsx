import { ArrowDown, ArrowRight, BriefcaseBusiness, ClipboardPaste, Sparkles } from "lucide-react";
import gsap from "gsap";
import { useGsap } from "@/hooks/use-gsap";

const steps = [
  { number: "01", title: "Compile work tasks", description: "Capture the wins, projects, and impact you want to reuse.", icon: BriefcaseBusiness },
  { number: "02", title: "Paste the job description", description: "Tell us which role you’re applying for so the right proof rises to the top.", icon: ClipboardPaste },
];

export function HowItWorksDiagram() {
  const motionRef = useGsap<HTMLElement>((root, reducedMotion) => {
    if (reducedMotion) return;
    const items = root.querySelectorAll<HTMLElement>("[data-diagram-item]");
    const connectors = root.querySelectorAll<HTMLElement>("[data-diagram-connector]");
    gsap.from(items, { y: 22, opacity: 0, duration: 0.55, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: root, start: "top 80%", once: true } });
    gsap.from(connectors, { scaleX: 0, transformOrigin: "left center", duration: 0.45, stagger: 0.15, delay: 0.25, ease: "power2.out", scrollTrigger: { trigger: root, start: "top 80%", once: true } });
  }, []);

  return (
    <section ref={motionRef} id="how-it-works" className="px-4 py-20 sm:px-6 sm:py-28" aria-labelledby="how-it-works-title">
      <div className="mx-auto max-w-wide">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">How it works</p>
          <h2 id="how-it-works-title" className="text-section">Your experience in. The right resume out.</h2>
          <p className="mt-5 text-lg text-muted-foreground">A simple three-part flow turns your existing work into a role-specific story.</p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1.15fr] md:items-stretch">
          {steps.map(({ number, title, description, icon: Icon }, index) => (
            <div key={number} className="contents">
              <article data-diagram-item className="rounded-panel bg-secondary/70 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4"><span className="text-sm font-semibold tabular-nums text-primary">{number}</span><Icon className="h-5 w-5 text-primary" aria-hidden="true" /></div>
                <h3 className="mt-12 text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-3 text-muted-foreground">{description}</p>
              </article>
              <div data-diagram-connector className="hidden items-center justify-center text-primary md:flex" aria-hidden="true"><ArrowRight className="h-5 w-5" /></div>
              {index < steps.length && <div className="flex items-center justify-center text-primary md:hidden" aria-hidden="true"><ArrowDown className="h-5 w-5" /></div>}
            </div>
          ))}

          <div data-diagram-item className="rounded-panel bg-primary p-6 text-primary-foreground shadow-lg sm:p-8">
            <div className="flex items-center justify-between gap-4"><span className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">Result</span><Sparkles className="h-5 w-5" aria-hidden="true" /></div>
            <h3 className="mt-12 text-xl font-semibold tracking-tight">Generated resume</h3>
            <p className="mt-3 text-primary-foreground/80">AI matches your existing work tasks to the job description—without inventing new facts.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
