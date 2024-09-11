import Prisma from "../../db/db.config.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllSchedules = asyncHandler(async (req, res) => {
  try {
    const schedules = await Prisma.schedule.findMany();

    return res
      .status(201)
      .json(new ApiResponse(201, schedules, "Schedule List"));
  } catch (error) {
    throw new ApiError(500, "Error getting Schedule Class");
  }
});
