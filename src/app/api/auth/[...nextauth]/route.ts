import NextAuth from 'next-auth';
import { authOptions } from '@/utils/authOptions';

// ── Production Environment Validation ──────────────────────────────────────
// Ensure critical secrets are explicitly configured in production.
const isProd = process.env.NODE_ENV === 'production';
if (isProd && !process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required in production.');
}
if (isProd && !process.env.NEXTAUTH_URL) {
  throw new Error('NEXTAUTH_URL environment variable is required in production.');
}
if (isProd && (!process.env.GITHUB_ID || !process.env.GITHUB_SECRET)) {
  throw new Error('GITHUB_ID and GITHUB_SECRET environment variables are required in production.');
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
