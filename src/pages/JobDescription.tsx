import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileDown,
  Loader2,
  Link2,
  Sparkles,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/api-config";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";

type JobDetails = {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
};

const allowedExtensions = [".pdf", ".docx", ".txt"];

const JobDescription = () => {
  const [jobUrl, setJobUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resume, setResume] = useState("");
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiProvider, setAiProvider] = useState<"gemini" | "openai">("openai");
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "docx" | "txt">(
    "pdf"
  );

  const isValidLinkedInUrl = (value: string) =>
    /https?:\/\/(www\.)?linkedin\.com\/jobs\/view\/\d+/i.test(value.trim());

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setResumeFile(null);
      return;
    }

    const extension = `.${file.name.split(".").pop() || ""}`.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      toast.error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
      event.target.value = "";
      setResumeFile(null);
      return;
    }

    setResumeFile(file);
  };

  const handleGenerate = async () => {
    if (!resumeFile) {
      toast.error("Please upload your resume file");
      return;
    }
    if (!jobUrl.trim()) {
      toast.error("Please enter a LinkedIn job URL");
      return;
    }
    if (!isValidLinkedInUrl(jobUrl)) {
      toast.error("Please enter a valid LinkedIn job URL");
      return;
    }

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobUrl", jobUrl.trim());
      formData.append("aiProvider", aiProvider);

      const response = await fetch(API_ENDPOINTS.tailorResume, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to tailor resume");
      }

      const data = await response.json();
      setResume(data.resume);
      setJobDetails(data.jobDetails || null);
      toast.success("Resume tailored successfully!");
    } catch (error: any) {
      console.error("Error tailoring resume:", error);
      toast.error(error.message || "Failed to tailor resume");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setResume("");
    setJobDetails(null);
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
  };

  const downloadDocx = async () => {
    const paragraphs = resume.split("\n").map((line) => new Paragraph(line));
    const doc = new Document({ sections: [{ children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "resume.docx");
    toast.success("Word document downloaded successfully!");
  };

  const downloadTxt = () => {
    const blob = new Blob([resume], { type: "text/plain" });
    saveAs(blob, "resume.txt");
    toast.success("Text file downloaded successfully!");
  };

  return (
    <PageShell>
      <div className="text-center mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-primary tracking-wide">
            Resume Tailoring
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Tailor your resume to a{" "}
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            LinkedIn job post
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload your resume and paste the job URL. The AI extracts role
          requirements and rewrites your resume to match the posting.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <Card className="p-6 border bg-card">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Your Inputs
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Resume Upload
              </label>
              <Input type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} />
              {resumeFile && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Selected: {resumeFile.name}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                LinkedIn Job Post URL
              </label>
              <Input
                type="url"
                placeholder="https://www.linkedin.com/jobs/view/4327959806/"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                AI Provider
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
                  <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                  <SelectItem value="gemini">Google Gemini 2.0 Flash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!resume ? (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full h-12 text-base font-semibold transition-smooth bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Tailoring Resume...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-5 w-5" />
                    Tailor Resume
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
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
                      <Link2 className="mr-2 h-5 w-5" />
                      Regenerate Resume
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={isGenerating}
                  variant="outline"
                  className="w-full h-12 text-base font-semibold transition-smooth border-border hover:bg-secondary/20"
                  size="lg"
                >
                  Clear Output
                </Button>
              </div>
            )}

            {jobDetails && (
              <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Extracted Job Details
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {jobDetails.title && (
                    <div>
                      <span className="text-foreground font-medium">Title:</span>{" "}
                      {jobDetails.title}
                    </div>
                  )}
                  {jobDetails.company && (
                    <div>
                      <span className="text-foreground font-medium">
                        Company:
                      </span>{" "}
                      {jobDetails.company}
                    </div>
                  )}
                  {jobDetails.location && (
                    <div>
                      <span className="text-foreground font-medium">
                        Location:
                      </span>{" "}
                      {jobDetails.location}
                    </div>
                  )}
                  {jobDetails.description && (
                    <div className="text-xs text-muted-foreground pt-2">
                      {jobDetails.description.length > 260
                        ? `${jobDetails.description.slice(0, 260)}...`
                        : jobDetails.description}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 border bg-card flex flex-col h-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Tailored Resume
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
                className="h-full min-h-[400px] resize-none border-0 bg-transparent p-0 text-sm font-mono text-foreground focus:ring-0"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <Sparkles className="w-12 h-12 mx-auto opacity-20" />
                  <p>Your tailored resume will appear here</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  );
};

export default JobDescription;
