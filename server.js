import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateResume } from "./api/generate-resume.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Use the shared resume generation handler
app.post("/api/generate-resume", generateResume);

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
