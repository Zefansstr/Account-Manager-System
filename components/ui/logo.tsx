"use client";

import Image from "next/image";

type LogoProps = {
  className?: string;
  width?: number;
  height?: number;
};

export function Logo({ className = "", width = 32, height = 32 }: LogoProps) {
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src="/logo-2.svg"
        alt="Logo"
        width={width}
        height={height}
        className="object-contain"
        style={{
          filter: "brightness(0) saturate(100%) invert(50%) sepia(100%) saturate(2000%) hue-rotate(120deg) brightness(0.9)",
        }}
      />
    </div>
  );
}
