'use client'; 
 
type LogoMarkProps = { 
  sizeClass?: string; 
  className?: string; 
}; 
 
export default function LogoMark({ sizeClass = 'w-8 h-8', className = '' }: LogoMarkProps) { 
  return ( 
    <div className={`flex items-center justify-center rounded-[16px] bg-jira-blue ${sizeClass} ${className}`}> 
      <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true"> 
        <rect width="64" height="64" rx="16" fill="#0052CC" /> 
        <rect x="18" y="18" width="6" height="28" rx="3" fill="#FFFFFF" /> 
        <rect x="28" y="14" width="6" height="34" rx="3" fill="#FFFFFF" /> 
        <rect x="38" y="20" width="6" height="24" rx="3" fill="#FFFFFF" /> 
      </svg> 
    </div> 
  ); 
}