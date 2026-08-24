import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CompanyGroup, WorkEntry } from "@/lib/work-db";

const EMPTY_CARD_COUNT = 3;
const MAX_STACKED_CARDS = 6;

type WorkTaskCollageProps = {
  groups: CompanyGroup[];
  totalEntries: number;
  companyManager: ReactNode;
  entryForm: ReactNode;
  onAddEntry: () => void;
  onEditEntry: (entry: WorkEntry) => void;
  onDeleteEntry: (entry: WorkEntry) => void;
};

function stackedTransform(index: number): string {
  const rotation = ((index * 17) % 9) - 4;
  const x = ((index * 23) % 25) - 12;
  const y = index * 5;
  return `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
}

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
  const visibleEntries = entries.slice(0, MAX_STACKED_CARDS);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const toggleExpanded = () => setIsExpanded((expanded) => !expanded);
  const stackHeight = totalEntries === 0 ? 250 : Math.min(360, 190 + visibleEntries.length * 12);

  return (
    <section id="work-database" className="bg-secondary/70 px-4 py-20 sm:px-6 sm:py-28" aria-labelledby="work-database-title">
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
            <div className="relative mx-auto max-w-3xl" style={{ height: stackHeight }}>
              <div className="absolute inset-x-0 top-4 mx-auto h-56 max-w-xl" aria-hidden="true">
                {(visibleEntries.length ? visibleEntries : Array.from({ length: EMPTY_CARD_COUNT })).map((entry, index) => {
                  const actualEntry = entry as WorkEntry | undefined;
                  const group = actualEntry ? groups.find((item) => item.id === actualEntry.companyId) : undefined;
                  return (
                    <Card
                      key={actualEntry?.id ?? `empty-${index}`}
                      className={`absolute inset-x-3 mx-auto h-48 max-w-md overflow-hidden border-border/70 bg-card p-5 shadow-xl transition-transform ${reducedMotion ? "duration-0" : "duration-700 ease-out"}`}
                      style={{ transform: stackedTransform(index), zIndex: index + 1 }}
                    >
                      {actualEntry ? (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <Badge variant="secondary" className="max-w-[70%] truncate">{group?.name ?? "Company"}</Badge>
                            <span className="text-xs text-muted-foreground">{actualEntry.startMonth}</span>
                          </div>
                          <p className="mt-5 line-clamp-4 text-lg font-medium leading-relaxed">{actualEntry.task}</p>
                        </>
                      ) : (
                        <div className="space-y-4 opacity-40">
                          <div className="h-3 w-28 rounded-full bg-muted" />
                          <div className="h-4 w-full rounded-full bg-muted" />
                          <div className="h-4 w-4/5 rounded-full bg-muted" />
                          <div className="h-4 w-2/3 rounded-full bg-muted" />
                        </div>
                      )}
                    </Card>
                  );
                })}
                {totalEntries > MAX_STACKED_CARDS && (
                  <span className="absolute -right-2 -top-2 z-20 rounded-pill bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    +{totalEntries - MAX_STACKED_CARDS} more
                  </span>
                )}
              </div>
              <div className="absolute inset-0 z-30 flex items-center justify-center">
                <Button
                  type="button"
                  size="lg"
                  className="rounded-pill px-6 shadow-lg"
                  aria-expanded={false}
                  aria-controls="work-task-grid"
                  onClick={toggleExpanded}
                  data-testid="modify-work-tasks"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Modify Work Tasks List
                </Button>
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
