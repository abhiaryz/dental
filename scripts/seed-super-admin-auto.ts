import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🔐 Auto-Seeding Super Admin Account...\n");

  const email = "super@admin.com";
  const password = "superadmin123";
  const name = "Super Admin";

  // Check if super admin already exists
  const existingEmail = await prisma.superAdmin.findUnique({
    where: { email },
  });

  if (existingEmail) {
    console.log("\n✅ Super admin already exists: ", email);
    await prisma.$disconnect();
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const superAdmin = await prisma.superAdmin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isActive: true,
      },
    });

    console.log("\n✅ Super admin account created successfully!");
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Password: ${password}`);
    console.log("\n🔗 Login at: /super-admin");

  } catch (error) {
    console.error("\n❌ Error creating super admin:", error);
  }

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

