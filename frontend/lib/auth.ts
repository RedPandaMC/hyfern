import NextAuth, { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifyPassword, verifyTOTP } from '@/lib/auth-utils';
import {
  checkRateLimit,
  recordLoginAttempt,
  clearLoginAttempts,
} from '@/lib/rate-limit';
import { Role } from '@/app/generated/prisma';

// Session configuration
const JWT_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds
const SESSION_IDLE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const MAX_SESSIONS_PER_USER = 3;

/**
 * Get the client IP address from the request
 */
function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        totpToken: { label: '2FA Token', type: 'text' },
      },
      async authorize(credentials, request) {
        // Validate credentials exist
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = credentials.username as string;
        const password = credentials.password as string;
        const totpToken = credentials.totpToken as string | undefined;

        // Get client IP for rate limiting
        const ipAddress = getClientIp(request as unknown as Request);

        // Check rate limit
        const rateLimitCheck = await checkRateLimit(ipAddress);
        if (rateLimitCheck.isRateLimited) {
          await recordLoginAttempt(ipAddress, false);
          throw new Error(
            `Too many login attempts. Please try again after ${rateLimitCheck.resetTime?.toLocaleTimeString()}`
          );
        }

        // Find user by username
        const user = await prisma.user.findUnique({
          where: { username },
        });

        if (!user) {
          await recordLoginAttempt(ipAddress, false);
          return null;
        }

        // Verify password
        const isValidPassword = await verifyPassword(
          password,
          user.passwordHash
        );

        if (!isValidPassword) {
          await recordLoginAttempt(ipAddress, false);
          return null;
        }

        // Check if 2FA is enabled and verify token
        if (user.totpEnabled && user.totpSecret) {
          if (!totpToken) {
            await recordLoginAttempt(ipAddress, false);
            throw new Error('2FA token required');
          }

          const isValidToken = verifyTOTP(user.totpSecret, totpToken);

          if (!isValidToken) {
            await recordLoginAttempt(ipAddress, false);
            throw new Error('Invalid 2FA token');
          }
        }

        // Successful login - clear rate limit attempts
        await recordLoginAttempt(ipAddress, true);
        await clearLoginAttempts(ipAddress);

        // Manage concurrent sessions - delete oldest if exceeding limit
        const existingSessions = await prisma.session.findMany({
          where: { userId: user.id },
          orderBy: { lastActiveAt: 'asc' },
        });

        if (existingSessions.length >= MAX_SESSIONS_PER_USER) {
          const sessionsToDelete = existingSessions.slice(
            0,
            existingSessions.length - MAX_SESSIONS_PER_USER + 1
          );
          await prisma.session.deleteMany({
            where: {
              id: {
                in: sessionsToDelete.map((s) => s.id),
              },
            },
          });
        }

        // Create new session in database
        const userAgent = (request as any).headers?.get('user-agent') || '';
        const expiresAt = new Date(Date.now() + JWT_MAX_AGE * 1000);

        await prisma.session.create({
          data: {
            userId: user.id,
            expiresAt,
            lastActiveAt: new Date(),
            ipAddress,
            userAgent,
          },
        });

        // Return user object for JWT
        return {
          id: user.id,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          username: token.username as string,
          role: token.role as Role,
        };

        // Update session activity
        try {
          await prisma.session.updateMany({
            where: {
              userId: token.id as string,
              expiresAt: {
                gt: new Date(),
              },
            },
            data: {
              lastActiveAt: new Date(),
            },
          });

          // Check for idle timeout
          const sessions = await prisma.session.findMany({
            where: {
              userId: token.id as string,
              expiresAt: {
                gt: new Date(),
              },
            },
            orderBy: {
              lastActiveAt: 'desc',
            },
          });

          // Delete sessions that have been idle for too long
          const now = Date.now();
          const idleSessions = sessions.filter(
            (s) => now - s.lastActiveAt.getTime() > SESSION_IDLE_TIMEOUT
          );

          if (idleSessions.length > 0) {
            await prisma.session.deleteMany({
              where: {
                id: {
                  in: idleSessions.map((s) => s.id),
                },
              },
            });
          }
        } catch (error) {
          console.error('Failed to update session activity:', error);
        }
      }

      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: JWT_MAX_AGE,
  },
  jwt: {
    maxAge: JWT_MAX_AGE,
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
