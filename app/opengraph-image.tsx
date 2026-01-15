import { ImageResponse } from 'next/og'
 
// Image metadata
export const alt = 'NexGate'
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 30,
          }}
        >
          <svg
            width="150"
            height="150"
            viewBox="0 0 1024 1024"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g transform="translate(0,1024) scale(0.1,-0.1)" fill="#22c55e">
              <path d="M4785 9070 c-133 -15 -342 -50 -490 -82 -685 -148 -1397 -529 -1885 -1010 -671 -660 -1071 -1431 -1209 -2328 -44 -291 -53 -587 -26 -895 81 -914 433 -1714 1056 -2395 496 -542 1148 -924 1919 -1124 477 -124 925 -159 1409 -110 678 69 1315 301 1875 683 361 246 799 699 1059 1096 414 632 640 1403 641 2185 0 244 -9 348 -50 610 -89 561 -280 1064 -581 1528 -401 620 -938 1103 -1588 1433 -411 207 -788 326 -1245 391 -118 16 -208 21 -475 23 -181 2 -366 -1 -410 -5z" />
            </g>
          </svg>
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
          NexGate
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
