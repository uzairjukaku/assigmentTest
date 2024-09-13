import Prisma from "../../db/db.config.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import fs from "fs";
import csv from "csv-parser";

const CLASS_DURATION_MINUTES =
  parseInt(process.env.CLASS_DURATION_MINUTES) || 60;

const checkConflicts = async (studentId, instructorId, startTime, endTime) => {
  // Check for conflicting schedules for both student and instructor
  const conflictStudent = await Prisma.classSchedule.findFirst({
    where: {
      studentId,
      startTime: { lte: endTime },
      endTime: { gte: startTime },
    },
  });

  const conflictInstructor = await Prisma.classSchedule.findFirst({
    where: {
      instructorId,
      startTime: { lte: endTime },
      endTime: { gte: startTime },
    },
  });

  return conflictStudent || conflictInstructor;
};

const checkDailyLimit = async (studentId, instructorId, classId, startDate) => {
  const studentLimit = await Prisma.classSchedule.count({
    where: { studentId, startTime: { gte: startDate } },
  });

  const instructorLimit = await Prisma.classSchedule.count({
    where: { instructorId, startTime: { gte: startDate } },
  });

  const classTypeLimit = await Prisma.classSchedule.count({
    where: { classId, startTime: { gte: startDate } },
  });

  const studentExceed = studentLimit >= process.env.STUDENT_DAILY_LIMIT;
  const instructorExceed =
    instructorLimit >= process.env.INSTRUCTOR_DAILY_LIMIT;
  const classTypeExceed = classTypeLimit >= process.env.MAX_CLASS_TYPE_PER_DAY;

  return { studentExceed, instructorExceed, classTypeExceed };
};

export const processCSV = (filePath, res) => {
  const resultsPromises = [];

  const processRow = async (row) => {
    console.log("Processing row:", row);

    const action = row["Action"] ? row["Action"].toLowerCase() : "";
    const registrationId = row["Registration ID"]
      ? row["Registration ID"].trim()
      : null;
    const studentId = row["Student ID"] ? parseInt(row["Student ID"]) : null;
    const instructorId = row["Instructor ID"]
      ? parseInt(row["Instructor ID"])
      : null;
    const classId = row["Class ID"] ? parseInt(row["Class ID"]) : null;
    const startTime = row["Class Start Time"]
      ? new Date(row["Class Start Time"])
      : null;

    if (!startTime) {
      console.log("Error: Missing startTime field");
      return { registrationId, message: "Error: Missing startTime field" };
    }

    const endTime = startTime
      ? new Date(startTime.getTime() + CLASS_DURATION_MINUTES * 60000)
      : null;

    if (!action) {
      return { registrationId, message: "Error: Missing action field" };
    }

    try {
      if (action === "new") {
        const conflicts = await checkConflicts(
          studentId,
          instructorId,
          startTime,
          endTime
        );
        const dailyLimit = await checkDailyLimit(
          studentId,
          instructorId,
          classId,
          startTime
        );

        if (conflicts) {
          return {
            registrationId,
            message:
              "Conflict: Student or Instructor already has a class at this time",
          };
        } else if (
          dailyLimit.studentExceed ||
          dailyLimit.instructorExceed ||
          dailyLimit.classTypeExceed
        ) {
          return {
            registrationId,
            message:
              "Daily limit exceeded for Student, Instructor, or Class Type",
          };
        } else {
          await Prisma.classSchedule.create({
            data: {
              registrationId,
              studentId,
              instructorId,
              classId,
              startTime,
              endTime,
              action,
            },
          });
          return { registrationId: "new", message: "Success: Class scheduled" };
        }
      } else if (action === "update") {
        if (!registrationId) {
          return {
            registrationId,
            message: "Error: Missing registrationId for update",
          };
        }
        const existingSchedule = await Prisma.classSchedule.findUnique({
          where: { registrationId },
        });

        if (!existingSchedule) {
          return {
            registrationId,
            message: "Error: Schedule not found for update",
          };
        }

        await Prisma.classSchedule.update({
          where: { registrationId },
          data: {
            studentId,
            instructorId,
            classId,
            startTime,
            endTime,
            action,
          },
        });
        return { registrationId, message: "Success: Class updated" };
      } else if (action === "delete") {
        if (!registrationId) {
          return {
            registrationId,
            message: "Error: Missing registrationId for delete",
          };
        }
        const existingSchedule = await Prisma.classSchedule.findUnique({
          where: { registrationId },
        });

        if (!existingSchedule) {
          return {
            registrationId,
            message: "Error: Schedule not found for delete",
          };
        }

        await Prisma.classSchedule.delete({
          where: { registrationId },
        });
        return { registrationId, message: "Success: Class deleted" };
      } else {
        return { registrationId, message: `Error: Unknown action ${action}` };
      }
    } catch (error) {
      return { registrationId, message: `Error: ${error.message}` };
    }
  };

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      resultsPromises.push(processRow(row));
    })
    .on("end", async () => {
      console.log("CSV processing completed.");
      try {
        const resultsArray = await Promise.all(resultsPromises);
        console.log("Results:", resultsArray);
        res.json(resultsArray);
      } catch (error) {
        console.error("Error processing rows:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    })
    .on("error", (error) => {
      console.error("CSV processing error:", error);
      res.status(500).json({ message: "Internal server error" });
    });
};
