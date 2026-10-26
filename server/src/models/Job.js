
import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    variant: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    contentType: String,
    size: Number,
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
    },
    originalKey: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
      ],
      default: "PENDING",
      index: true,
    },
    assets: {
      type: [assetSchema],
      default: [],
    },
    extractedText: {
      type: String,
      default: "",
    },
    webhookUrl: {
      type: String,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: null,
    },
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);
