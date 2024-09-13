import express from "express";
import cors from "cors";
// import cookieParser from "cookie-parser";
import multer from "multer";
import scheduleRoutes from "./routes/scheduleRoutes.js";
const app = express();

const upload = multer({ dest: "uploads/" });
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
// app.use(cookieParser());

// import registerrouter from "./routes/crudRoute.js";
// import { scheduleRoutes } from "./routes/scheduleRoutes.js";

// app.use("/", registerrouter);
app.use("/class-schedules", scheduleRoutes);
export { app };
