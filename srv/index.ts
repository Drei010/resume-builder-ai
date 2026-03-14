import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { resumeRoutes } from "./routes/resumeRoutes.js";

dotenv.config();

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-api-key"],
};

const apiKeyMiddleware: express.RequestHandler = (req, res, next) => {
  const apiKey = req.header("x-api-key");
  const expectedKey = process.env.INTERNAL_API_KEY;
  if (!expectedKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
};

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api", apiKeyMiddleware, apiLimiter, resumeRoutes);

app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default app;
