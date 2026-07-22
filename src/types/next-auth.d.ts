import 'next-auth'

declare module 'next-auth' {
  interface User {
    role: string
    familyId: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      familyId: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    familyId: string
  }
}
