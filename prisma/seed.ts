import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@medicare.com" },
    update: {},
    create: {
      email: "admin@medicare.com",
      name: "Admin User",
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log("✅ Created admin user:", admin.email);

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📝 Login Credentials:");
  console.log("   Email: admin@medicare.com");
  console.log("   Password: admin123");
  console.log("\n💡 You can now add patients, treatments, and appointments through the dashboard.");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
