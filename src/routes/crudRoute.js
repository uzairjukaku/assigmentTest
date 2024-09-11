import { Router } from "express";
import { registrations } from "../controllers/crudControllers.js";
import multer from "multer";
import { getAllSchedules } from "../controllers/scheduleController.js";
const upload = multer({ dest: "uploads/" });

const router = Router();
router.route("/registrations").post(upload.single("file"), registrations);
router.route("/schedules").get(getAllSchedules);

export default router;
