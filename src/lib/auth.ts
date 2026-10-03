import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';

const roleNames = { applicant: 'Applicant', officer: 'Department Officer', nodal: 'Nodal Officer', admin: 'Admin' } as const;

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [CredentialsProvider({
    name: 'Demo credentials',
    credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' }, role: { label: 'Role', type: 'text' } },
    async authorize(credentials) {
      if (!credentials || !Object.hasOwn(roleNames, credentials.role)) return null;
      const user = await prisma.user.findUnique({ where: { email: credentials.email }, include: { roles: true } });
      if (!user || !user.roles.some((role) => role.name === roleNames[credentials.role as keyof typeof roleNames])) return null;
      if (!(await compare(credentials.password, user.passwordHash))) return null;
      return { id: user.id, name: user.name, email: user.email, role: credentials.role };
    },
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user && 'role' in user) token.role = user.role as string;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.sub ?? '');
        session.user.role = String(token.role ?? 'applicant');
      }
      return session;
    },
  },
};