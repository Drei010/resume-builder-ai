import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { addSavedResume } from "@/lib/saved-resume-store";
import { toast } from "sonner";
import { downloadDocx, downloadPDF, downloadTxt } from "@/lib/resume-export";
import { resumeToLatex } from "@/lib/resume-latex";

export function StepPreview({
  resume,
  onChange,
}: {
  resume: string;
  onChange: (v: string) => void;
}) {
  const [tab, setTab] = useState<"preview" | "latex">("preview");
  const [latex, setLatex] = useState(() => resumeToLatex(resume));
  const [title, setTitle] = useState("My tailored resume");
  const saveResume = () => { if (!resume.trim()) return; addSavedResume(resume, title.trim() || "Untitled resume"); toast.success("Resume saved to your library."); };

  const switchToLatex = () => {
    setLatex(resumeToLatex(resume));
    setTab("latex");
  };

  const copyLatex = async () => {
    await navigator.clipboard.writeText(latex);
    toast.success("LaTeX copied to clipboard.");
  };

  return (
    <div className="space-y-8" data-testid="step-preview">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your tailored resume</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Review and edit directly in the preview, then download in the format you need.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-pill border border-border bg-muted p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`rounded-pill px-5 py-2 text-sm font-medium transition-colors ${tab === "preview" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={switchToLatex}
          className={`rounded-pill px-5 py-2 text-sm font-medium transition-colors ${tab === "latex" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          LaTeX source
        </button>
      </div>

      {/* Preview pane */}
      {tab === "preview" ? (
        <div className="mx-auto max-w-3xl rounded-lg bg-white shadow-xl ring-1 ring-border/10">
          <div className="px-12 py-10">
            <textarea
              value={resume}
              onChange={(e) => onChange(e.target.value)}
              className="min-h-[680px] w-full resize-none border-0 font-mono text-sm leading-relaxed text-gray-900 outline-none"
              aria-label="Resume preview — click to edit"
              spellCheck
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <textarea
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            className="min-h-[600px] w-full resize-none rounded-xl border border-border bg-gray-950 p-6 font-mono text-sm leading-relaxed text-gray-100 outline-none focus:ring-2 focus:ring-primary"
            aria-label="Editable LaTeX source"
            spellCheck={false}
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={copyLatex} className="rounded-pill">
              <Copy className="mr-2 h-4 w-4" /> Copy LaTeX
            </Button>
            <Button variant="ghost" onClick={() => setLatex(resumeToLatex(resume))} className="rounded-pill">
              Reset from preview
            </Button>
          </div>
        </div>
      )}

      {/* Save and downloads */}
      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Resume name" className="max-w-xs" aria-label="Saved resume name" />
        <Button variant="outline" onClick={saveResume} className="rounded-pill"><Save className="mr-2 h-4 w-4" /> Save resume</Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => downloadPDF(resume)} className="rounded-pill">
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
        <Button variant="outline" onClick={() => downloadDocx(resume)} className="rounded-pill">
          <Download className="mr-2 h-4 w-4" /> Download DOCX
        </Button>
        <Button variant="outline" onClick={() => downloadTxt(resume)} className="rounded-pill">
          <Download className="mr-2 h-4 w-4" /> Download TXT
        </Button>
      </div>
    </div>
  );
}
