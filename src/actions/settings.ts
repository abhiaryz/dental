'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateLanguage(language: string) {
  const session = await auth();
  
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  // Update user in DB
  await prisma.user.update({
    where: { email: session.user.email },
    data: { language },
  });

  // Update cookie
  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", language, {
    path: "/",
    maxAge: 31536000, // 1 year
    sameSite: "lax",
  });

  revalidatePath("/");
  return { success: true };
}

