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
        where: { name: { contains: "Chris Briell", mode: 'insensitive' } } 
      });
      if (existingChris) {
        const updated = await prisma.user.update({
          where: { id: existingChris.id },
          data: { email: "cbriell1@yahoo.com", role: "ADMIN", systemRoles:["Administrator", "Manager", "Front Desk"] }
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

  getUserByAccount: async (providerAccountId: any) => {
    const account = await prisma.account.findUnique({
      where: { provider_providerAccountId: providerAccountId },
      select: { user: true },
    });
    if (!account?.user) return null;
    return { ...account.user, id: account.user.id.toString() };
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
  },

  createAuthenticator: async (authenticator: any) => {
    const created = await prisma.authenticator.create({ data: { ...authenticator, userId: Number(authenticator.userId) } });
    return { ...created, userId: created.userId.toString() };
  },

  getAuthenticator: async (credentialID: string) => {
    const authenticator = await prisma.authenticator.findUnique({ where: { credentialID } });
    if (!authenticator) return null;
    return { ...authenticator, userId: authenticator.userId.toString() };
  },

  listAuthenticatorsByUserId: async (userId: string) => {
    const authenticators = await prisma.authenticator.findMany({ where: { userId: Number(userId) } });
    return authenticators.map(a => ({ ...a, userId: a.userId.toString() }));
  },

  updateAuthenticatorCounter: async (credentialID: string, counter: number) => {
    const updated = await prisma.authenticator.update({ where: { credentialID }, data: { counter } });
    return { ...updated, userId: updated.userId.toString() };
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
        const inputEmail = String(credentials?.email || "").toLowerCase().trim();
        const inputPassword = String(credentials?.password || "").trim();
        const serverSecret = process.env.AUTH_SECRET;

        if (!serverSecret) {
          console.error("🚨 AUTH_SECRET is missing in Environment Variables!");
          return null;
        }

        if (inputEmail === "cbriell1@yahoo.com" && inputPassword === serverSecret) {
           let user = await prisma.user.findFirst({ where: { email: "cbriell1@yahoo.com" } });
           
           if (!user) {
             user = await prisma.user.create({
               data: {
                 name: "Chris Briell",
                 email: "cbriell1@yahoo.com",
                 role: "ADMIN",
                 systemRoles:["Administrator", "Manager", "Front Desk"],
                 isActive: true,
                 receiveReportEmails: true
               }
             });
           }
           return { ...user, id: user.id.toString() };
        }
        return null;
      }
    })
  ],
  session: { strategy: "jwt" }, // <-- Reverted to JWT to fix Credentials
  experimental: { enableWebAuthn: true },
  callbacks: {
    async jwt({ token, user }) {
      // 1. Initial Sign In: Generate a tracking session in the database
      if (user) {
        token.id = user.id.toString();
        
        const sessionToken = crypto.randomUUID();
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        
        await prisma.session.create({
          data: {
            sessionToken,
            userId: Number(user.id),
            expires
          }
        });
        
        token.sessionId = sessionToken;
      }

      // 2. On every request, check if the session was killed by an Admin
      if (token.id && token.sessionId) {
        const activeSession = await prisma.session.findUnique({
          where: { sessionToken: token.sessionId as string }
        });

        if (!activeSession) {
          // Admin deleted the session! Flag it for destruction.
          token.isRevoked = true;
        } else {
          token.isRevoked = false;
          // Keep roles updated live
          const dbUser = await prisma.user.findUnique({
            where: { id: Number(token.id) },
            select: { role: true, systemRoles: true }
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.systemRoles = dbUser.systemRoles;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      // If the Admin deleted the session, we return a blank object. 
      // This tells the frontend to kick the user out immediately.
      if (token.isRevoked) {
        return {} as any; 
      }

      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).systemRoles = token.systemRoles;
      }
      return session;
    }
  }
});