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
import { Loader2, FileDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";

const Index = () => {
  const [jobInfo, setJobInfo] = useState("");
  const [resume, setResume] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiProvider, setAiProvider] = useState<"gemini" | "openai">("gemini");
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "docx" | "txt">(
    "pdf"
  );

  const handleGenerate = async () => {
    if (!jobInfo.trim()) {
      toast.error("Please enter your job information");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(
        "http://localhost:3001/api/generate-resume",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ jobInfo, aiProvider }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate resume");
      }

      const data = await response.json();
      setResume(data.resume);
      toast.success("Resume generated successfully!");
    } catch (error: any) {
      console.error("Error generating resume:", error);
      toast.error(error.message || "Failed to generate resume");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddMoreDetails = () => {
    setResume("");
    // Focus back on job info textarea
    const textarea = document.querySelector(
      'textarea[placeholder*="Paste or type"]'
    ) as HTMLTextAreaElement;
    if (textarea) textarea.focus();
  };

  const handleRegenerateResume = async () => {
    if (!jobInfo.trim()) {
      toast.error("Please enter your job information");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(
        "http://localhost:3001/api/generate-resume",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ jobInfo, aiProvider }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate resume");
      }

      const data = await response.json();
      setResume(data.resume);
      toast.success("Resume regenerated successfully!");
    } catch (error: any) {
      console.error("Error regenerating resume:", error);
      toast.error(error.message || "Failed to regenerate resume");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!resume) {
      toast.error("No resume to download");
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
      toast.error("Failed to download resume");
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
      toast.success("PDF downloaded successfully!");
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
      toast.success("Word document downloaded successfully!");
    } catch (error) {
      console.error("Error generating DOCX:", error);
      throw error;
    }
  };

  const downloadTxt = () => {
    try {
      const blob = new Blob([resume], { type: "text/plain" });
      saveAs(blob, "resume.txt");
      toast.success("Text file downloaded successfully!");
    } catch (error) {
      console.error("Error generating TXT:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary tracking-wide">
              TalentEdge-AI
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Transform Your Experience into a{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Standout Resume
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Paste your unorganized job details and let AI create an
            ATS-friendly, Harvard-format resume in seconds
          </p>
        </div>

        {/* Input Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card className="p-6 border bg-card">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Your Job Information
            </h2>
            <Textarea
              placeholder="Paste or type your job details here...&#10;&#10;Example: I admined 16 repositories in GitHub. I supported 3 applications providing technical assistance..."
              value={jobInfo}
              onChange={(e) => setJobInfo(e.target.value)}
              className="min-h-[400px] resize-none text-base border-input focus:border-primary transition-smooth"
            />
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  AI Provider
                </label>
                <Select
                  value={aiProvider}
                  onValueChange={(value: "gemini" | "openai") =>
                    setAiProvider(value)
                  }
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="gemini">
                      Google Gemini 2.0 Flash
                    </SelectItem>
                    <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
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
                      Generating Resume...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Resume
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
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Regenerate Resume
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
                    Add More Details
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Preview Section */}
          <Card className="p-6 border bg-card flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">
                Resume Preview
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
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="docx">Word (.docx)</SelectItem>
                      <SelectItem value="txt">Text (.txt)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="gap-2 border-border hover:bg-secondary/20 transition-smooth"
                  >
                    <FileDown className="h-4 w-4" />
                    Download
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
                    <p>Your AI-generated resume will appear here</p>
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
              AI-Powered
            </h3>
            <p className="text-sm text-muted-foreground">
              Advanced AI transforms your raw data into polished content
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
              ATS-Friendly
            </h3>
            <p className="text-sm text-muted-foreground">
              Optimized to pass Applicant Tracking Systems
            </p>
          </Card>
          <Card className="p-6 text-center border bg-card hover:border-primary/30 transition-smooth">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileDown className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold mb-2 text-foreground text-lg">
              Instant Download
            </h3>
            <p className="text-sm text-muted-foreground">
              Export your resume as PDF with one click
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
