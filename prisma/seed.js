import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.student.createMany({
    data: [{ name: "Student A" }, { name: "Student B" }],
  });

  await prisma.instructor.createMany({
    data: [{ name: "Instructor X" }, { name: "Instructor Y" }],
  });

  await prisma.classType.createMany({
    data: [{ name: "parking" }, { name: "driving" }],
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
