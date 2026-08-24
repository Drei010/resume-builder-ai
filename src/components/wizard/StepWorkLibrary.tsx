import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { type Company, type WorkEntry } from "@/lib/work-db";

export function StepWorkLibrary({
  companies,
  entries,
  setCompanies,
  setEntries,
  onNext,
}: {
  companies: Company[];
  entries: WorkEntry[];
  setCompanies: (x: Company[]) => void;
  setEntries: (x: WorkEntry[]) => void;
  onNext: () => void;
}) {
  const addCompany = () =>
    setCompanies([...companies, { id: crypto.randomUUID(), name: "", jobTitle: "", location: "" }]);

  const updateCompany = (id: string, patch: Partial<Company>) =>
    setCompanies(companies.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const deleteCompany = (id: string) => {
    setCompanies(companies.filter((c) => c.id !== id));
    setEntries(entries.filter((e) => e.companyId !== id));
  };

  const addEntry = (companyId: string) =>
    setEntries([...entries, { id: crypto.randomUUID(), companyId, startMonth: "", endMonth: null, task: "" }]);

  const updateEntry = (id: string, patch: Partial<WorkEntry>) =>
    setEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const deleteEntry = (id: string) => setEntries(entries.filter((e) => e.id !== id));

  return (
    <div className="space-y-10">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your work library</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Capture specific accomplishments, not just responsibilities. The AI will pick the most relevant proof for each job description.
        </p>
      </div>

      <div className="space-y-6">
        {companies.length === 0 && (
          <div className="rounded-panel border border-dashed border-border p-10 text-center text-muted-foreground">
            No companies yet — add one to start logging accomplishments.
          </div>
        )}

        {companies.map((c) => {
          const companyEntries = entries.filter((e) => e.companyId === c.id);
          return (
            <Card key={c.id} className="rounded-panel border-border/70 p-5 shadow-none">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="grid flex-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`co-name-${c.id}`}>Company</Label>
                    <Input
                      id={`co-name-${c.id}`}
                      placeholder="Accenture Philippines"
                      value={c.name}
                      onChange={(e) => updateCompany(c.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`co-title-${c.id}`}>Job title</Label>
                    <Input
                      id={`co-title-${c.id}`}
                      placeholder="Full Stack Developer"
                      value={c.jobTitle}
                      onChange={(e) => updateCompany(c.id, { jobTitle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`co-loc-${c.id}`}>Location <span className="text-muted-foreground">(optional)</span></Label>
                    <Input
                      id={`co-loc-${c.id}`}
                      placeholder="Taguig, Philippines"
                      value={c.location ?? ""}
                      onChange={(e) => updateCompany(c.id, { location: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6 shrink-0 text-destructive hover:text-destructive"
                  aria-label={`Delete ${c.name || "company"}`}
                  onClick={() => deleteCompany(c.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {companyEntries.map((e) => (
                  <div key={e.id} className="rounded-xl border border-border bg-background p-4">
                    <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                      <div className="space-y-1.5">
                        <Label htmlFor={`entry-start-${e.id}`}>Start month</Label>
                        <Input
                          id={`entry-start-${e.id}`}
                          type="month"
                          value={e.startMonth}
                          onChange={(ev) => updateEntry(e.id, { startMonth: ev.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`entry-end-${e.id}`}>End month</Label>
                        <Input
                          id={`entry-end-${e.id}`}
                          type="month"
                          value={e.endMonth ?? ""}
                          placeholder="Leave blank for Present"
                          onChange={(ev) => updateEntry(e.id, { endMonth: ev.target.value || null })}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6 text-destructive hover:text-destructive"
                        aria-label="Delete accomplishment"
                        onClick={() => deleteEntry(e.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={e.task}
                      onChange={(ev) => updateEntry(e.id, { task: ev.target.value })}
                      placeholder="I reduced FTE workload by 2 by building an automation…"
                      className="min-h-20 resize-none rounded-xl bg-secondary/30"
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl border-dashed"
                  onClick={() => addEntry(c.id)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add accomplishment
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={addCompany} className="rounded-pill">
          <Plus className="mr-2 h-4 w-4" /> Add company
        </Button>
        <Button onClick={onNext} className="rounded-pill px-7" data-testid="step-continue">
          Continue ↗
        </Button>
      </div>
    </div>
  );
}
