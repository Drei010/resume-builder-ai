import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { API_ENDPOINTS } from "@/lib/api-config";
import { downloadDocx, downloadPDF, downloadTxt } from "@/lib/resume-export";

export function ResumeBuilderSection() {
  const { t } = useTranslation();
  const toolRef = useRef<HTMLDivElement>(null);
  const jobInfoRef = useRef<HTMLTextAreaElement>(null);
  const [jobInfo, setJobInfo] = useState("");
  const [resume, setResume] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "docx" | "txt">("pdf");

  const generateResume = async (successMessage: string) => {
    if (!jobInfo.trim()) { toast.error(t("messages.noJobInfo")); return; }
    setIsGenerating(true);
    try {
      const response = await fetch(API_ENDPOINTS.generateResume, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobInfo }) });
      if (!response.ok) throw new Error(t("messages.error"));
      const data = await response.json();
      setResume(data.resume);
      toast.success(successMessage);
    } catch (error) { toast.error(error instanceof Error ? error.message : t("messages.error")); }
    finally { setIsGenerating(false); }
  };

  const handleDownload = async () => {
    if (!resume) { toast.error(t("messages.noResume")); return; }
    try { if (downloadFormat === "pdf") downloadPDF(resume); else if (downloadFormat === "docx") await downloadDocx(resume); else downloadTxt(resume); }
    catch { toast.error(t("messages.downloadError")); }
  };

  return (
<div ref={toolRef} id="tool" data-motion-section className="scroll-mt-20 bg-secondary/70">
  <div className="container mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
    <h2 data-motion-item className="mb-10 text-section">{t("landing.toolTitle")}</h2>
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Input */}
      <Card data-motion-item className="rounded-panel border-border/70 bg-card p-5 shadow-md">
        <h3 className="mb-4 text-2xl font-semibold tracking-tight">{t("input.label")}</h3>
        <Textarea
          ref={jobInfoRef}
          placeholder={t("input.placeholder")}
          value={jobInfo}
          onChange={(e) => setJobInfo(e.target.value)}
          className="min-h-[400px] resize-none rounded-2xl border-input bg-background text-base focus:border-primary"
          aria-label={t("input.label")}
        />
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border bg-background px-4 py-3">
            <p className="text-sm font-medium">{t("input.provider")}</p>
            <p className="text-sm text-muted-foreground">{t("input.openai")}</p>
          </div>
          {!resume ? (
            <Button
              onClick={() => generateResume(t("messages.success"))}
              disabled={isGenerating || !jobInfo.trim()}
              className="h-12 w-full text-base font-semibold bg-gradient-primary hover:opacity-90"
              size="lg"
            >
              {isGenerating
                ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t("input.generatingBtn")}</>
                : <><Sparkles className="mr-2 h-5 w-5" />{t("input.generateBtn")}</>}
            </Button>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={() => generateResume(t("messages.regenerateSuccess"))}
                disabled={isGenerating || !jobInfo.trim()}
                className="h-12 w-full text-base font-semibold bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                {isGenerating
                  ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t("input.regeneratingBtn")}</>
                  : <><Sparkles className="mr-2 h-5 w-5" />{t("input.regenerateBtn")}</>}
              </Button>
              <Button
                onClick={() => { setResume(""); jobInfoRef.current?.focus(); }}
                disabled={isGenerating}
                variant="outline"
                className="h-12 w-full text-base font-semibold border-border hover:bg-secondary/20"
                size="lg"
              >
                {t("input.addDetailsBtn")}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Preview */}
      <Card className="flex flex-col rounded-panel border-border/70 bg-card p-5 shadow-md">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-2xl font-semibold tracking-tight">{t("preview.label")}</h3>
          {resume && (
            <div className="flex gap-2">
              <Select value={downloadFormat} onValueChange={(v: "pdf" | "docx" | "txt") => setDownloadFormat(v)}>
                <SelectTrigger className="w-40 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="pdf">{t("preview.format.pdf")}</SelectItem>
                  <SelectItem value="docx">{t("preview.format.docx")}</SelectItem>
                  <SelectItem value="txt">{t("preview.format.txt")}</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleDownload} variant="outline" className="gap-2 border-border hover:bg-secondary/20">
                <FileDown className="h-4 w-4" />{t("preview.downloadBtn")}
              </Button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-muted/30 p-6">
          {resume ? (
            <Textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              className="h-full min-h-[400px] resize-none border-0 bg-transparent p-0 font-mono text-sm focus:ring-0"
              aria-label={t("preview.label")}
            />
          ) : (
            <div className="flex h-full min-h-[400px] items-center justify-center text-center text-muted-foreground">
              <div className="space-y-2">
                <Sparkles className="mx-auto h-12 w-12 opacity-20" />
                <p>{t("preview.placeholder")}</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  </div>
</div>

  );
}
