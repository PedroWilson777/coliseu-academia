
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const email = "pedrowicloud@gmail.com"
  let user = await prisma.teacher.findUnique({ where: { email } })
  if (!user) {
    console.log("Teacher not found. Creating...")
    user = await prisma.teacher.create({
      data: {
        name: "Pedro Admin",
        email: email,
        phone: "00000000000",
        isAdmin: true,
        active: true
      }
    })
    console.log("Created teacher:", user)
  } else {
    console.log("Teacher already exists:", user)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())

