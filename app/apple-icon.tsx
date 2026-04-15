import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fffaf3',
          borderRadius: 40,
          border: '4px solid #e4d6c4',
          fontFamily: 'Georgia, serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at top left, rgba(188,120,90,0.16), transparent 38%), radial-gradient(circle at bottom right, rgba(110,133,103,0.18), transparent 40%)',
          }}
        />
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: 28,
            background: '#bb785a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fffaf3',
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          B
        </div>
      </div>
    ),
    size
  )
}
