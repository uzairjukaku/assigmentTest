import Prisma from "../../db/db.config.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllclasses = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, instructorId } = req.query;
    const where = {};
    if (startDate || endDate) {
      where.startTime = {};

      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          where.startTime.gte = start;
        } else {
          return res.status(400).json({ error: "Invalid startDate format" });
        }
      }

      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          where.startTime.lte = end;
        } else {
          return res.status(400).json({ error: "Invalid endDate format" });
        }
      }
    }

    if (instructorId) {
      where.instructor = {
        id: parseInt(instructorId),
      };
    }

    const classSchedules = await Prisma.classSchedule.findMany({
      where,
      include: {
        student: true,
        instructor: true,
        classType: true,
      },
    });

    return res.status(200).json(new ApiResponse(200, classSchedules));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const getAllinstructor = asyncHandler(async (req, res) => {
  try {
    const instructor = await Prisma.instructor.findMany({});
    return res.status(200).json(new ApiResponse(200, instructor));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const getClassesPerDay = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const classesPerInstructor = await Prisma.classSchedule.groupBy({
      by: ["instructorId"],
      _count: {
        id: true,
      },
      where,
    });

    const instructorIds = classesPerInstructor.map((item) => item.instructorId);

    const instructors = await Prisma.instructor.findMany({
      where: {
        id: { in: instructorIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const formattedClasses = classesPerInstructor.map((item) => {
      const instructor = instructors.find(
        (inst) => inst.id === item.instructorId
      );
      return {
        name: instructor ? instructor.name : "Unknown",
        Classes: item._count.id,
      };
    });

    return res.status(200).json(new ApiResponse(200, formattedClasses));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export { getAllclasses, getAllinstructor, getClassesPerDay };
