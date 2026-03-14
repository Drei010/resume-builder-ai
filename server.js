import dotenv from "dotenv";
import app from "./srv/index.ts";

dotenv.config();

const PORT = process.env.PORT || 3001;

// Start server (only if running locally, not on Vercel)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Resume endpoint: POST http://localhost:${PORT}/api/generate-resume`);
    console.log(`Extract endpoint: POST http://localhost:${PORT}/api/extract-job`);
    console.log(`Optimize endpoint: POST http://localhost:${PORT}/api/optimize-resume`);
    console.log(`Tailor endpoint: POST http://localhost:${PORT}/api/tailor-resume`);
  });
}

export default app;
