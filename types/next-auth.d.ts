import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    sessionId?: string
    user: {
      id: string
      role: string
      systemRoles: string[]
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    systemRoles: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    systemRoles: string[]
    sessionId?: string
  }
}
