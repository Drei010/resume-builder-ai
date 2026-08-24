import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  FileDown,
  Sparkles,
  Linkedin,
  Github,
  Mail,
  Moon,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { SOCIAL_LINKS } from "@/lib/constants";
import { API_ENDPOINTS } from "@/lib/api-config";
import { downloadDocx, downloadPDF, downloadTxt } from "@/lib/resume-export";
import { WorkDatabaseSection } from "@/components/WorkDatabaseSection";

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const toolRef = useRef<HTMLDivElement>(null);
  const [jobInfo, setJobInfo] = useState("");
  const [resume, setResume] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "docx" | "txt">(
    "pdf"
  );
  const jobInfoRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const focusTool = () => {
    toolRef.current?.scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => jobInfoRef.current?.focus(), 450);
  };

  const generateResume = async (successMessage: string) => {
    if (!jobInfo.trim()) {
      toast.error(t("messages.noJobInfo"));
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(API_ENDPOINTS.generateResume, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobInfo }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || t("messages.error"));
      }

      const data = await response.json().catch(() => {
        throw new Error(t("messages.error"));
      });
      setResume(data.resume);
      toast.success(successMessage);
    } catch (error) {
      console.error("Error generating resume:", error);
      const message =
        error instanceof Error ? error.message : t("messages.error");
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => generateResume(t("messages.success"));

  const handleAddMoreDetails = () => {
    setResume("");
    jobInfoRef.current?.focus();
  };

  const handleRegenerateResume = () =>
    generateResume(t("messages.regenerateSuccess"));

  const handleDownload = async () => {
    if (!resume) {
      toast.error(t("messages.noResume"));
      return;
    }

    try {
      if (downloadFormat === "pdf") {
        downloadPDF(resume);
      } else if (downloadFormat === "docx") {
        await downloadDocx(resume);
      } else if (downloadFormat === "txt") {
        downloadTxt(resume);
      }
    } catch (error) {
      console.error("Error downloading resume:", error);
      toast.error(t("messages.downloadError"));
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#tool" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-pill focus:bg-primary focus:px-5 focus:py-3 focus:text-primary-foreground">
        Skip to resume builder
      </a>
      <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="fixed top-0 right-0 -z-10 h-0 w-0 overflow-hidden" aria-hidden="true" />
        <div className="mx-auto flex max-w-wide items-center gap-5 px-4 py-3 sm:px-6 lg:px-10">
          <a href="#top" className="shrink-0 text-base font-semibold tracking-tight">TalentEdge AI</a>
          <div className="flex min-w-0 flex-1 snap-x gap-1 overflow-x-auto text-sm text-muted-foreground">
            <a href="#highlights" className="shrink-0 rounded-pill px-3 py-2 hover:bg-secondary hover:text-foreground">Highlights</a>
            <a href="#closer-look" className="shrink-0 rounded-pill px-3 py-2 hover:bg-secondary hover:text-foreground">Closer look</a>
            <a href="#tool" className="shrink-0 rounded-pill px-3 py-2 hover:bg-secondary hover:text-foreground">Builder</a>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <select
              aria-label="Language"
              value={i18n.language}
              onChange={(event) => {
                const language = event.target.value;
                i18n.changeLanguage(language);
                localStorage.setItem("language", language);
                document.documentElement.lang = language;
              }}
              className="hidden h-10 rounded-pill border border-border bg-background px-3 text-sm sm:block"
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="tl">TL</option>
            </select>
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-pill bg-background"
              data-testid="theme-toggle"
              aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Button onClick={focusTool} className="hidden rounded-pill sm:inline-flex">Create</Button>
          </div>
        </div>
      </nav>

      <main id="top">
        <section className="mx-auto max-w-content px-4 pb-24 pt-24 text-center sm:px-6 sm:pb-32 sm:pt-36 lg:pt-48">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-primary">TalentEdge AI</p>
          <h1 className="mx-auto max-w-4xl text-hero font-semibold text-balance"><span>{t("landing.title")}</span> <span className="text-primary">{t("landing.highlight")}</span></h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg text-muted-foreground sm:text-xl">{t("landing.description")}</p>
          <Button onClick={focusTool} size="lg" className="mt-9 min-h-12 rounded-pill px-7">{t("landing.button")} <span aria-hidden="true">↗</span></Button>
        </section>

        <WorkDatabaseSection />

        <section id="highlights" className="bg-secondary/70 px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-wide">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">01 — {t("landing.highlightsEyebrow")}</p>
            <h2 className="max-w-3xl text-section">{t("landing.highlightsTitle")}</h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {["aiPowered", "atsFriendly", "instantDownload"].map((feature) => (
                <Card key={feature} className="rounded-panel border-0 bg-background p-7 shadow-none sm:p-9">
                  <Sparkles className="mb-12 h-6 w-6 text-primary" />
                  <h3 className="text-2xl font-semibold tracking-tight">{t(`features.${feature}.title`)}</h3>
                  <p className="mt-3 text-muted-foreground">{t(`features.${feature}.description`)}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="closer-look" className="px-4 py-20 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-content">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">02 — {t("landing.closerEyebrow")}</p>
            <h2 className="max-w-3xl text-section">{t("landing.closerTitle")}</h2>
            <div className="mt-14 divide-y divide-border border-y border-border">
              {(t("landing.closerItems", { returnObjects: true }) as string[]).map((title, index) => (
                <div key={title} className="grid gap-4 py-8 sm:grid-cols-[100px_1fr] sm:py-10">
                  <span className="text-sm font-semibold text-primary">0{index + 1}</span>
                  <div><h3 className="text-2xl font-semibold tracking-tight">{title}</h3><p className="mt-2 max-w-xl text-muted-foreground">{t("landing.closerDescription")}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div ref={toolRef} id="tool" className="scroll-mt-20 bg-secondary/70">
          <div className="container mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">03 — {t("landing.toolEyebrow")}</p>
            <h2 className="mb-10 text-section">{t("landing.toolTitle")}</h2>
        {/* Input Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card className="rounded-panel border-border/70 bg-card p-5 shadow-md">
            <h2 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">{t("input.label")}</h2>
            <Textarea
              ref={jobInfoRef}
              placeholder={t("input.placeholder")}
              value={jobInfo}
              onChange={(e) => setJobInfo(e.target.value)}
              className="min-h-[400px] resize-none rounded-2xl border-input bg-background text-base focus:border-primary transition-smooth"
              aria-label={t("input.label")}
            />
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <p className="text-sm font-medium text-foreground">{t("input.provider")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("input.openai")}
                </p>
              </div>
              {!resume ? (
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !jobInfo.trim()}
                  className="w-full h-12 text-base font-semibold transition-smooth bg-gradient-primary hover:opacity-90"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t("input.generatingBtn")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      {t("input.generateBtn")}
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={handleRegenerateResume}
                    disabled={isGenerating || !jobInfo.trim()}
                    className="w-full h-12 text-base font-semibold transition-smooth bg-gradient-primary hover:opacity-90"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t("input.regeneratingBtn")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        {t("input.regenerateBtn")}
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleAddMoreDetails}
                    disabled={isGenerating}
                    variant="outline"
                    className="w-full h-12 text-base font-semibold transition-smooth border-border hover:bg-secondary/20"
                    size="lg"
                  >
                    {t("input.addDetailsBtn")}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Preview Section */}
          <Card className="rounded-panel border-border/70 bg-card p-5 shadow-md flex flex-col h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {t("preview.label")}
              </h2>
              {resume && (
                <div className="flex gap-2">
                  <Select
                    value={downloadFormat}
                    onValueChange={(value: "pdf" | "docx" | "txt") =>
                      setDownloadFormat(value)
                    }
                  >
                    <SelectTrigger className="w-40 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="pdf">{t("preview.format.pdf")}</SelectItem>
                      <SelectItem value="docx">{t("preview.format.docx")}</SelectItem>
                      <SelectItem value="txt">{t("preview.format.txt")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="gap-2 border-border hover:bg-secondary/20 transition-smooth"
                  >
                    <FileDown className="h-4 w-4" />
                    {t("preview.downloadBtn")}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex-1 bg-muted/30 rounded-lg p-6 border border-border overflow-y-auto">
              {resume ? (
                <Textarea
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  className="h-full min-h-[400px] resize-none border-0 bg-transparent p-0 text-sm font-mono text-foreground focus:ring-0"
                  aria-label={t("preview.label")}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-2">
                    <Sparkles className="w-12 h-12 mx-auto opacity-20" />
                    <p>{t("preview.placeholder")}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex justify-center gap-6">
            <a
              href={SOCIAL_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-6 h-6" />
            </a>
            <a
              href={SOCIAL_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              aria-label="GitHub"
            >
              <Github className="w-6 h-6" />
            </a>
            <a
              href={`mailto:${SOCIAL_LINKS.email}`}
              className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              aria-label="Email"
            >
              <Mail className="w-6 h-6" />
            </a>
          </div>
        </div>
          </div>
        </div>
        <footer className="mt-20 flex flex-col gap-5 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>TalentEdge AI<span className="align-super text-[10px]">®</span> — Your experience, clearly expressed.</p>
          <div className="flex items-center gap-5">
            <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">LinkedIn</a>
            <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a>
            <a href={`mailto:${SOCIAL_LINKS.email}`} className="hover:text-foreground">Email</a>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
