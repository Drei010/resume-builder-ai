import { useMemo, useState, type ReactNode } from "react";
import { Plus, Trash2, Loader2, FileDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { API_ENDPOINTS } from "@/lib/api-config";
import { downloadDocx, downloadPDF, downloadTxt } from "@/lib/resume-export";
import {
  createCompany, createEntry, groupEntriesByCompany,
  isValidMonth, loadCompanies, loadEntries,
  saveCompanies, saveEntries,
  type Company, type WorkEntry,
} from "@/lib/work-db";
import { WorkTaskCollage } from "./WorkTaskCollage";

const MAX_TASK_LENGTH = 2000;
type DownloadFormat = "pdf" | "docx" | "txt";

// ─── Company form state ───────────────────────────────────────────────────────
type CompanyDraft = { name: string; jobTitle: string; location: string };
const emptyCompanyDraft = (): CompanyDraft => ({ name: "", jobTitle: "", location: "" });

// ─── Entry form state ─────────────────────────────────────────────────────────
type EntryDraft = {
  companyId: string; startMonth: string;
  endMonth: string; isPresent: boolean; task: string;
};
const emptyEntryDraft = (companyId = ""): EntryDraft => ({
  companyId, startMonth: "", endMonth: "", isPresent: true, task: "",
});

export function WorkDatabaseSection() {
  const [companies, setCompanies] = useState<Company[]>(loadCompanies);
  const [entries, setEntries] = useState<WorkEntry[]>(loadEntries);

  // Company dialog — single dialog handles both add and edit
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [companyDraft, setCompanyDraft] = useState<CompanyDraft>(emptyCompanyDraft);
  const [deleteCompanyId, setDeleteCompanyId] = useState<string | null>(null);

  // Entry form — inline card, not a dialog
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryDraft, setEntryDraft] = useState<EntryDraft>(emptyEntryDraft);

  // JD tailoring
  const [jobDescription, setJobDescription] = useState("");
  const [tailoredResume, setTailoredResume] = useState("");
  const [isTailoring, setIsTailoring] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("pdf");

  const groups = useMemo(() => groupEntriesByCompany(companies, entries), [companies, entries]);

  // ── Persistence helpers ────────────────────────────────────────────────────
  const persistCompanies = (next: Company[]) => { setCompanies(next); saveCompanies(next); };
  const persistEntries   = (next: WorkEntry[]) => { setEntries(next); saveEntries(next); };

  // ── Company CRUD ───────────────────────────────────────────────────────────
  const openCompanyDialog = (company?: Company) => {
    setEditingCompanyId(company?.id ?? null);
    setCompanyDraft({ name: company?.name ?? "", jobTitle: company?.jobTitle ?? "", location: company?.location ?? "" });
    setCompanyDialogOpen(true);
  };

  const saveCompany = () => {
    const { name, jobTitle, location } = companyDraft;
    if (!name.trim() || !jobTitle.trim()) { toast.error("Company name and job title are required."); return; }
    const draft = { name: name.trim(), jobTitle: jobTitle.trim(), ...(location.trim() ? { location: location.trim() } : {}) };
    persistCompanies(
      editingCompanyId
        ? companies.map((c) => c.id === editingCompanyId ? { ...c, ...draft } : c)
        : [...companies, createCompany(draft)]
    );
    setCompanyDialogOpen(false);
    toast.success(editingCompanyId ? "Company updated." : "Company added.");
  };

  const confirmDeleteCompany = () => {
    if (!deleteCompanyId) return;
    if (entries.some((e) => e.companyId === deleteCompanyId)) {
      toast.error("Remove or reassign this company's work tasks first.");
    } else {
      persistCompanies(companies.filter((c) => c.id !== deleteCompanyId));
      toast.success("Company deleted.");
    }
    setDeleteCompanyId(null);
  };

  // ── Entry CRUD ─────────────────────────────────────────────────────────────
  const openEntryForm = (entry?: WorkEntry) => {
    setEditingEntryId(entry?.id ?? null);
    setEntryDraft(entry
      ? { companyId: entry.companyId, startMonth: entry.startMonth, endMonth: entry.endMonth ?? "", isPresent: entry.endMonth === null, task: entry.task }
      : emptyEntryDraft(companies[0]?.id ?? "")
    );
    setEntryFormOpen(true);
  };

  const saveEntry = () => {
    const { companyId, startMonth, endMonth, isPresent, task } = entryDraft;
    if (!companies.some((c) => c.id === companyId)) { toast.error("Choose a company first."); return; }
    if (!isValidMonth(startMonth)) { toast.error("Enter a valid start month."); return; }
    if (!isPresent && (!isValidMonth(endMonth) || endMonth < startMonth)) { toast.error("End month must be after start month."); return; }
    const cleanTask = task.trim();
    if (!cleanTask) { toast.error("Describe the work you did."); return; }
    if (cleanTask.length > MAX_TASK_LENGTH) { toast.error(`Keep the task under ${MAX_TASK_LENGTH.toLocaleString()} characters.`); return; }
    const draft = { companyId, startMonth, endMonth: isPresent ? null : endMonth, task: cleanTask };
    persistEntries(
      editingEntryId
        ? entries.map((e) => e.id === editingEntryId ? { ...e, ...draft } : e)
        : [...entries, createEntry(draft)]
    );
    setEntryFormOpen(false);
    toast.success(editingEntryId ? "Work task updated." : "Work task saved.");
  };

  // ── Tailoring ──────────────────────────────────────────────────────────────
  const generateTailoredResume = async () => {
    if (!jobDescription.trim()) { toast.error("Add a job description first."); return; }
    if (!entries.length) { toast.error("Add at least one work task first."); return; }
    const payloadEntries = entries.map((e) => {
      const g = groups.find((item) => item.id === e.companyId);
      return { ...e, companyName: g?.name ?? "", jobTitle: g?.jobTitle ?? "", location: g?.location ?? "", dateRange: g?.dateRange ?? "" };
    });
    setIsTailoring(true);
    setTailoredResume("");
    try {
      const res = await fetch(API_ENDPOINTS.tailorResume, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, entries: payloadEntries }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to tailor resume.");
      const data = await res.json().catch(() => { throw new Error("Invalid server response."); });
      const text = typeof data.resume === "string" ? data.resume.trim() : "";
      setTailoredResume(text);
      if (!text) toast.message("No work tasks matched this job description.");
      else toast.success("Tailored resume generated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to tailor resume.");
    } finally {
      setIsTailoring(false);
    }
  };

  const downloadTailoredResume = async () => {
    if (!tailoredResume) { toast.error("Generate a tailored resume first."); return; }
    try {
      if (downloadFormat === "pdf") downloadPDF(tailoredResume);
      else if (downloadFormat === "docx") await downloadDocx(tailoredResume);
      else downloadTxt(tailoredResume);
    } catch { toast.error("Failed to download resume."); }
  };

  // ── Slots passed into the collage ─────────────────────────────────────────
  const companyManager: ReactNode = (
    <>
      <Button type="button" variant="outline" className="rounded-pill" onClick={() => openCompanyDialog()} data-testid="add-company">
        <Plus className="mr-2 h-4 w-4" /> Manage companies
      </Button>

      {/* Single company add/edit dialog */}
      <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCompanyId ? "Edit company" : "Add company"}</DialogTitle>
            <DialogDescription>Save the job title once; work tasks will reference it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {(["name", "jobTitle"] as const).map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={`company-${field}`}>{field === "name" ? "Company name" : "Job title"}</Label>
                <Input id={`company-${field}`} value={companyDraft[field]} onChange={(e) => setCompanyDraft((d) => ({ ...d, [field]: e.target.value }))} />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="company-location">Location <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="company-location" value={companyDraft.location} onChange={(e) => setCompanyDraft((d) => ({ ...d, location: e.target.value }))} />
            </div>
            {/* Company list inline */}
            {companies.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium">Your companies</p>
                {companies.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.jobTitle}</p></div>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => openCompanyDialog(c)}>Edit</Button>
                      <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteCompanyId(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCompanyDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={saveCompany}>Save company</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteCompanyId)} onOpenChange={(open) => !open && setDeleteCompanyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this company?</AlertDialogTitle>
            <AlertDialogDescription>A company with work tasks cannot be deleted until those tasks are removed or reassigned.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCompany}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  const entryForm: ReactNode = entryFormOpen ? (
    <Card className="mb-8 border-primary/30 bg-background p-5" data-testid="work-task-form">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{editingEntryId ? "Edit work task" : "Add work task"}</h3>
          <p className="text-sm text-muted-foreground">Capture one concrete accomplishment with its month range.</p>
        </div>
        <Button type="button" variant="ghost" onClick={() => setEntryFormOpen(false)}>Cancel</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="work-company">Company</Label>
          <Select value={entryDraft.companyId} onValueChange={(v) => setEntryDraft((d) => ({ ...d, companyId: v }))}>
            <SelectTrigger id="work-company"><SelectValue placeholder="Choose a company" /></SelectTrigger>
            <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.jobTitle}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="work-start">Start month</Label>
          <Input id="work-start" type="month" value={entryDraft.startMonth} onChange={(e) => setEntryDraft((d) => ({ ...d, startMonth: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="work-end">End month</Label>
          <Input id="work-end" type="month" disabled={entryDraft.isPresent} value={entryDraft.endMonth} onChange={(e) => setEntryDraft((d) => ({ ...d, endMonth: e.target.value }))} />
        </div>
        <label className="mt-7 flex min-h-10 items-center gap-3 text-sm cursor-pointer">
          <input type="checkbox" checked={entryDraft.isPresent} onChange={(e) => setEntryDraft((d) => ({ ...d, isPresent: e.target.checked }))} />
          Ongoing (Present)
        </label>
      </div>
      <div className="mt-4 space-y-2">
        <Label htmlFor="work-task">What did you accomplish?</Label>
        <Textarea
          id="work-task"
          maxLength={MAX_TASK_LENGTH}
          value={entryDraft.task}
          onChange={(e) => setEntryDraft((d) => ({ ...d, task: e.target.value }))}
          placeholder="I created an automation that reduced FTE workload by..."
          className="min-h-28"
        />
        <p className="text-right text-xs text-muted-foreground">{entryDraft.task.length}/{MAX_TASK_LENGTH}</p>
      </div>
      <div className="mt-5 flex justify-end">
        <Button type="button" onClick={saveEntry}>{editingEntryId ? "Update task" : "Save task"}</Button>
      </div>
    </Card>
  ) : null;

  return (
    <>
      <WorkTaskCollage
        groups={groups}
        totalEntries={entries.length}
        companyManager={companyManager}
        entryForm={entryForm}
        onAddEntry={() => { if (!companies.length) { toast.error("Add a company first."); return; } openEntryForm(); }}
        onEditEntry={openEntryForm}
        onDeleteEntry={(entry) => { persistEntries(entries.filter((e) => e.id !== entry.id)); toast.success("Work task deleted."); }}
      />

      {/* The tailoring flow is available exclusively in the /create wizard. */}
      <div className="hidden" aria-hidden="true">
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <Card className="rounded-panel border-border/70 bg-card p-5 shadow-md">
              <Label htmlFor="tailor-jd" className="text-2xl font-semibold tracking-tight">Job description</Label>
              <Textarea
                id="tailor-jd"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description here..."
                className="mt-4 min-h-80 resize-none rounded-2xl bg-background"
              />
              <p className="mt-3 text-sm text-muted-foreground">
                {entries.length ? `${entries.length} work task${entries.length === 1 ? "" : "s"} available.` : "Add work tasks above before generating."}
              </p>
              <Button
                type="button"
                onClick={generateTailoredResume}
                disabled={isTailoring || !jobDescription.trim() || !entries.length}
                className="mt-5 h-12 w-full rounded-pill text-base"
                data-testid="generate-tailored-resume"
              >
                {isTailoring
                  ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Matching your work...</>
                  : <><Sparkles className="mr-2 h-5 w-5" /> Generate Tailored Resume</>}
              </Button>
            </Card>

            <Card className="rounded-panel border-border/70 bg-card p-5 shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-2xl font-semibold tracking-tight">Tailored preview</h3>
                {tailoredResume && (
                  <div className="flex gap-2">
                    <Select value={downloadFormat} onValueChange={(v: DownloadFormat) => setDownloadFormat(v)}>
                      <SelectTrigger className="w-32 bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="docx">Word</SelectItem>
                        <SelectItem value="txt">Text</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={downloadTailoredResume} aria-label="Download tailored resume">
                      <FileDown className="mr-2 h-4 w-4" /> Download
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-4 min-h-80 rounded-lg border border-border bg-muted/30 p-5">
                {tailoredResume
                  ? <Textarea value={tailoredResume} onChange={(e) => setTailoredResume(e.target.value)} className="min-h-72 resize-none border-0 bg-transparent p-0 font-mono text-sm focus:ring-0" aria-label="Tailored resume preview" />
                  : <div className="flex min-h-72 items-center justify-center text-center text-muted-foreground">
                      {isTailoring ? "Selecting the strongest evidence…" : entries.length === 0 ? "Add work tasks above to start." : "Your tailored work experience will appear here."}
                    </div>}
              </div>
            </Card>
          </div>
        </div>
    </>
  );
}
