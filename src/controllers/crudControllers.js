import multer from "multer";
import Prisma from "../../db/db.config.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import fs from "fs";
import csv from "csv-parser";

const maxClassesPerDayStudent = process.env.MAX_CLASSES_STUDENT || 3;
const maxClassesPerDayInstructor = process.env.MAX_CLASSES_INSTRUCTOR || 5;
const classDuration = process.env.CLASS_DURATION || 60;

const registrations = asyncHandler(async (req, res) => {
  const filePath = req.file.path;
  const results = [];
  const tasks = [];

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        tasks.push(handleRow(row, results));
      })
      .on("end", async () => {
        await Promise.all(tasks);

        res.status(201).json(new ApiResponse(201, results, "Data upload Successfull"));
      })
      .on("error", (err) => {
        console.error(`Error reading file ${filePath}: ${err.message}`);

        throw new ApiError(500, `Error reading file: ${err.message}`);
      });
  } catch (err) {
    console.error(`Error processing registration: ${err.message}`);

    throw new ApiError(500, `Error processing registration: ${err.message}`);
  }
});

async function handleRow(row, results) {
  try {
    const {
      "Registration ID": registrationId,
      "Student ID": studentId,
      "Instructor ID": instructorId,
      "Class ID": classId,
      "Class Start Time": startTime,
      Action: action,
    } = row;

    // Convert IDs to integers
    const studentIdInt = parseInt(studentId, 10);
    const instructorIdInt = parseInt(instructorId, 10);
    const classIdInt = parseInt(classId, 10);
    const registrationIdInt = parseInt(registrationId, 10);

    if (!studentIdInt || !instructorIdInt || !classIdInt || !startTime) {
      results.push({
        registrationId: registrationIdInt,
        error: "Invalid or missing data",
      });
      return;
    }

    const startTimeDate = new Date(startTime);

    if (isNaN(startTimeDate.getTime())) {
      results.push({
        registrationId: registrationIdInt,
        error: "Invalid date format",
      });
      return;
    }

    const existingSchedule = await Prisma.schedule.findUnique({
      where: {
        studentId: studentIdInt,
        instructorId: instructorIdInt,
        classId: classIdInt,
        startTime: startTimeDate,
      },
    });

    if (action === "new" || action === "update") {
      let classRegistration = await Prisma.classRegistration.findUnique({
        where: { registrationId: registrationIdInt },
      });

      if (!classRegistration) {
        classRegistration = await Prisma.classRegistration.create({
          data: {
            registrationId: registrationIdInt,
            studentId: studentIdInt,
            instructorId: instructorIdInt,
            classId: classIdInt,
            startTime: startTimeDate,
          },
        });

        results.push({
          registrationId: registrationIdInt,
          message: "Class registration created successfully.",
        });
      } else {
        results.push({
          registrationId: registrationIdInt,
          message: "Class registration already exists.",
        });
      }

      if (action === "new") {
        if (existingSchedule) {
          results.push({
            registrationId: registrationIdInt,
            error: "Class is already scheduled for this time.",
          });
          return;
        } else {
          const scheduleValidation = await canSchedule(
            studentIdInt,
            instructorIdInt,
            startTimeDate
          );

          if (!scheduleValidation.success) {
            results.push({
              registrationId: registrationIdInt,
              error: scheduleValidation.message,
            });
          } else {
            await Prisma.schedule.create({
              data: {
                studentId: studentIdInt,
                instructorId: instructorIdInt,
                classId: classIdInt,
                startTime: startTimeDate,
              },
            });

            results.push({
              registrationId: registrationIdInt,
              message: "Class scheduled successfully.",
            });
          }
        }
      } else if (action === "update") {
        if (!existingSchedule) {
          results.push({
            registrationId: registrationIdInt,
            error: "Class schedule not found for update.",
          });
          return;
        }

        await Prisma.schedule.update({
          where: { id: registrationIdInt },
          data: {
            studentId: studentIdInt,
            instructorId: instructorIdInt,
            classId: classIdInt,
            startTime: startTimeDate,
          },
        });
        results.push({
          registrationId: registrationIdInt,
          message: "Class updated successfully.",
        });
      }
    } else if (action === "delete") {
      const existingRegistration = await Prisma.classRegistration.findUnique({
        where: { registrationId: registrationIdInt },
      });

      if (existingRegistration) {
        await Prisma.schedule.delete({
          where: { id: registrationIdInt },
        });
        await Prisma.classRegistration.delete({
          where: { registrationId: registrationIdInt },
        });
        results.push({
          registrationId: registrationIdInt,
          message: "Class deleted successfully.",
        });
      } else {
        results.push({
          registrationId: registrationIdInt,
          error: "Record not found for deletion.",
        });
      }
    }
  } catch (error) {
    console.error(`Error processing row: ${error.message}`);
    results.push({
      registrationId: parseInt(row["Registration ID"], 10),
      error: `Error processing row: ${error.message}`,
    });
  }
}

async function canSchedule(studentId, instructorId, startTime) {
  const dayStart = new Date(startTime);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const classEndTime = new Date(startTime);
  classEndTime.setMinutes(classEndTime.getMinutes() + classDuration);

  const studentClasses = await Prisma.schedule.findMany({
    where: {
      studentId: studentId,
      startTime: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
  });

  const instructorClasses = await Prisma.schedule.findMany({
    where: {
      instructorId: instructorId,
      startTime: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
  });

  for (const cls of studentClasses) {
    const existingClassEndTime = new Date(cls.startTime);
    existingClassEndTime.setMinutes(
      existingClassEndTime.getMinutes() + classDuration
    );

    if (
      (new Date(cls.startTime).getTime() < classEndTime.getTime() &&
        new Date(cls.startTime).getTime() >= new Date(startTime).getTime()) ||
      (existingClassEndTime.getTime() > new Date(startTime).getTime() &&
        existingClassEndTime.getTime() <= classEndTime.getTime())
    ) {
      return {
        success: false,
        message: "Student has another class that overlaps with this time.",
      };
    }
  }

  for (const cls of instructorClasses) {
    const existingClassEndTime = new Date(cls.startTime);
    existingClassEndTime.setMinutes(
      existingClassEndTime.getMinutes() + classDuration
    );

    if (
      (new Date(cls.startTime).getTime() < classEndTime.getTime() &&
        new Date(cls.startTime).getTime() >= new Date(startTime).getTime()) ||
      (existingClassEndTime.getTime() > new Date(startTime).getTime() &&
        existingClassEndTime.getTime() <= classEndTime.getTime())
    ) {
      return {
        success: false,
        message: "Instructor has another class that overlaps with this time.",
      };
    }
  }

  if (studentClasses.length >= maxClassesPerDayStudent) {
    return {
      success: false,
      message: `Student has exceeded max classes per day (${maxClassesPerDayStudent}).`,
    };
  }

  if (instructorClasses.length >= maxClassesPerDayInstructor) {
    return {
      success: false,
      message: `Instructor has exceeded max classes per day (${maxClassesPerDayInstructor}).`,
    };
  }

  return { success: true };
}

export { registrations };
