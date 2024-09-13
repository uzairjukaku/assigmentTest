import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Seed students
  await prisma.student.createMany({
    data: [{ name: "Student A" }, { name: "Student B" }],
  });

  // Seed instructors
  await prisma.instructor.createMany({
    data: [{ name: "Instructor X" }, { name: "Instructor Y" }],
  });

  // Seed class types
  await prisma.classType.createMany({
    data: [{ name: "Math" }, { name: "Science" }],
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
