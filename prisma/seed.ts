import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Create default Clinic
  console.log("Creating Clinic...");
  const clinicCode = "MEDICARE01";
  const clinicEmail = "contact@medicare.com";
  const ownerEmail = "admin@medicare.com";

  const clinic = await prisma.clinic.upsert({
    where: { clinicCode },
    update: {},
    create: {
      name: "Medicare Dental Clinic",
      clinicCode,
      email: clinicEmail,
      phone: "123-456-7890",
      address: "123 Health St",
      city: "Wellness City",
      state: "State",
      ownerName: "Dr. Admin Smith",
      ownerEmail,
      type: "CLINIC",
      onboardingComplete: true,
    },
  });
  console.log(`✅ Clinic created: ${clinic.name} (${clinic.clinicCode})`);

  // 2. Create Admin User for the Clinic
  console.log("Creating Admin User...");
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const username = `admin_${clinicCode.toLowerCase()}`; // admin_medicare01

  const admin = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      clinicId: clinic.id,
      username,
      role: "ADMIN",
    },
    create: {
      email: ownerEmail,
      username,
      name: "Dr. Admin Smith",
      password: hashedPassword,
      role: "ADMIN",
      clinicId: clinic.id,
    },
  });

  console.log("✅ Created admin user:", admin.email);

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📝 Clinic Details:");
  console.log(`   Clinic Code: ${clinicCode}`);
  console.log("\n📝 Admin Login Credentials:");
  console.log(`   Username: ${username}`);
  console.log(`   Email: ${ownerEmail}`);
  console.log("   Password: admin123");
  console.log("\n💡 You can now login as Clinic Admin.");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
