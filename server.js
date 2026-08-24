import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateResume } from "./srv/index.ts";
import { tailorResume } from "./srv/routes/tailorResume.ts";
import { parseResume } from "./srv/routes/parseResume.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
// Allow larger resume inputs; route handlers enforce their own safe limits.
app.use(express.json({ limit: "10mb", strict: true }));
app.use((error, _req, res, next) => {
  if (error?.type === "entity.too.large") return res.status(413).json({ error: "Request payload is too large. Please shorten the resume or work entries." });
  return next(error);
});

// Use the shared resume generation handlers
app.post("/api/generate-resume", generateResume);
app.post("/api/tailor-resume", tailorResume);
app.post("/api/parse-resume", parseResume);

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
  });
}

export default app;
