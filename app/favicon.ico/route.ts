import { NextResponse } from 'next/server'
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const dynamic = 'force-static'

// Genera un favicon ICO come PNG (i browser moderni accettano PNG per favicon.ico)
export async function GET() {
  const image = new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#EF4444',
          fontWeight: 'bold',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            border: '2px solid #EF4444',
            borderRadius: '6px',
          }}
        >
          AL
        </div>
      </div>
    ),
    {
      width: 32,
      height: 32,
    }
  )

  return new NextResponse(await image.arrayBuffer(), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

