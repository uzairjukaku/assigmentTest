-- CreateTable
CREATE TABLE "Schedule" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassRegistration" (
    "id" SERIAL NOT NULL,
    "registrationId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassRegistration_pkey" PRIMARY KEY ("id")
);
