
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const email = "pedrowicloud@gmail.com"
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log("User not found. Creating...")
    user = await prisma.user.create({
      data: {
        email: email,
        name: "Pedro Admin",
        role: "ADMIN"
      }
    })
    console.log("Created user:", user)
  } else {
    console.log("User already exists:", user)
    if (user.role !== "ADMIN") {
       await prisma.user.update({ where: { email }, data: { role: "ADMIN" } })
       console.log("Updated role to ADMIN")
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())

