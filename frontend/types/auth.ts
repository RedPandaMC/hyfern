import { Role } from '@/app/generated/prisma';
import { DefaultSession } from 'next-auth';

// Extended session user type with custom fields
export interface SessionUser {
  id: string;
  username: string;
  role: Role;
}

// Extend NextAuth session type to include custom user fields
declare module 'next-auth' {
  interface Session {
    user: SessionUser;
  }

  interface User {
    id: string;
    username: string;
    role: Role;
  }
}

// Extend NextAuth JWT type to include custom fields
declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    username: string;
    role: Role;
  }
}
