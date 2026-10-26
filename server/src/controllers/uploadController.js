import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import Job from "../models/Job.js";
import { s3, S3_BUCKET } from "../config/s3.js";
import { fileQueue } from "../queues/fileQueue.js";

export async function uploadFile(req, res, next) {
  let originalKey;
  let uploadedToS3 = false;
  let createdJob;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: "FILE_REQUIRED",
          message: "Please select a file to upload",
        },
      });
    }

    const file = req.file;
    const jobId = randomUUID();

    originalKey = `originals/${jobId}/${file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: originalKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    uploadedToS3 = true;

    createdJob = await Job.create({
      _id: undefined,
      originalName: file.originalname,
      originalKey,
      mimeType: file.mimetype,
      size: file.size,
      status: "PENDING",
      webhookUrl: null,
    });

    await fileQueue.add(
      "process-file",
      { jobId: createdJob._id.toString() },
      { jobId: createdJob._id.toString() }
    );

    return res.status(202).json({
      success: true,
      job_id: createdJob._id.toString(),
      status: "PENDING",
      message: "File accepted for processing",
    });
  } catch (error) {

    if (createdJob) {
      await Job.deleteOne({ _id: createdJob._id }).catch(() => {});
    }

    if (uploadedToS3 && originalKey) {
      await s3
        .send(
          new DeleteObjectCommand({
            Bucket: S3_BUCKET,
            Key: originalKey,
          })
        )
        .catch((cleanupError) => {
          console.error("S3 cleanup failed:", cleanupError.message);
        });
    }

    next(error);
  }
}
