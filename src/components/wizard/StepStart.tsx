import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Wand2 } from "lucide-react";
import { extractResumeText } from "@/lib/resume-text-extract";
import { API_ENDPOINTS } from "@/lib/api-config";
import { AiLoader } from "@/components/AiLoader";
import type { Profile } from "@/lib/profile-store";
import type { Company, WorkEntry } from "@/lib/work-db";
import { loadSavedResumes, type SavedResume } from "@/lib/saved-resume-store";

type ParsedResponse = {
  profile?: Profile;
  companies?: { name?: string; jobTitle?: string; location?: string }[];
  entries?: { companyName?: string; startMonth?: string; endMonth?: string | null; task?: string }[];
};

export function StepStart({
  onNext,
  onParsed,
  onSavedResume,
}: {
  onNext: () => void;
  onParsed: (p: Profile, companies: Company[], entries: WorkEntry[], raw: string) => void;
  onSavedResume: (resume: string) => void;
}) {
  const [paste, setPaste] = useState("");
  const [savedResumes] = useState<SavedResume[]>(loadSavedResumes);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parse = async (text: string) => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(API_ENDPOINTS.parseResume, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: text }),
      });
      if (!res.ok) throw new Error("Could not parse resume — try pasting the text instead.");
      const data = (await res.json()) as ParsedResponse;
      const companies: Company[] = (data.companies ?? []).map((c) => ({
        id: crypto.randomUUID(),
        name: c.name ?? "",
        jobTitle: c.jobTitle ?? "",
        ...(c.location ? { location: c.location } : {}),
      }));
      const entries: WorkEntry[] = (data.entries ?? []).map((e) => ({
        id: crypto.randomUUID(),
        companyId: companies.find((c) => c.name === e.companyName)?.id ?? companies[0]?.id ?? "",
        startMonth: e.startMonth ?? "",
        endMonth: e.endMonth ?? null,
        task: e.task ?? "",
      }));
      const profile: Profile = {
        fullName: "", email: "", phone: "", linkedin: "",
        github: "", location: "", education: "", skills: "", certifications: "",
        ...(data.profile ?? {}),
      };
      onParsed(profile, companies, entries, text);
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not parse resume.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">How would you like to begin?</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Start with a clean slate or let AI organize the experience you already have.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Start fresh */}
        <Card className="flex flex-col rounded-panel border-border/70 p-7 shadow-none">
          <h2 className="text-2xl font-semibold tracking-tight">Start fresh</h2>
          <p className="mt-3 flex-1 text-muted-foreground">
            Fill in your profile and work history step by step. Takes about 3 minutes.
          </p>
          <Button
            className="mt-7 w-full rounded-pill"
            onClick={onNext}
            data-testid="start-fresh"
          >
            Start fresh ↗
          </Button>
        </Card>

        {/* Upload or paste */}
        <Card className="flex flex-col rounded-panel border-border/70 p-7 shadow-none">
          <h2 className="text-2xl font-semibold tracking-tight">Upload existing resume</h2>
          <p className="mt-3 text-muted-foreground">
            We'll extract the facts from a PDF, DOCX, or TXT and pre-fill everything.
          </p>

          <div className="mt-5 rounded-2xl border border-dashed border-border bg-secondary/40 p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              disabled={busy}
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setFileName(file.name);
                const { text } = await extractResumeText(file);
                await parse(text);
              }}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">{fileName || "Choose a file"}</p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, TXT, or Markdown</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 rounded-pill"
              >
                <Upload className="mr-2 h-4 w-4" />
                Browse
              </Button>
            </div>
          </div>

          <p className="my-4 text-center text-sm text-muted-foreground">or paste the text</p>

          <Textarea
            aria-label="Resume text"
            placeholder="Paste resume text here..."
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            className="min-h-28 resize-none rounded-2xl bg-background"
          />

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <Button
            className="mt-4 w-full rounded-pill"
            disabled={busy || !paste.trim()}
            onClick={() => parse(paste)}
          >
            {busy
              ? <AiLoader message="Reading your resume with AI…" />
              : <><Wand2 className="mr-2 h-4 w-4" /> Use this resume</>}
          </Button>
        </Card>
      </div>

      {savedResumes.length > 0 && (
        <section className="space-y-4" aria-labelledby="saved-resumes-start-title" data-testid="saved-resume-option">
          <div>
            <h2 id="saved-resumes-start-title" className="text-2xl font-semibold tracking-tight">Continue with a saved resume</h2>
            <p className="mt-2 text-muted-foreground">Open a previous version to review or tailor it for a new role.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {savedResumes.map((saved) => (
              <Card key={saved.id} className="flex flex-col rounded-panel border-border/70 p-5 shadow-none">
                <div className="flex-1">
                  <h3 className="font-semibold">{saved.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Saved {new Date(saved.createdAt).toLocaleDateString()}</p>
                  <p className="mt-4 line-clamp-3 whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">{saved.text}</p>
                </div>
                <Button type="button" variant="outline" className="mt-5 w-full rounded-pill" onClick={() => onSavedResume(saved.text)}>
                  Open saved resume ↗
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
