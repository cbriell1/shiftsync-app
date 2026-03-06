// filepath: auth.ts
import NextAuth from "next-auth"
import Passkey from "next-auth/providers/passkey"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const baseAdapter = PrismaAdapter(prisma);

const customAdapter = {
  ...baseAdapter,
  createUser: async (data: any) => {
    const { id, ...validData } = data; 
    
    if (validData.email === "cbriell1@yahoo.com") {
      const existingChris = await prisma.user.findFirst({
        where: { name: { equals: "Chris Briell" } }
      });

      if (existingChris) {
        return prisma.user.update({
          where: { id: existingChris.id },
          data: { 
            email: "cbriell1@yahoo.com", 
            role: "ADMIN", 
            systemRoles: ["Administrator", "Manager", "Front Desk"] 
          }
        });
      }
    }

    if (!validData.name && validData.email) {
      validData.name = validData.email.split('@')[0];
    } else if (!validData.name) {
      validData.name = "New Employee";
    }

    return prisma.user.create({ data: validData });
  },
  // 🔥 FIX: Ensure Passkey records are explicitly tied to Int IDs
  createAuthenticator: async (data: any) => {
    return prisma.authenticator.create({
      data: {
        ...data,
        userId: Number(data.userId)
      }
    });
  }
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: customAdapter,
  providers:[
    Passkey(),
    Credentials({
      name: "Emergency Fallback",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Emergency Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials.email === "cbriell1@yahoo.com" && credentials.password === process.env.AUTH_SECRET) {
           const user = await prisma.user.findFirst({ 
             where: { email: "cbriell1@yahoo.com" } 
           });
           if (user) return user;
        }
        return null;
      }
    })
  ],
  session: { strategy: "jwt" },
  experimental: { enableWebAuthn: true },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // 🔥 FIX: Keep ID as a pure Number so internal WebAuthn checks pass
        token.id = user.id; 
        token.role = (user as any).role;
        token.systemRoles = (user as any).systemRoles;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore - Forcing TS to accept a Number ID
        session.user.id = token.id; 
        (session.user as any).role = token.role;
        (session.user as any).systemRoles = token.systemRoles;
      }
      return session;
    }
  }
})