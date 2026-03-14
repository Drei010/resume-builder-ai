import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { ResumeOutput } from "@/components/ResumeOutput";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  FileText,
  Link2,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  extractJobDescription,
  optimizeResume,
  type JobDescription,
} from "@/api/resumeApi";
import type { ATSCandidateSummary } from "@shared/ats";

const allowedExtensions = [".pdf", ".docx", ".txt"];

const JobDescriptionPage = () => {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [jobDescription, setJobDescription] = useState<JobDescription | null>(
    null
  );
  const [optimizedResume, setOptimizedResume] =
    useState<ATSCandidateSummary | null>(null);

  const [loadingExtraction, setLoadingExtraction] = useState(false);
  const [loadingOptimization, setLoadingOptimization] = useState(false);

  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [optimizationError, setOptimizationError] = useState<string | null>(
    null
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

  const resetPipeline = () => {
    setJobDescription(null);
    setOptimizedResume(null);
    setExtractionError(null);
    setOptimizationError(null);
  };

  const runExtraction = async () => {
    setLoadingExtraction(true);
    setExtractionError(null);

    try {
      const extracted = await extractJobDescription(linkedinUrl.trim());
      setJobDescription(extracted);
      toast.success("Job description extracted");
      return extracted;
    } catch (error: any) {
      const message =
        error?.message || "Failed to extract job description. Please try again.";
      setExtractionError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoadingExtraction(false);
    }
  };

  const runOptimization = async (extractedJob: JobDescription) => {
    if (!resumeFile) {
      throw new Error("Resume file is required");
    }

    setLoadingOptimization(true);
    setOptimizationError(null);

    try {
      const data = await optimizeResume(resumeFile, extractedJob);
      setOptimizedResume(data);
      toast.success("Resume optimization complete");
      return data;
    } catch (error: any) {
      const message =
        error?.message || "Failed to optimize resume. Please try again.";
      setOptimizationError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoadingOptimization(false);
    }
  };

  const handleGenerate = async () => {
    if (!resumeFile) {
      toast.error("Please upload your resume file");
      return;
    }
    if (!linkedinUrl.trim()) {
      toast.error("Please enter a LinkedIn job URL");
      return;
    }
    if (!isValidLinkedInUrl(linkedinUrl)) {
      toast.error("Please enter a valid LinkedIn job URL");
      return;
    }

    resetPipeline();

    try {
      const extracted = await runExtraction();
      if (extracted) {
        await runOptimization(extracted);
      }
    } catch {
      // Errors are handled in the step functions to keep UI state consistent.
    }
  };

  const extractionStatus = loadingExtraction
    ? "loading"
    : extractionError
    ? "error"
    : jobDescription
    ? "success"
    : "idle";

  const optimizationStatus = loadingOptimization
    ? "loading"
    : optimizationError
    ? "error"
    : optimizedResume
    ? "success"
    : extractionError
    ? "blocked"
    : "idle";

  const renderStatusIcon = (status: string) => {
    if (status === "loading") {
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    }
    if (status === "success") {
      return <CheckCircle2 className="h-4 w-4 text-primary" />;
    }
    if (status === "error") {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    if (status === "blocked") {
      return <span className="text-xs text-muted-foreground">Blocked</span>;
    }
    return <span className="text-xs text-muted-foreground">Idle</span>;
  };

  return (
    <PageShell>
      <div className="text-center mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-primary tracking-wide">
            Resume Tailoring Pipeline
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Two-step optimization for{" "}
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            LinkedIn job posts
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Step 1 extracts structured job data. Step 2 returns an ATS candidate
          summary JSON aligned with those requirements.
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
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loadingExtraction || loadingOptimization}
              className="w-full h-12 text-base font-semibold transition-smooth bg-gradient-primary hover:opacity-90"
              size="lg"
            >
              {loadingExtraction || loadingOptimization ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Running Pipeline...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-5 w-5" />
                  Generate ATS Summary
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                  1
                </span>
                Extracting Job Description
              </div>
              {renderStatusIcon(extractionStatus)}
            </div>
            {extractionError && (
              <div className="text-xs text-destructive">{extractionError}</div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="h-7 w-7 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-semibold">
                  2
                </span>
                Generating Optimized Resume
              </div>
              {renderStatusIcon(optimizationStatus)}
            </div>
            {optimizationError && (
              <div className="text-xs text-destructive">
                {optimizationError}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 border bg-card">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Pipeline Output
          </h2>
          {!jobDescription && !optimizedResume ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center space-y-2">
              <Sparkles className="w-12 h-12 mx-auto opacity-20" />
              <p>Your extracted job data and ATS summary JSON appear here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {jobDescription && (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText className="h-4 w-4 text-primary" />
                    Extracted Job Description
                  </div>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div>
                      <span className="text-foreground font-medium">Title:</span>{" "}
                      {jobDescription.jobTitle || "Not specified"}
                    </div>
                    <div>
                      <span className="text-foreground font-medium">
                        Company:
                      </span>{" "}
                      {jobDescription.company || "Not specified"}
                    </div>
                    <div>
                      <span className="text-foreground font-medium">
                        Responsibilities:
                      </span>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {jobDescription.responsibilities.length ? (
                          jobDescription.responsibilities.map((item) => (
                            <li key={item}>{item}</li>
                          ))
                        ) : (
                          <li>No responsibilities extracted.</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <span className="text-foreground font-medium">
                        Required Skills:
                      </span>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {jobDescription.requiredSkills.length ? (
                          jobDescription.requiredSkills.map((item) => (
                            <li key={item}>{item}</li>
                          ))
                        ) : (
                          <li>No required skills extracted.</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <span className="text-foreground font-medium">
                        Preferred Qualifications:
                      </span>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {jobDescription.preferredQualifications.length ? (
                          jobDescription.preferredQualifications.map((item) => (
                            <li key={item}>{item}</li>
                          ))
                        ) : (
                          <li>No preferred qualifications extracted.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {optimizedResume && (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    ATS Candidate Summary
                  </div>
                  <ResumeOutput
                    resumeData={optimizedResume}
                    className="border-0 shadow-none bg-transparent p-0"
                  />
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
};

export default JobDescriptionPage;
