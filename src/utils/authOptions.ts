import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * Custom NextAuth interface extensions to support custom fields.
 */
interface ExtendedNextAuthUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  displayName?: string | null;
}

interface ExtendedNextAuthProfile {
  id?: string | number;
}

/**
 * Shared configuration options for NextAuth.js authentication.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    // 30 days session duration
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    // 1. Developer Credentials for Local Development
    CredentialsProvider({
      name: 'Developer Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@llmdb.org" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        // Fetch user from database
        const userList = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1);
        if (userList.length === 0) {
          throw new Error('No user found with this email');
        }

        const user = userList[0];

        // Ensure user has a password set (OAuth accounts might not have one)
        if (!user.passwordHash) {
          throw new Error('This account uses OAuth login. Please sign in using your provider.');
        }

        // Validate password hash
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error('Incorrect password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          image: user.avatarUrl,
          role: user.role
        };
      }
    }),
    // 2. Production GitHub OAuth
    GithubProvider({
      clientId: process.env.GITHUB_ID || 'mock_github_id_dev_only',
      clientSecret: process.env.GITHUB_SECRET || 'mock_github_secret_dev_only',
    })
  ],
  callbacks: {
    // Check user sign in and provision accounts
    async signIn({ user, account, profile }) {
      // Parse admin emails from environment variable
      const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean);

      if (account?.provider === 'github') {
        const email = user.email;
        if (!email) return false;

        const githubId = (profile as ExtendedNextAuthProfile)?.id?.toString() || '';

        // Query if user already exists
        const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);

        const emailLower = email.toLowerCase();
        const shouldBeAdmin = adminEmails.includes(emailLower);

        if (existingUsers.length > 0) {
          const dbUser = existingUsers[0];
          let role = dbUser.role;

          // Auto-promote if in ADMIN_EMAILS and not currently an admin
          if (shouldBeAdmin && dbUser.role !== 'admin') {
            role = 'admin';
            await db.update(users).set({ role }).where(eq(users.id, dbUser.id));
          }

          // Update githubId or avatar if missing or if role was updated
          if (!dbUser.githubId || !dbUser.avatarUrl || dbUser.role !== role) {
            await db.update(users)
               .set({
                 githubId: githubId || dbUser.githubId,
                 avatarUrl: user.image || dbUser.avatarUrl,
                 displayName: dbUser.displayName || user.name || dbUser.displayName,
                 role
               })
               .where(eq(users.id, dbUser.id));
          }
          (user as ExtendedNextAuthUser).role = role;
          (user as ExtendedNextAuthUser).id = dbUser.id;
          (user as ExtendedNextAuthUser).displayName = dbUser.displayName || user.name;
        } else {
          // Auto-create new user
          const initialRole = shouldBeAdmin ? 'admin' : 'user';
          const inserted = await db.insert(users)
            .values({
              email,
              githubId,
              displayName: user.name || email.split('@')[0],
              avatarUrl: user.image || null,
              role: initialRole
            })
            .returning();
          
          (user as ExtendedNextAuthUser).role = initialRole;
          (user as ExtendedNextAuthUser).id = inserted[0].id;
          (user as ExtendedNextAuthUser).displayName = inserted[0].displayName;
        }
      } else if (account?.provider === 'credentials') {
        const email = user.email;
        if (!email) return false;

        const emailLower = email.toLowerCase();
        const shouldBeAdmin = adminEmails.includes(emailLower);

        // Hydrate direct user properties from authorize
        const dbUserList = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (dbUserList.length > 0) {
          const dbUser = dbUserList[0];
          let role = dbUser.role;

          // Auto-promote credentials user if in ADMIN_EMAILS and not currently an admin
          if (shouldBeAdmin && dbUser.role !== 'admin') {
            role = 'admin';
            await db.update(users).set({ role }).where(eq(users.id, dbUser.id));
          }

          (user as ExtendedNextAuthUser).id = dbUser.id;
          (user as ExtendedNextAuthUser).role = role;
          (user as ExtendedNextAuthUser).displayName = dbUser.displayName;
        }
      }
      return true;
    },
    // Populate session token properties
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as ExtendedNextAuthUser).id;
        token.role = (user as ExtendedNextAuthUser).role || 'user';
        token.displayName = (user as ExtendedNextAuthUser).displayName || user.name || '';
      }
      return token;
    },
    // Populate client-facing session details
    async session({ session, token }) {
      if (session.user) {
        (session.user as ExtendedNextAuthUser).id = token.id as string;
        (session.user as ExtendedNextAuthUser).role = token.role as string;
        (session.user as ExtendedNextAuthUser).displayName = token.displayName as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  // JWT signing secret
  secret: process.env.NEXTAUTH_SECRET || 'llmdb-dev-only-jwt-signing-key-not-for-production-use',
};
