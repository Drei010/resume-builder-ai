import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { FileDown, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { API_ENDPOINTS } from "@/lib/api-config";
import { downloadDocx, downloadPDF, downloadTxt } from "@/lib/resume-export";
import { createCompany, createEntry, groupEntriesByCompany, isValidMonth, loadCompanies, loadEntries, saveCompanies, saveEntries, type Company, type CompanyGroup, type WorkEntry } from "@/lib/work-db";
import { WorkTaskCollage } from "./WorkTaskCollage";

const MAX_TASK_LENGTH = 2000;
type DownloadFormat = "pdf" | "docx" | "txt";

type EntryDraft = {
  companyId: string;
  startMonth: string;
  endMonth: string;
  isPresent: boolean;
  task: string;
};

const emptyEntryDraft = (companyId = ""): EntryDraft => ({
  companyId,
  startMonth: "",
  endMonth: "",
  isPresent: true,
  task: "",
});

export function WorkDatabaseSection() {
  const [companies, setCompanies] = useState<Company[]>(() => loadCompanies());
  const [entries, setEntries] = useState<WorkEntry[]>(() => loadEntries());
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [companiesDialogOpen, setCompaniesDialogOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [deleteCompanyId, setDeleteCompanyId] = useState<string | null>(null);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryDraft, setEntryDraft] = useState<EntryDraft>(emptyEntryDraft());
  const [jobDescription, setJobDescription] = useState("");
  const [tailoredResume, setTailoredResume] = useState("");
  const [isTailoring, setIsTailoring] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("pdf");

  const groups = useMemo(() => groupEntriesByCompany(companies, entries), [companies, entries]);
  const totalEntries = entries.length;

  const persistCompanies = (next: Company[]) => {
    setCompanies(next);
    saveCompanies(next);
  };

  const persistEntries = (next: WorkEntry[]) => {
    setEntries(next);
    saveEntries(next);
  };

  const openCompanyDialog = (company?: Company) => {
    setEditingCompanyId(company?.id ?? null);
    setCompanyName(company?.name ?? "");
    setJobTitle(company?.jobTitle ?? "");
    setLocation(company?.location ?? "");
    setCompanyDialogOpen(true);
  };

  const saveCompanyForm = () => {
    const name = companyName.trim();
    const title = jobTitle.trim();
    if (!name || !title) {
      toast.error("Company name and job title are required.");
      return;
    }

    const draft = { name, jobTitle: title, ...(location.trim() ? { location: location.trim() } : {}) };
    const next = editingCompanyId
      ? companies.map((company) => company.id === editingCompanyId ? { ...company, ...draft } : company)
      : [...companies, createCompany(draft)];
    persistCompanies(next);
    setCompanyDialogOpen(false);
    toast.success(editingCompanyId ? "Company updated." : "Company added.");
  };

  const confirmDeleteCompany = () => {
    if (!deleteCompanyId) return;
    if (entries.some((entry) => entry.companyId === deleteCompanyId)) {
      toast.error("Delete or reassign this company's work tasks first.");
      setDeleteCompanyId(null);
      return;
    }
    persistCompanies(companies.filter((company) => company.id !== deleteCompanyId));
    setDeleteCompanyId(null);
    toast.success("Company deleted.");
  };

  const openEntryForm = (entry?: WorkEntry) => {
    if (entry) {
      setEditingEntryId(entry.id);
      setEntryDraft({
        companyId: entry.companyId,
        startMonth: entry.startMonth,
        endMonth: entry.endMonth ?? "",
        isPresent: entry.endMonth === null,
        task: entry.task,
      });
    } else {
      setEditingEntryId(null);
      setEntryDraft(emptyEntryDraft(companies[0]?.id ?? ""));
    }
    setEntryDialogOpen(true);
  };

  const saveEntryForm = () => {
    const { companyId, startMonth, endMonth, isPresent, task } = entryDraft;
    if (!companyId || !companies.some((company) => company.id === companyId)) {
      toast.error("Choose a company first.");
      return;
    }
    if (!isValidMonth(startMonth)) {
      toast.error("Enter a valid start month.");
      return;
    }
    if (!isPresent && (!isValidMonth(endMonth) || endMonth < startMonth)) {
      toast.error("End month must be valid and cannot be before the start month.");
      return;
    }
    const cleanTask = task.trim();
    if (!cleanTask) {
      toast.error("Describe the work you did.");
      return;
    }
    if (cleanTask.length > MAX_TASK_LENGTH) {
      toast.error(`Keep the task under ${MAX_TASK_LENGTH.toLocaleString()} characters.`);
      return;
    }

    const draft = { companyId, startMonth, endMonth: isPresent ? null : endMonth, task: cleanTask };
    const next = editingEntryId
      ? entries.map((entry) => entry.id === editingEntryId ? { ...entry, ...draft } : entry)
      : [...entries, createEntry(draft)];
    persistEntries(next);
    setEntryDialogOpen(false);
    toast.success(editingEntryId ? "Work task updated." : "Work task saved.");
  };

  const deleteEntry = (entry: WorkEntry) => {
    persistEntries(entries.filter((item) => item.id !== entry.id));
    toast.success("Work task deleted.");
  };

  const generateTailoredResume = async () => {
    if (!jobDescription.trim()) {
      toast.error("Add a job description first.");
      return;
    }
    if (!entries.length) {
      toast.error("Add at least one work task first.");
      return;
    }

    const payloadEntries = entries.map((entry) => {
      const group = groups.find((item) => item.id === entry.companyId);
      return {
        id: entry.id,
        companyId: entry.companyId,
        companyName: group?.name ?? "",
        jobTitle: group?.jobTitle ?? "",
        location: group?.location ?? "",
        dateRange: group?.dateRange ?? "",
        startMonth: entry.startMonth,
        endMonth: entry.endMonth,
        task: entry.task,
      };
    });

    setIsTailoring(true);
    setTailoredResume("");
    try {
      const response = await fetch(API_ENDPOINTS.tailorResume, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, entries: payloadEntries }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to tailor resume.");
      }
      const data = await response.json().catch(() => {
        throw new Error("The server returned an invalid response.");
      });
      setTailoredResume(typeof data.resume === "string" ? data.resume.trim() : "");
      if (!data.resume?.trim()) toast.message("No work tasks matched this job description.");
      else toast.success("Tailored resume generated.");
    } catch (error) {
      console.error("Error tailoring resume:", error);
      toast.error(error instanceof Error ? error.message : "Failed to tailor resume.");
    } finally {
      setIsTailoring(false);
    }
  };

  const downloadTailoredResume = async () => {
    if (!tailoredResume) {
      toast.error("Generate a tailored resume first.");
      return;
    }
    try {
      if (downloadFormat === "pdf") downloadPDF(tailoredResume);
      if (downloadFormat === "docx") await downloadDocx(tailoredResume);
      if (downloadFormat === "txt") downloadTxt(tailoredResume);
      toast.success("Resume downloaded.");
    } catch (error) {
      console.error("Error downloading tailored resume:", error);
      toast.error("Failed to download resume.");
    }
  };

  const companyManager: ReactNode = (
    <>
      <Button type="button" variant="outline" className="rounded-pill" onClick={() => setCompaniesDialogOpen(true)} data-testid="add-company">
        <Plus className="mr-2 h-4 w-4" /> Manage companies
      </Button>
      <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCompanyId ? "Edit company" : "Add company"}</DialogTitle>
            <DialogDescription>Save the job title once; your work tasks will reference it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label htmlFor="company-name">Company name</Label><Input id="company-name" value={companyName} onChange={(event) => setCompanyName(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="job-title">Job title</Label><Input id="job-title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="company-location">Location <span className="text-muted-foreground">(optional)</span></Label><Input id="company-location" value={location} onChange={(event) => setLocation(event.target.value)} /></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setCompanyDialogOpen(false)}>Cancel</Button><Button type="button" onClick={saveCompanyForm}>Save company</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={companiesDialogOpen} onOpenChange={setCompaniesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Companies</DialogTitle><DialogDescription>Manage the companies used by your work task cards.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            {companies.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No companies yet.</p> : companies.map((company) => (
              <div key={company.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-semibold">{company.name}</p><p className="text-sm text-muted-foreground">{company.jobTitle}{company.location ? ` · ${company.location}` : ""}</p></div>
                <div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => { setCompaniesDialogOpen(false); openCompanyDialog(company); }}>Edit</Button><Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteCompanyId(company.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button></div>
              </div>
            ))}
          </div>
          <DialogFooter><Button type="button" onClick={() => { setCompaniesDialogOpen(false); openCompanyDialog(); }}>Add company</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={Boolean(deleteCompanyId)} onOpenChange={(open) => !open && setDeleteCompanyId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this company?</AlertDialogTitle><AlertDialogDescription>A company with work tasks cannot be deleted until those tasks are removed or reassigned.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteCompany}>Delete company</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  );

  const entryForm: ReactNode = entryDialogOpen ? (
    <Card className="mb-8 border-primary/30 bg-background p-5" data-testid="work-task-form">
      <div className="mb-5 flex items-center justify-between"><div><h3 className="text-lg font-semibold">{editingEntryId ? "Edit work task" : "Add work task"}</h3><p className="text-sm text-muted-foreground">Capture one concrete accomplishment with its month range.</p></div><Button type="button" variant="ghost" onClick={() => setEntryDialogOpen(false)}>Cancel</Button></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="work-company">Company</Label><Select value={entryDraft.companyId} onValueChange={(value) => setEntryDraft((draft) => ({ ...draft, companyId: value }))}><SelectTrigger id="work-company"><SelectValue placeholder="Choose a company" /></SelectTrigger><SelectContent>{companies.map((company) => <SelectItem key={company.id} value={company.id}>{company.name} · {company.jobTitle}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="work-start-month">Start month</Label><Input id="work-start-month" type="month" value={entryDraft.startMonth} onChange={(event) => setEntryDraft((draft) => ({ ...draft, startMonth: event.target.value }))} /></div>
        <div className="space-y-2"><Label htmlFor="work-end-month">End month</Label><Input id="work-end-month" type="month" disabled={entryDraft.isPresent} value={entryDraft.endMonth} onChange={(event) => setEntryDraft((draft) => ({ ...draft, endMonth: event.target.value }))} /></div>
        <label className="mt-7 flex min-h-10 items-center gap-3 text-sm"><input type="checkbox" checked={entryDraft.isPresent} onChange={(event) => setEntryDraft((draft) => ({ ...draft, isPresent: event.target.checked }))} /> This task is ongoing (Present)</label>
      </div>
      <div className="mt-4 space-y-2"><Label htmlFor="work-task">What did you accomplish?</Label><Textarea id="work-task" maxLength={MAX_TASK_LENGTH} value={entryDraft.task} onChange={(event) => setEntryDraft((draft) => ({ ...draft, task: event.target.value }))} placeholder="I created an automation that reduced FTE workload by..." className="min-h-28" /><p className="text-right text-xs text-muted-foreground">{entryDraft.task.length}/{MAX_TASK_LENGTH}</p></div>
      <div className="mt-5 flex justify-end"><Button type="button" onClick={saveEntryForm}>{editingEntryId ? "Update task" : "Save task"}</Button></div>
    </Card>
  ) : null;

  return (
    <>
      <WorkTaskCollage groups={groups} totalEntries={totalEntries} companyManager={companyManager} entryForm={entryForm} onAddEntry={() => { if (!companies.length) { toast.error("Add a company first."); return; } openEntryForm(); }} onEditEntry={openEntryForm} onDeleteEntry={deleteEntry} />
      <section id="tailor-resume" className="px-4 py-20 sm:px-6 sm:py-28" aria-labelledby="tailor-resume-title">
        <div className="mx-auto max-w-wide">
          <div className="max-w-3xl"><p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Tailor for the role</p><h2 id="tailor-resume-title" className="text-section">Turn your work library into the right resume.</h2><p className="mt-5 text-lg text-muted-foreground">Paste a job description and the AI will keep only the work proof that belongs in that conversation.</p></div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <Card className="rounded-panel border-border/70 bg-card p-5 shadow-md"><Label htmlFor="tailor-job-description" className="text-2xl font-semibold tracking-tight">Job description</Label><Textarea id="tailor-job-description" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the target job description here..." className="mt-4 min-h-80 resize-none rounded-2xl bg-background" aria-describedby="tailor-help" /><p id="tailor-help" className="mt-3 text-sm text-muted-foreground">{totalEntries ? `${totalEntries} work task${totalEntries === 1 ? "" : "s"} available for matching.` : "Add work tasks above before generating."}</p><Button type="button" onClick={generateTailoredResume} disabled={isTailoring || !jobDescription.trim() || !totalEntries} className="mt-5 h-12 w-full rounded-pill text-base" data-testid="generate-tailored-resume">{isTailoring ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Matching your work...</> : <><Sparkles className="mr-2 h-5 w-5" /> Generate Tailored Resume</>}</Button></Card>
            <Card className="rounded-panel border-border/70 bg-card p-5 shadow-md"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><h3 className="text-2xl font-semibold tracking-tight">Tailored preview</h3>{tailoredResume && <div className="flex gap-2"><Select value={downloadFormat} onValueChange={(value: DownloadFormat) => setDownloadFormat(value)}><SelectTrigger className="w-32 bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pdf">PDF</SelectItem><SelectItem value="docx">Word</SelectItem><SelectItem value="txt">Text</SelectItem></SelectContent></Select><Button type="button" variant="outline" onClick={downloadTailoredResume} aria-label="Download tailored resume"><FileDown className="mr-2 h-4 w-4" />Download</Button></div>}</div><div className="mt-4 min-h-80 rounded-lg border border-border bg-muted/30 p-5">{tailoredResume ? <Textarea value={tailoredResume} onChange={(event) => setTailoredResume(event.target.value)} className="min-h-72 resize-none border-0 bg-transparent p-0 font-mono text-sm focus:ring-0" aria-label="Tailored resume preview" /> : <div className="flex min-h-72 items-center justify-center text-center text-muted-foreground">{isTailoring ? "Selecting the strongest evidence..." : totalEntries === 0 ? "Your saved work tasks will appear here after you add them." : "Your tailored work experience will appear here."}</div>}</div></Card>
          </div>
        </div>
      </section>
    </>
  );
}
