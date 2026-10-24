import { clerkMiddleware } from "@clerk/nextjs/server";

// Reads the Clerk session on each request. Pages and Server Functions check sign-in themselves (src/lib/session.ts).
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals, static files and the plain 3D world scripts.
    "/((?!_next|legacy/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
