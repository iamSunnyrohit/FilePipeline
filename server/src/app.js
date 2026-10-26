import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./config/database.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import multer from "multer";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json({ limit: "100kb" }));
app.use("/api/v1/files", uploadRoutes);

app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "File Processing API is running",
  });
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          error: {
            code: "FILE_TOO_LARGE",
            message: "Maximum allowed file size is 10 MB",
          },
        });
      }
  
      return res.status(400).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      });
    }
  
    if (err.code === "UNSUPPORTED_FILE_TYPE") {
      return res.status(400).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      });
    }
  
    console.error("API error:", err);
  
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    });
  });


const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start API:", error);
    process.exit(1);
  }
}

startServer();