import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const fileQueue = new Queue("file-processing", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 500,
    removeOnFail: 1000,
  },
});
