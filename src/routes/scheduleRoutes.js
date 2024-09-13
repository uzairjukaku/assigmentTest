import { Router } from "express";

import { processCSV } from "../controllers/scheduleController.js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

const router = Router();

// POST /class-schedules/upload (CSV Upload)
router.post("/upload", upload.single("file"), (req, res) => {
  const filePath = req.file.path;

  console.log(filePath,'&&&&&&&&&&&&&&&&&');
  
  processCSV(filePath, res);
});

export default router;
