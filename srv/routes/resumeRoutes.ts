import express, { type Request, type Response } from "express";
import multer from "multer";
import {
  extractJobDescriptionWithRetry,
  extractJobDetails,
  extractJobTextFromHtml,
  extractLinkedInJobId,
  fetchLinkedInJobPosting,
  parseJobDescriptionJson,
} from "../services/jobExtraction.js";
import {
  extractResumeText,
  generateResumeFromNotes,
  optimizeResumeWithJob,
  tailorResumeFromJobDetails,
  trimResumeText,
  type AiProvider,
  type UploadedFile,
} from "../services/resumeOptimization.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const router = express.Router();

type GenerateRequest = Request<
  unknown,
  unknown,
  { jobInfo?: string; aiProvider?: AiProvider }
>;

type OptimizeRequest = Request<
  unknown,
  unknown,
  { jobDescription?: string }
> & { file?: UploadedFile };

type TailorRequest = Request<
  unknown,
  unknown,
  { jobUrl?: string; aiProvider?: AiProvider }
> & { file?: UploadedFile };

const normalizeProvider = (value?: string): AiProvider =>
  value === "gemini" ? "gemini" : "openai";

router.post("/generate-resume", async (req: GenerateRequest, res: Response) => {
  const jobInfo = req.body?.jobInfo?.trim();
  const provider = normalizeProvider(req.body?.aiProvider);

  if (!jobInfo) {
    return res.status(400).json({ error: "jobInfo is required" });
  }

  try {
    const summary = await generateResumeFromNotes(jobInfo, provider);
    return res.status(200).json(summary);
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to generate ATS summary",
      details: error?.message,
    });
  }
});

router.post("/extract-job", async (req: Request, res: Response) => {
  const jobUrl = req.body?.jobUrl?.trim();
  if (!jobUrl) {
    return res.status(400).json({ error: "jobUrl is required" });
  }

  const jobId = extractLinkedInJobId(jobUrl);
  if (!jobId) {
    return res.status(400).json({
      error:
        "Invalid LinkedIn job URL. Please use a URL like https://www.linkedin.com/jobs/view/1234567890/",
    });
  }

  try {
    let jobHtml = "";
    try {
      jobHtml = await fetchLinkedInJobPosting(jobId);
    } catch {
      return res.status(400).json({
        error:
          "Unable to fetch the LinkedIn job post. Please confirm the URL is public and try again.",
      });
    }

    const jobText = extractJobTextFromHtml(jobHtml);
    if (!jobText) {
      return res.status(400).json({ error: "Job posting text is empty" });
    }

    const jobDescription = await extractJobDescriptionWithRetry(jobText, jobUrl);

    return res.status(200).json({ jobDescription });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "Failed to extract job description",
    });
  }
});

router.post(
  "/optimize-resume",
  upload.single("resume"),
  async (req: OptimizeRequest, res: Response) => {
    const jobDescriptionRaw = req.body?.jobDescription;
    const file = req.file;

    if (!jobDescriptionRaw) {
      return res.status(400).json({ error: "jobDescription is required" });
    }

    if (!file) {
      return res.status(400).json({ error: "resume file is required" });
    }

    const jobDescription = parseJobDescriptionJson(jobDescriptionRaw);
    if (!jobDescription) {
      return res.status(400).json({
        error: "jobDescription must match the required JSON schema",
      });
    }

    try {
      let resumeText = "";
      try {
        resumeText = await extractResumeText(file);
      } catch (extractError: any) {
        return res.status(400).json({
          error: extractError?.message || "Failed to read resume file",
        });
      }

      if (!resumeText.trim()) {
        return res.status(400).json({ error: "Resume text could not be read" });
      }

      const trimmedResume = trimResumeText(resumeText);
      const optimizedResume = await optimizeResumeWithJob(
        jobDescription,
        trimmedResume
      );

      return res.status(200).json(optimizedResume);
    } catch (error: any) {
      return res.status(500).json({
        error: error?.message || "Failed to optimize resume",
      });
    }
  }
);

router.post(
  "/tailor-resume",
  upload.single("resume"),
  async (req: TailorRequest, res: Response) => {
    const jobUrl = req.body?.jobUrl?.trim();
    const provider = normalizeProvider(req.body?.aiProvider);
    const file = req.file;

    if (!jobUrl) {
      return res.status(400).json({ error: "jobUrl is required" });
    }

    if (!file) {
      return res.status(400).json({ error: "resume file is required" });
    }

    const jobId = extractLinkedInJobId(jobUrl);
    if (!jobId) {
      return res.status(400).json({
        error:
          "Invalid LinkedIn job URL. Please use a URL like https://www.linkedin.com/jobs/view/1234567890/",
      });
    }

    try {
      let resumeText = "";
      try {
        resumeText = await extractResumeText(file);
      } catch (extractError: any) {
        return res.status(400).json({
          error: extractError?.message || "Failed to read resume file",
        });
      }

      if (!resumeText.trim()) {
        return res.status(400).json({ error: "Resume text could not be read" });
      }

      let jobHtml = "";
      try {
        jobHtml = await fetchLinkedInJobPosting(jobId);
      } catch {
        return res.status(400).json({
          error:
            "Unable to fetch the LinkedIn job post. Please confirm the URL is public and try again.",
        });
      }

      const jobDetails = extractJobDetails(jobHtml);

      if (!jobDetails.description) {
        return res
          .status(400)
          .json({ error: "Failed to extract job description" });
      }

      const trimmedResume = trimResumeText(resumeText);
      const summary = await tailorResumeFromJobDetails(
        jobUrl,
        jobDetails,
        trimmedResume,
        provider
      );

      return res.status(200).json(summary);
    } catch (error: any) {
      return res.status(500).json({
        error: error?.message || "Failed to tailor resume",
      });
    }
  }
);

export { router as resumeRoutes };
