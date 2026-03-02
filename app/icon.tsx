import { ImageResponse } from 'next/og'
 
// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'
 
// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#7f5539',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 17 17" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1" fill="white" />
          <rect x="10" y="1" width="6" height="6" rx="1" fill="white" />
          <rect x="1" y="10" width="6" height="6" rx="1" fill="white" />
          <rect x="10" y="10" width="6" height="6" rx="1" fill="white" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
