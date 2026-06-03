import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const maxAttempts = 5;
  const record = loginAttempts.get(key);

  if (!record || now > record.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true };
}

function isDummyCredential(value: string | undefined): boolean {
  if (!value || value.length <= 10) return true;
  return /placeholder|your\.|your-|dummy|test|example/i.test(value);
}

function buildProviders(): NextAuthOptions["providers"] {
  const providers: NextAuthOptions["providers"] = [];

  // Google OAuth
  const googleId = process.env.GOOGLE_CLIENT_ID || "";
  if (!isDummyCredential(googleId) && process.env.GOOGLE_CLIENT_SECRET && !isDummyCredential(process.env.GOOGLE_CLIENT_SECRET)) {
    providers.push(
      GoogleProvider({
        clientId: googleId,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      })
    );
  }

  // Microsoft Azure AD OAuth
  const azureClientId = process.env.AZURE_AD_CLIENT_ID || "";
  if (!isDummyCredential(azureClientId) && process.env.AZURE_AD_CLIENT_SECRET && !isDummyCredential(process.env.AZURE_AD_CLIENT_SECRET)) {
    providers.push(
      AzureADProvider({
        clientId: azureClientId,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
        tenantId: process.env.AZURE_AD_TENANT_ID || "common",
      })
    );
  }

  providers.push(
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();

        // Rate limit by email address
        const rateLimit = checkLoginRateLimit(email);
        if (!rateLimit.allowed) {
          throw new Error(
            `Too many login attempts. Try again in ${rateLimit.retryAfter} seconds.`
          );
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
        };
      },
    })
  );

  return providers;
}

export const authOptions: NextAuthOptions = {
  providers: buildProviders(),
  callbacks: {
    async signIn({ account, profile }) {
      // Credentials provider is already validated in authorize() — skip OAuth checks
      if (account?.provider === "credentials") {
        return true;
      }

      const email = ((profile as any)?.email as string)?.toLowerCase().trim();
      if (!email) return false;

      // Domain restriction for OAuth providers
      const isAllowedDomain = email.endsWith("@expertflow.com");
      if (!isAllowedDomain) {
        return false;
      }

      if (account?.provider === "google") {
        const hostedDomain = (profile as any)?.hd as string | undefined;
        if (hostedDomain && hostedDomain !== "expertflow.com") {
          return false;
        }
      }

      if (account?.provider === "azure-ad") {
        // Selected-user restriction for Azure AD
        const allowAll = process.env.AZURE_AD_ALLOW_ALL === "true";
        if (!allowAll) {
          const allowedUsers = (process.env.AZURE_AD_ALLOWED_USERS || "")
            .split(",")
            .map((u) => u.trim().toLowerCase())
            .filter(Boolean);
          if (allowedUsers.length > 0 && !allowedUsers.includes(email)) {
            return false;
          }
        }
      }

      // Find or create the user in the database for OAuth providers
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            email,
            name: (profile as any)?.name || email.split("@")[0],
            role: "EMPLOYEE",
            department: "General",
          },
        });
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google" || account?.provider === "azure-ad") {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.department = dbUser.department;
          }
        } else {
          token.id = user.id;
          token.role = (user as any).role;
          token.department = (user as any).department;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.department = token.department as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
