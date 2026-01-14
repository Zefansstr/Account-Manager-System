import { ImageResponse } from 'next/og'
 
// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'
 
// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#22c55e',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20px',
        }}
      >
        {/* Logo SVG - Simplified version */}
        <svg
          width="140"
          height="140"
          viewBox="0 0 1024 1024"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="translate(0,1024) scale(0.1,-0.1)" fill="#ffffff">
            <path d="M4785 9070 c-133 -15 -342 -50 -490 -82 -685 -148 -1397 -529 -1885 -1010 -671 -660 -1071 -1431 -1209 -2328 -44 -291 -53 -587 -26 -895 81 -914 433 -1714 1056 -2395 496 -542 1148 -924 1919 -1124 477 -124 925 -159 1409 -110 678 69 1315 301 1875 683 361 246 799 699 1059 1096 414 632 640 1403 641 2185 0 244 -9 348 -50 610 -89 561 -280 1064 -581 1528 -401 620 -938 1103 -1588 1433 -411 207 -788 326 -1245 391 -118 16 -208 21 -475 23 -181 2 -366 -1 -410 -5z" />
          </g>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
