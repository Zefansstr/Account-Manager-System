"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type LogoProps = {
  className?: string;
  width?: number;
  height?: number;
};

export function Logo({ className = "", width = 32, height = 32 }: LogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // CSS filter untuk mengubah warna hitam menjadi hijau (primary color)
  // Formula: brightness(0) saturate(100%) invert(50%) sepia(100%) saturate(2000%) hue-rotate(120deg) brightness(0.9)
  const greenFilter = "brightness(0) saturate(100%) invert(50%) sepia(100%) saturate(2000%) hue-rotate(120deg) brightness(0.9)";
  
  // Untuk dark mode, gunakan filter yang lebih terang
  const darkModeFilter = "brightness(0) saturate(100%) invert(50%) sepia(100%) saturate(2000%) hue-rotate(120deg) brightness(1.1)";
  
  // Default to green filter if theme is not loaded yet
  const currentFilter = mounted && theme === "dark" ? darkModeFilter : greenFilter;
  
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src="/logo-2.svg"
        alt="Logo"
        width={width}
        height={height}
        className="object-contain"
        style={{
          filter: currentFilter,
        }}
        priority
      />
    </div>
  );
}
