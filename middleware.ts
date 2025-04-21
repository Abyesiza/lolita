import { clerkMiddleware } from '@clerk/nextjs/server';

// See https://clerk.com/docs/references/nextjs/middleware for more information about configuring your middleware
export default clerkMiddleware();

export const config = {
  // Matches all routes except for public asset patterns
  matcher: [
    // Skip static files and public assets
    '/((?!_next|public|favicon.ico|logo.png).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};