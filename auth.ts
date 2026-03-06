// filepath: auth.ts
import NextAuth from "next-auth"
import Passkey from "next-auth/providers/passkey"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const baseAdapter = PrismaAdapter(prisma);

const customAdapter = {
  ...baseAdapter,
  createUser: async (data: any) => {
    const { id, ...validData } = data; 
    
    // 🔥 AUTO-MERGE: If it's your email, find your real account and attach the passkey to it!
    if (validData.email === "cbriell1@yahoo.com") {
      const existingChris = await prisma.user.findFirst({
        where: { name: { equals: "Chris Briell" } } // Finds your original history
      });

      if (existingChris) {
        // Update your real account with your email and Admin rights, then return it.
        // Auth.js will attach the new Passkey directly to this original profile.
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

    // Standard fallback for other brand new employees
    if (!validData.name && validData.email) {
      validData.name = validData.email.split('@')[0];
    } else if (!validData.name) {
      validData.name = "New Employee";
    }

    return prisma.user.create({ data: validData });
  }
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: customAdapter,
  providers: [
    Passkey() 
  ],
  session: { strategy: "jwt" },
  experimental: { enableWebAuthn: true },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id.toString();
        token.role = (user as any).role;
        token.systemRoles = (user as any).systemRoles;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).systemRoles = token.systemRoles;
      }
      return session;
    }
  }
})