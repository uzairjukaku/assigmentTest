import { Router } from "express";
import { processCSV } from "../controllers/scheduleController.js";
import multer from "multer";
import { getAllclasses, getAllinstructor, getClassesPerDay } from "../controllers/classesController.js";

const upload = multer({ dest: "uploads/" });
const router = Router();
router.post("/upload", upload.single("file"), (req, res) => {
  const filePath = req.file.path;
  processCSV(filePath, res);
});

router.get("/all", getAllclasses);
router.get("/instructor", getAllinstructor);
router.get("/classes", getClassesPerDay);

export default router;
