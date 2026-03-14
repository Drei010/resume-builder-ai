import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ATSCandidateSummary } from "@shared/ats";
import { generateResume, type AiProvider } from "@/api/resumeApi";

const useResumePipeline = () => {
  const [resumeData, setResumeData] = useState<ATSCandidateSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestResume = useCallback(
    async (jobInfo: string, aiProvider: AiProvider, successMessage: string) => {
      if (!jobInfo.trim()) {
        const message = "Please enter your job information";
        setError(message);
        toast.error(message);
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const data = await generateResume(jobInfo, aiProvider);
        setResumeData(data);
        toast.success(successMessage);
      } catch (err: any) {
        const message = err?.message || "Failed to generate resume";
        setError(message);
        toast.error(message);
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const generate = useCallback(
    (jobInfo: string, aiProvider: AiProvider) =>
      requestResume(jobInfo, aiProvider, "Resume generated successfully!"),
    [requestResume]
  );

  const regenerate = useCallback(
    (jobInfo: string, aiProvider: AiProvider) =>
      requestResume(jobInfo, aiProvider, "Resume regenerated successfully!"),
    [requestResume]
  );

  const reset = useCallback(() => {
    setResumeData(null);
    setError(null);
  }, []);

  return {
    resumeData,
    isGenerating,
    error,
    generate,
    regenerate,
    reset,
  };
};

export { useResumePipeline };
