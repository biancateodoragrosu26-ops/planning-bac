import { ImageResponse } from 'next/og'

export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f6efe5',
          position: 'relative',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 34,
            borderRadius: 112,
            background:
              'radial-gradient(circle at top left, rgba(188,120,90,0.18), transparent 34%), radial-gradient(circle at bottom right, rgba(110,133,103,0.2), transparent 34%), #fffaf3',
            border: '10px solid #e4d6c4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 24px 60px rgba(93, 68, 48, 0.12)',
          }}
        >
          <div
            style={{
              width: 240,
              height: 240,
              borderRadius: 72,
              background: '#bb785a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fffaf3',
              fontSize: 138,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            B
          </div>
        </div>
      </div>
    ),
    size
  )
}
