import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'PRO DOTA ANALISI - AttilaLAB API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      opendota: 'connected',
      vercel: 'operational',
    },
  })
}