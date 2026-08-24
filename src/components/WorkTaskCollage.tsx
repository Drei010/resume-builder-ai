import { useEffect, useMemo, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGsap } from "@/hooks/use-gsap";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CompanyGroup, WorkEntry } from "@/lib/work-db";

const MAX_PREVIEW_CARDS = 12;

type WorkTaskCollageProps = {
  groups: CompanyGroup[];
  totalEntries: number;
  companyManager: ReactNode;
  entryForm: ReactNode;
  onAddEntry: () => void;
  onEditEntry: (entry: WorkEntry) => void;
  onDeleteEntry: (entry: WorkEntry) => void;
};

const EXAMPLE_TASKS = [
  "Reduced processing time by 35% through a workflow automation.",
  "Built an automated reporting workflow for cross-functional teams.",
  "Led a launch that improved customer response time.",
  "Created a repeatable system that reduced manual work.",
];

type PreviewCard = { id: string; company: string; date: string; task: string };

export function WorkTaskCollage({
  groups,
  totalEntries,
  companyManager,
  entryForm,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
}: WorkTaskCollageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const entries = useMemo(() => groups.flatMap((group) => group.entries), [groups]);
  const previewCards = useMemo<PreviewCard[]>(() => entries.length
    ? entries.slice(0, MAX_PREVIEW_CARDS).map((entry) => {
        const group = groups.find((item) => item.id === entry.companyId);
        return { id: entry.id, company: group?.name ?? "Your company", date: entry.startMonth || "Your impact", task: entry.task };
      })
    : EXAMPLE_TASKS.map((task, index) => ({ id: `example-${index}`, company: "Your next win", date: "Impact statement", task })), [entries, groups]);
  const columnCards = useMemo(() => Array.from({ length: 4 }, (_, column) => {
    const count = Math.max(3, Math.ceil(previewCards.length / 4));
    return Array.from({ length: count }, (_, index) => previewCards[(column + index * 4) % previewCards.length]);
  }), [previewCards]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const toggleExpanded = () => setIsExpanded((expanded) => !expanded);
  const motionRef = useGsap<HTMLElement>((root, prefersReducedMotion) => {
    if (prefersReducedMotion || isExpanded) return;
    const stack = root.querySelector<HTMLElement>("[data-collage-stack]");
    const columns = root.querySelectorAll<HTMLElement>("[data-collage-column]");
    if (!stack || !columns.length) return;
    columns.forEach((column, index) => {
      const movingDown = index % 2 === 1;
      gsap.fromTo(column, { yPercent: movingDown ? -14 : 14 }, { yPercent: movingDown ? 14 : -14, ease: "none", scrollTrigger: { trigger: stack, start: "top bottom", end: "bottom top", scrub: 0.35 } });
    });
  }, [isExpanded]);

  return (
    <section ref={motionRef} id="work-database" className="bg-secondary/70 px-4 py-20 sm:px-6 sm:py-28" aria-labelledby="work-database-title">
      <div className="mx-auto max-w-wide">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Your work library</p>
          <h2 id="work-database-title" className="text-section">Keep the wins. Tailor the story.</h2>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Save the work you are proud of once, then reuse the most relevant proof for every opportunity.
          </p>
        </div>

        {!isExpanded ? (
          <div className="mt-12">
            <p className="sr-only" aria-live="polite">
              {totalEntries === 0 ? "No work tasks saved yet." : `${totalEntries} work tasks saved.`}
            </p>
            <div className="relative mx-auto w-full max-w-wide overflow-hidden rounded-[2rem] bg-transparent p-2" style={{ height: "clamp(420px, 52vw, 560px)" }}>
              <div data-collage-stack className="absolute inset-0 flex gap-3 overflow-hidden px-2 sm:gap-4 sm:px-4" aria-hidden="true">
                {columnCards.map((cards, column) => (
                  <div key={`column-${column}`} data-collage-column className={`min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)] ${column === 2 ? "hidden md:flex" : column === 3 ? "hidden lg:flex" : ""}`}>
                    <div data-collage-track className={`flex flex-col gap-3 sm:gap-4 ${reducedMotion ? "" : column % 2 ? "work-library-track-down" : "work-library-track-up"}`} style={{ animationDuration: `${58 + column * 5}s` }}>
                      {[...cards, ...cards].map((card, index) => (
                        <Card key={`${card.id}-${column}-${index}`} className={`shrink-0 overflow-hidden border-0 bg-card/95 p-4 shadow-lg sm:p-5 ${reducedMotion ? "" : "transition-shadow duration-300 hover:shadow-xl"}`}>
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="secondary" className="max-w-[72%] truncate">{card.company}</Badge>
                            <span className="text-[10px] text-muted-foreground sm:text-xs">{card.date}</span>
                          </div>
                          <p className="mt-4 line-clamp-5 text-sm font-medium leading-relaxed sm:text-base">{card.task}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 z-30 flex items-center justify-center p-6">
                <div className="rounded-[2rem] bg-background/65 p-3 shadow-2xl backdrop-blur-xl">
                  <Button
                    type="button"
                    size="lg"
                    className="h-16 rounded-pill px-9 text-base shadow-lg sm:h-20 sm:px-12 sm:text-lg"
                    aria-expanded={false}
                    aria-controls="work-task-grid"
                    onClick={toggleExpanded}
                    data-testid="modify-work-tasks"
                  >
                    <Pencil className="mr-2 h-5 w-5" />
                    Modify Work Tasks List
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div id="work-task-grid" className="mt-12" data-testid="work-task-grid">
            <div className="mb-8 flex flex-col gap-4 rounded-panel border border-border/70 bg-background/70 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Work tasks list</p>
                <p className="text-sm text-muted-foreground">Edit the details that make each accomplishment credible.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {companyManager}
                <Button type="button" onClick={onAddEntry} className="rounded-pill" data-testid="add-work-task">
                  <Plus className="mr-2 h-4 w-4" /> Add work task
                </Button>
                <Button type="button" variant="outline" onClick={toggleExpanded} className="rounded-pill" aria-expanded={true} aria-controls="work-task-grid" data-testid="collapse-work-tasks">
                  Done editing
                </Button>
              </div>
            </div>

            {entryForm}

            {groups.length === 0 ? (
              <Card className="border-dashed bg-background/60 p-10 text-center">
                <p className="font-semibold">Start with a company</p>
                <p className="mt-2 text-sm text-muted-foreground">Register a company before adding your first work task.</p>
              </Card>
            ) : (
              <div className="space-y-10">
                {groups.map((group) => (
                  <div key={group.id}>
                    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-2xl font-semibold tracking-tight">{group.jobTitle} <span className="text-muted-foreground">· {group.name}</span></h3>
                        {group.location && <p className="text-sm text-muted-foreground">{group.location}</p>}
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-primary"><CalendarDays className="h-4 w-4" />{group.dateRange || "No date range yet"}</span>
                    </div>
                    {group.entries.length === 0 ? (
                      <Card className="border-dashed bg-background/50 p-6 text-sm text-muted-foreground">No work tasks logged for this company yet.</Card>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {group.entries.map((entry) => (
                          <Card key={entry.id} tabIndex={0} className="flex min-h-52 flex-col border-border/70 bg-background p-5 transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <p className="flex-1 text-base leading-relaxed">{entry.task}</p>
                            <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                              <span className="text-xs text-muted-foreground">{entry.startMonth} – {entry.endMonth ?? "Present"}</span>
                              <div className="flex gap-1">
                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label={`Edit ${entry.task}`} onClick={() => onEditEntry(entry)}><Pencil className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" aria-label={`Delete ${entry.task}`} onClick={() => onDeleteEntry(entry)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
