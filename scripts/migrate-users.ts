/**
 * Migration Script: Update User Roles
 * 
 * This script helps migrate existing users to the new RBAC system.
 * Run this AFTER running the database migration.
 * 
 * Usage:
 *   npx tsx scripts/migrate-users.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateUsers() {
  console.log("🔄 Starting user role migration...\n");

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isExternal: true,
      },
    });

    console.log(`Found ${users.length} users to review\n`);

    // Display current users
    console.log("Current Users:");
    console.log("─".repeat(80));
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role} | External: ${user.isExternal}`);
      console.log("");
    });

    // Example: Update specific users
    // Uncomment and modify as needed

    /*
    // Example 1: Make the first user an admin
    if (users.length > 0) {
      await prisma.user.update({
        where: { id: users[0].id },
        data: { role: "ADMIN", isExternal: false },
      });
      console.log(`✅ Updated ${users[0].email} to ADMIN`);
    }

    // Example 2: Update by email
    await prisma.user.update({
      where: { email: "doctor@clinic.com" },
      data: { role: "CLINIC_DOCTOR", isExternal: false },
    });
    console.log("✅ Updated doctor@clinic.com to CLINIC_DOCTOR");

    // Example 3: Update external doctors
    await prisma.user.updateMany({
      where: { email: { contains: "external" } },
      data: { role: "EXTERNAL_DOCTOR", isExternal: true },
    });
    console.log("✅ Updated external doctors");

    // Example 4: Update receptionists
    await prisma.user.updateMany({
      where: { email: { contains: "reception" } },
      data: { role: "RECEPTIONIST", isExternal: false },
    });
    console.log("✅ Updated receptionists");
    */

    console.log("\n✅ Migration review complete!");
    console.log("\n💡 To update users, uncomment the examples in this script");
    console.log("   or add your own update queries.\n");

  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateUsers()
  .then(() => {
    console.log("✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to migrate users:", error);
    process.exit(1);
  });

