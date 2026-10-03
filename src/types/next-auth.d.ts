import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & NonNullable<DefaultSession['user']>;
  }
  interface User {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
  }
}