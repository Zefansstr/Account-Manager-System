"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type LogoProps = {
  className?: string;
  width?: number;
  height?: number;
  variant?: "green" | "white";
};

export function Logo({ className = "", width = 32, height = 32, variant = "green" }: LogoProps) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check theme from document or localStorage
    const checkTheme = () => {
      const htmlElement = document.documentElement;
      const hasDarkClass = htmlElement.classList.contains("dark");
      const savedTheme = localStorage.getItem("theme");
      setIsDark(hasDarkClass || savedTheme === "dark");
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // CSS filter untuk mengubah warna hitam menjadi hijau (primary color)
  const greenFilter = "brightness(0) saturate(100%) invert(50%) sepia(100%) saturate(2000%) hue-rotate(120deg) brightness(0.9)";
  const darkModeGreenFilter = "brightness(0) saturate(100%) invert(50%) sepia(100%) saturate(2000%) hue-rotate(120deg) brightness(1.1)";
  
  // CSS filter untuk mengubah warna hitam menjadi putih
  const whiteFilter = "brightness(0) saturate(100%) invert(100%)";
  
  // Determine filter based on variant
  let currentFilter: string;
  if (variant === "white") {
    currentFilter = whiteFilter;
  } else {
    currentFilter = mounted && isDark ? darkModeGreenFilter : greenFilter;
  }
  
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
