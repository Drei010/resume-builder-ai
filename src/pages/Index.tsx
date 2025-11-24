import { useState } from "react";
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
import jsPDF from "jspdf";
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [jobInfo, setJobInfo] = useState("");
  const [resume, setResume] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiProvider, setAiProvider] = useState<"gemini" | "openai">("openai");
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "docx" | "txt">(
    "pdf"
  );

  const handleGenerate = async () => {
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
        body: JSON.stringify({ jobInfo, aiProvider }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("messages.error"));
      }

      const data = await response.json();
      setResume(data.resume);
      toast.success(t("messages.success"));
    } catch (error: any) {
      console.error("Error generating resume:", error);
      toast.error(error.message || t("messages.error"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddMoreDetails = () => {
    setResume("");
  };

  const handleRegenerateResume = async () => {
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
        body: JSON.stringify({ jobInfo, aiProvider }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("messages.regenerateError"));
      }

      const data = await response.json();
      setResume(data.resume);
      toast.success(t("messages.regenerateSuccess"));
    } catch (error: any) {
      console.error("Error regenerating resume:", error);
      toast.error(error.message || t("messages.regenerateError"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!resume) {
      toast.error(t("messages.noResume"));
      return;
    }

    try {
      if (downloadFormat === "pdf") {
        downloadPDF();
      } else if (downloadFormat === "docx") {
        await downloadDocx();
      } else if (downloadFormat === "txt") {
        downloadTxt();
      }
    } catch (error) {
      console.error("Error downloading resume:", error);
      toast.error(t("messages.downloadError"));
    }
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;

      const lines = doc.splitTextToSize(resume, maxWidth);
      let y = margin;
      const lineHeight = 7;

      lines.forEach((line: string) => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });

      doc.save("resume.pdf");
      toast.success(t("messages.downloadPdf"));
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  };

  const downloadDocx = async () => {
    try {
      const paragraphs = resume.split("\n").map((line) => new Paragraph(line));
      const doc = new Document({ sections: [{ children: paragraphs }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, "resume.docx");
      toast.success(t("messages.downloadDocx"));
    } catch (error) {
      console.error("Error generating DOCX:", error);
      throw error;
    }
  };

  const downloadTxt = () => {
    try {
      const blob = new Blob([resume], { type: "text/plain" });
      saveAs(blob, "resume.txt");
      toast.success(t("messages.downloadTxt"));
    } catch (error) {
      console.error("Error generating TXT:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="icon"
          className="rounded-full bg-background border-border hover:bg-secondary"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary tracking-wide">
              {t("landing.logo")}
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            {t("landing.title")}{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              {t("landing.highlight")}
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("landing.description")}
          </p>
        </div>

        {/* Input Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card className="p-6 border bg-card">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              {t("input.label")}
            </h2>
            <Textarea
              placeholder={t("input.placeholder")}
              value={jobInfo}
              onChange={(e) => setJobInfo(e.target.value)}
              className="min-h-[400px] resize-none text-base border-input focus:border-primary transition-smooth"
            />
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {t("input.provider")}
                </label>
                <Select
                  value={aiProvider}
                  onValueChange={(value: "openai" | "gemini") =>
                    setAiProvider(value)
                  }
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="openai">{t("input.openai")}</SelectItem>
                    <SelectItem value="gemini">{t("input.gemini")}</SelectItem>
                  </SelectContent>
                </Select>
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
          <Card className="p-6 border bg-card flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">
                {t("preview.label")}
              </h2>
              {resume && (
                <div className="flex gap-2">
                  <Select
                    value={downloadFormat}
                    onValueChange={(value: any) => setDownloadFormat(value)}
                  >
                    <SelectTrigger className="w-40 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="pdf">
                        {t("preview.format.pdf")}
                      </SelectItem>
                      <SelectItem value="docx">
                        {t("preview.format.docx")}
                      </SelectItem>
                      <SelectItem value="txt">
                        {t("preview.format.txt")}
                      </SelectItem>
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
                  className="h-full resize-none border-0 bg-transparent p-0 text-sm font-mono text-foreground focus:ring-0"
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

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="p-6 text-center border bg-card hover:border-primary/30 transition-smooth">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold mb-2 text-foreground text-lg">
              {t("features.aiPowered.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("features.aiPowered.description")}
            </p>
          </Card>
          <Card className="p-6 text-center border bg-card hover:border-secondary/30 transition-smooth">
            <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-2 text-foreground text-lg">
              {t("features.atsFriendly.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("features.atsFriendly.description")}
            </p>
          </Card>
          <Card className="p-6 text-center border bg-card hover:border-primary/30 transition-smooth">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileDown className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold mb-2 text-foreground text-lg">
              {t("features.instantDownload.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("features.instantDownload.description")}
            </p>
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
  );
};

export default Index;
