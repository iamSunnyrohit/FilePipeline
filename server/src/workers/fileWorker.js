import "dotenv/config";
import { Worker } from "bullmq";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { redisConnection } from "../config/redis.js";
import { s3, S3_BUCKET } from "../config/s3.js";
import Job from "../models/Job.js";
import { processFileBuffer } from "../services/processorService.js";

const worker = new Worker(
  "file-processing",
  async (job) => {
    const { jobId } = job.data;
    console.log(`Processing job ID: ${jobId}`);

    const jobRecord = await Job.findById(jobId);
    if (!jobRecord) {
      throw new Error(`Job record not found in database: ${jobId}`);
    }

    jobRecord.status = "PROCESSING";
    await jobRecord.save();

    try {
      const getObjectResponse = await s3.send(
        new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: jobRecord.originalKey,
        })
      );

      const byteArray = await getObjectResponse.Body.transformToByteArray();
      const buffer = Buffer.from(byteArray);

      const result = await processFileBuffer(buffer, jobRecord.mimeType);

      if (result.type === "image") {
        const thumbKey = `processed/${jobId}/thumbnail.webp`;
        const mediumKey = `processed/${jobId}/medium.webp`;

        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: thumbKey,
            Body: result.variants.thumbnail,
            ContentType: "image/webp",
          })
        );

        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: mediumKey,
            Body: result.variants.medium,
            ContentType: "image/webp",
          })
        );

        jobRecord.processedKeys = { thumbnail: thumbKey, medium: mediumKey };
      }

      jobRecord.status = "COMPLETED";
      await jobRecord.save();
      console.log(`Job completed successfully: ${jobId}`);
    } catch (error) {
      console.error(`Job failed: ${jobId}`, error);
      jobRecord.status = "FAILED";
      jobRecord.error = error.message;
      await jobRecord.save();
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  console.log(`Worker: Job ${job.id} has completed!`);
});

worker.on("failed", (job, err) => {
  console.log(`Worker: Job ${job.id} has failed with ${err.message}`);
});