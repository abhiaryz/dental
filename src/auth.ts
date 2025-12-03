import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createAuditLog, AuditActions } from "@/lib/audit-logger";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        clinicCode: { label: "Clinic Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.password) {
          return null;
        }

        let user;

        // Check if logging in with clinic code (clinic employee)
        if (credentials.clinicCode && credentials.username) {
          // Clinic employee login with username + clinicCode
          user = await prisma.user.findFirst({
            where: {
              username: credentials.username as string,
              clinic: {
                clinicCode: (credentials.clinicCode as string).toUpperCase(),
                isActive: true,
              },
            },
            include: {
              clinic: {
                select: {
                  id: true,
                  name: true,
                  clinicCode: true,
                },
              },
            },
          });
        } else if (credentials.email) {
          // Individual practitioner or email-based login
          user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: {
              clinic: {
                select: {
                  id: true,
                  name: true,
                  clinicCode: true,
                },
              },
            },
          });
        } else {
          return null;
        }

        if (!user || !user.password) {
          return null;
        }

        // Check if account is locked
        if (user.lockedUntil && new Date() < user.lockedUntil) {
          const minutesRemaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000 / 60);
          console.error(`Account locked for user ${user.id}, ${minutesRemaining} minutes remaining`);
          return null;
        }

        // Check if email is verified
        if (!user.emailVerified) {
          console.error(`Email not verified for user ${user.id}`);
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          // Log failed attempt
          await createAuditLog({
            userId: user.id,
            action: AuditActions.USER_LOGIN_FAILED,
            metadata: { reason: "Invalid password" },
          });
          
          // Increment failed attempts
          const newAttempts = user.failedLoginAttempts + 1;
          const updateData: any = { failedLoginAttempts: newAttempts };
          
          // Lock account after 10 failed attempts
          if (newAttempts >= 10) {
            const lockUntil = new Date();
            lockUntil.setMinutes(lockUntil.getMinutes() + 30); // Lock for 30 minutes
            updateData.lockedUntil = lockUntil;
          }
          
          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
          
          return null;
        }

        // Reset failed attempts and update last login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lastLoginAt: new Date(),
          },
        });

        // Log successful login
        await createAuditLog({
          userId: user.id,
          action: AuditActions.USER_LOGIN,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isExternal: user.isExternal,
          clinicId: user.clinicId,
          clinicName: user.clinic?.name,
          clinicCode: user.clinic?.clinicCode,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login/clinic-select",
    error: "/login/clinic-select",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? `__Secure-next-auth.session-token` 
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "production"
        ? `__Secure-next-auth.callback-url`
        : `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production"
        ? `__Host-next-auth.csrf-token`
        : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful login
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`;
      }
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow same-origin URLs
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.isExternal = (user as any).isExternal;
        token.clinicId = (user as any).clinicId;
        token.clinicName = (user as any).clinicName;
        token.clinicCode = (user as any).clinicCode;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).isExternal = token.isExternal;
        (session.user as any).clinicId = token.clinicId;
        (session.user as any).clinicName = token.clinicName;
        (session.user as any).clinicCode = token.clinicCode;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
});
