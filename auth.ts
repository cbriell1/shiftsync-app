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
    
    // AUTO-LINKING LOGIC:
    // If this is Chris logging in for the first time with an email, 
    // find the existing "Chris Briell" account and attach the email to it.
    if (validData.email === "cbriell1@yahoo.com") {
      const existingChris = await prisma.user.findFirst({ 
        where: { name: { contains: "Chris Briell", mode: 'insensitive' } } 
      });
      
      if (existingChris) {
        const updated = await prisma.user.update({
          where: { id: existingChris.id },
          data: { 
            email: "cbriell1@yahoo.com", 
            role: "ADMIN", 
            systemRoles: ["Administrator", "Manager", "Front Desk"] 
          }
        });
        return { ...updated, id: updated.id.toString() };
      }
    }

    if (!validData.name) validData.name = validData.email ? validData.email.split('@')[0] : "New Employee";
    const created = await prisma.user.create({ data: validData });
    return { ...created, id: created.id.toString() };
  },

  getUser: async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) return null;
    return { ...user, id: user.id.toString() };
  },

  getUserByEmail: async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return { ...user, id: user.id.toString() };
  },

  updateUser: async (user: any) => {
    const { id, ...data } = user;
    const updated = await prisma.user.update({ where: { id: Number(id) }, data });
    return { ...updated, id: updated.id.toString() };
  },

  linkAccount: async (account: any) => {
    await prisma.account.create({ data: { ...account, userId: Number(account.userId) } });
    return account;
  },

  createSession: async (session: any) => {
    const created = await prisma.session.create({ data: { ...session, userId: Number(session.userId) } });
    return { ...created, userId: created.userId.toString() };
  },

  getSessionAndUser: async (sessionToken: string) => {
    const userAndSession = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });
    if (!userAndSession) return null;
    const { user, ...session } = userAndSession;
    return {
      session: { ...session, userId: session.userId.toString() },
      user: { ...user, id: user.id.toString() },
    };
  }
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: customAdapter,
  providers: [
    Passkey(),
    Credentials({
      name: "Emergency Fallback",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Emergency Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials.email === "cbriell1@yahoo.com" && credentials.password === process.env.AUTH_SECRET) {
           const user = await prisma.user.findFirst({ where: { email: "cbriell1@yahoo.com" } });
           if (user) return { ...user, id: user.id.toString() };
        }
        return null;
      }
    })
  ],
  session: { strategy: "jwt" },
  experimental: { enableWebAuthn: true },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign in
      if (user) {
        token.id = user.id.toString();
      }

      // RE-VALIDATION: Every time the token is accessed, fetch latest roles from DB
      // This prevents "Access Denied" if roles were updated while you were logged in
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: Number(token.id) },
          select: { role: true, systemRoles: true }
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.systemRoles = dbUser.systemRoles;
        }
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
});