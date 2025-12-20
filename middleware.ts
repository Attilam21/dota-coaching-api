import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if this is an internal API call (server-to-server)
  const isInternalCall = request.headers.get('x-internal-call') === 'true'
  const bypassToken = request.headers.get('x-vercel-protection-bypass')

  // If it's an internal call or has bypass token, allow it
  if (isInternalCall || bypassToken) {
    // Add header to indicate this is an internal call
    const response = NextResponse.next()
    response.headers.set('x-internal-request', 'true')
    return response
  }

  // For all other requests, continue normally
  return NextResponse.next()
}

// Only run middleware on API routes
export const config = {
  matcher: '/api/:path*',
}

