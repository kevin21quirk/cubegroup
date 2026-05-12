// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// const isPublicRoute = createRouteMatcher([
//   '/sign-in(.*)',
//   '/sign-up(.*)',
//   '/api/webhooks(.*)',
// ])

// export default clerkMiddleware((auth, request) => {
//   if (!isPublicRoute(request)) {
//     auth().protect()
//   }
// })

// TEMPORARY: Authentication disabled for initial setup
// To enable authentication:
// 1. Sign up at https://clerk.com
// 2. Create a new application
// 3. Copy your API keys
// 4. Create .env file with:
//    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
//    CLERK_SECRET_KEY=sk_test_xxxxx
// 5. Uncomment the code above

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
