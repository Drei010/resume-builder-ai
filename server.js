import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { generateResume, tailorResume } from "./srv/index.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Use the shared resume generation handler
app.post("/api/generate-resume", generateResume);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});
app.post("/api/tailor-resume", upload.single("resume"), tailorResume);

// Handle multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "Resume file is too large. Please upload a file under 8MB.",
      });
    }
    return res.status(400).json({ error: err.message });
  }
  return next(err);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Start server (only if running locally, not on Vercel)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(
      `Resume endpoint: POST http://localhost:${PORT}/api/generate-resume`
    );
    console.log(
      `Tailor endpoint: POST http://localhost:${PORT}/api/tailor-resume`
    );
  });
}

export default app;
