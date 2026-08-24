import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, FileDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SOCIAL_LINKS } from "@/lib/constants";
import { API_ENDPOINTS } from "@/lib/api-config";
import { downloadDocx, downloadPDF, downloadTxt } from "@/lib/resume-export";
import { WorkDatabaseSection } from "@/components/WorkDatabaseSection";
import { AppHeader } from "@/components/AppHeader";
import { SavedResumesSection } from "@/components/SavedResumesSection";
import { useGsap } from "@/hooks/use-gsap";
import gsap from "gsap";

const Index = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const toolRef = useRef<HTMLDivElement>(null);
  const jobInfoRef = useRef<HTMLTextAreaElement>(null);
  const [jobInfo, setJobInfo] = useState("");
  const [resume, setResume] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "docx" | "txt">("pdf");
  const motionRef = useGsap<HTMLElement>((root, reducedMotion) => {
    if (reducedMotion) return;
    const hero = root.querySelector<HTMLElement>("[data-motion-hero]");
    const heroItems = hero?.querySelectorAll<HTMLElement>("[data-motion-item]");
    if (heroItems?.length) gsap.from(heroItems, { y: 22, opacity: 0, duration: 0.65, stagger: 0.08, ease: "power3.out" });
    root.querySelectorAll<HTMLElement>("[data-motion-section]").forEach((section) => {
      const items = section.querySelectorAll<HTMLElement>("[data-motion-item]");
      if (items.length) gsap.from(items, { y: 24, opacity: 0, duration: 0.55, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: section, start: "top 82%", once: true } });
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const focusTool = () => {
    toolRef.current?.scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => jobInfoRef.current?.focus(), 450);
  };

  const generateResume = async (successMessage: string) => {
    if (!jobInfo.trim()) { toast.error(t("messages.noJobInfo")); return; }
    setIsGenerating(true);
    try {
      const response = await fetch(API_ENDPOINTS.generateResume, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobInfo }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || t("messages.error"));
      }
      const data = await response.json().catch(() => { throw new Error(t("messages.error")); });
      setResume(data.resume);
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("messages.error"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!resume) { toast.error(t("messages.noResume")); return; }
    try {
      if (downloadFormat === "pdf") downloadPDF(resume);
      else if (downloadFormat === "docx") await downloadDocx(resume);
      else downloadTxt(resume);
    } catch {
      toast.error(t("messages.downloadError"));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#tool" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-pill focus:bg-primary focus:px-5 focus:py-3 focus:text-primary-foreground">
        Skip to resume builder
      </a>

      <AppHeader
        center={
          <>
            <a href="#highlights" className="shrink-0 rounded-pill px-3 py-2 hover:bg-secondary hover:text-foreground">Highlights</a>
            <a href="#closer-look" className="shrink-0 rounded-pill px-3 py-2 hover:bg-secondary hover:text-foreground">Closer look</a>
            <a href="#tool" className="shrink-0 rounded-pill px-3 py-2 hover:bg-secondary hover:text-foreground">Builder</a>
          </>
        }
        right={
          <Button onClick={() => navigate("/create")} className="hidden rounded-pill sm:inline-flex">Create</Button>
        }
      />

      <main id="top" ref={motionRef}>
        {/* Hero */}
        <section data-motion-hero className="mx-auto max-w-content px-4 pb-24 pt-24 text-center sm:px-6 sm:pb-32 sm:pt-36 lg:pt-48">
          <h1 data-motion-item className="mx-auto max-w-4xl text-hero font-semibold text-balance">
            <span>{t("landing.title")}</span> <span className="text-primary">{t("landing.highlight")}</span>
          </h1>
          <p data-motion-item className="mx-auto mt-7 max-w-2xl text-lg text-muted-foreground sm:text-xl">{t("landing.description")}</p>
          <Button data-motion-item onClick={() => navigate("/create")} size="lg" className="mt-9 min-h-12 rounded-pill px-7">
            {t("landing.button")} <span aria-hidden="true">↗</span>
          </Button>
        </section>

        {/* Work library */}
        <WorkDatabaseSection />
        <SavedResumesSection />

        {/* Highlights — clean text layout, no icon cards */}
        <section id="highlights" data-motion-section className="bg-secondary/70 px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-wide">
            <h2 data-motion-item className="max-w-3xl text-section">{t("landing.highlightsTitle")}</h2>
            <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-3">
              {(["aiPowered", "atsFriendly", "instantDownload"] as const).map((key) => (
                <div key={key} data-motion-item>
                  <h3 className="text-xl font-semibold tracking-tight">{t(`features.${key}.title`)}</h3>
                  <p className="mt-3 text-muted-foreground">{t(`features.${key}.description`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closer look — numbered steps with distinct descriptions */}
        <section id="closer-look" data-motion-section className="px-4 py-20 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-content">
            <h2 data-motion-item className="max-w-3xl text-section">{t("landing.closerTitle")}</h2>
            <div className="mt-14 divide-y divide-border border-y border-border">
              {(t("landing.closerItems", { returnObjects: true }) as string[]).map((title, index) => (
                <div key={title} data-motion-item className="grid gap-4 py-8 sm:grid-cols-[80px_1fr] sm:py-10">
                  <span className="text-sm font-semibold tabular-nums text-primary">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                    <p className="mt-2 max-w-xl text-muted-foreground">
                      {t(`landing.closerDescriptions.${index}`, { defaultValue: t("landing.closerDescription") })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Builder */}
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

        {/* Footer */}
        <footer className="mx-auto max-w-wide px-4 py-10 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-5 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>TalentEdge AI<span className="align-super text-[10px]">®</span> — Your experience, clearly expressed.</p>
            <div className="flex items-center gap-5">
              <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">LinkedIn</a>
              <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a>
              <a href={`mailto:${SOCIAL_LINKS.email}`} className="hover:text-foreground">Email</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
