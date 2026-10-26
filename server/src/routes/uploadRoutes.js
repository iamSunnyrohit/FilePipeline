import { Router } from "express";
import upload from "../middleware/upload.js";
import { uploadFile } from "../controllers/uploadController.js";

const router = Router();

router.post("/upload", upload.single("file"), uploadFile);

export default router;
