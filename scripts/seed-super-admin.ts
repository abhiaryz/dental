import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log("\n🔐 Super Admin Account Setup\n");
  console.log("This script will create your first super admin account.\n");

  // Check if super admin already exists
  const existingCount = await prisma.superAdmin.count();
  
  if (existingCount > 0) {
    console.log("⚠️  Warning: Super admin accounts already exist in the database.");
    const proceed = await question("Do you want to create another super admin? (yes/no): ");
    
    if (proceed.toLowerCase() !== "yes" && proceed.toLowerCase() !== "y") {
      console.log("\n❌ Operation cancelled.");
      rl.close();
      await prisma.$disconnect();
      return;
    }
  }

  // Get super admin details
  const name = await question("\nEnter super admin name: ");
  const email = await question("Enter super admin email: ");
  
  // Check if email already exists
  const existingEmail = await prisma.superAdmin.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingEmail) {
    console.log("\n❌ Error: This email is already registered as a super admin.");
    rl.close();
    await prisma.$disconnect();
    return;
  }

  let password = await question("Enter password (min 8 characters): ");
  
  // Validate password
  while (password.length < 8) {
    console.log("❌ Password must be at least 8 characters long.");
    password = await question("Enter password (min 8 characters): ");
  }

  const confirmPassword = await question("Confirm password: ");

  if (password !== confirmPassword) {
    console.log("\n❌ Error: Passwords do not match.");
    rl.close();
    await prisma.$disconnect();
    return;
  }

  // Hash password
  console.log("\n⏳ Creating super admin account...");
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const superAdmin = await prisma.superAdmin.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        isActive: true,
      },
    });

    console.log("\n✅ Super admin account created successfully!");
    console.log("\n📋 Account Details:");
    console.log(`   ID: ${superAdmin.id}`);
    console.log(`   Name: ${superAdmin.name}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Created: ${superAdmin.createdAt.toLocaleString()}`);
    console.log("\n🔗 Login at: /super-admin");
    console.log("\n⚠️  Keep your credentials secure!");

  } catch (error) {
    console.error("\n❌ Error creating super admin:", error);
  }

  rl.close();
  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(() => {
    rl.close();
  });

