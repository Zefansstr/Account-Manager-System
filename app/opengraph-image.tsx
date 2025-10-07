import { ImageResponse } from 'next/og'
 
// Image metadata
export const alt = 'Account Management System'
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
// Image generation
export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(135deg, #0a0e27 0%, #1a1d2e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            opacity: 0.3,
          }}
        />
        
        {/* Logo/Icon */}
        <div
          style={{
            width: 150,
            height: 150,
            background: '#22c55e',
            borderRadius: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 100,
            fontWeight: 'bold',
            marginBottom: 30,
            boxShadow: '0 20px 50px rgba(34, 197, 94, 0.5)',
          }}
        >
          A
        </div>
        
        {/* Title */}
        <div
          style={{
            fontSize: 70,
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #22c55e 0%, #86efac 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            marginBottom: 20,
          }}
        >
          Account Management System
        </div>
        
        {/* Description */}
        <div
          style={{
            fontSize: 30,
            color: '#9ca3af',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          Full RBAC • Data Filtering • Audit Logs • Dark Theme
        </div>
        
        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 20,
            color: '#6b7280',
          }}
        >
          Built with Next.js 15 • TypeScript • Supabase
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}

