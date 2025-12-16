import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Dota 2 Coaching Platform API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      opendota: 'connected',
      vercel: 'operational',
    },
  })
}