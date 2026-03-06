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
    
    // Auto-Merge for your Admin account
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
            systemRoles:["Administrator", "Manager", "Front Desk"] 
          }
        });
      }
    }

    // Default fallback for new staff
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
  providers:[
    Passkey(),
    
    // 🔥 EMERGENCY BACKDOOR FOR DOMAIN MIGRATIONS & LOST PASSKEYS
    Credentials({
      name: "Emergency Fallback",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Emergency Password (AUTH_SECRET)", type: "password" }
      },
      async authorize(credentials) {
        // Only allows your specific email, and uses your server's secret as the password
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