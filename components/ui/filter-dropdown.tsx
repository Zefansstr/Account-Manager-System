"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterDropdownOption = { value: string; label: string };

type FilterDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: FilterDropdownOption[];
  placeholder?: string;
  minWidth?: string;
  className?: string;
};

export function FilterDropdown({
  value,
  onChange,
  options,
  placeholder = "Select...",
  minWidth = "140px",
  className,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div ref={ref} className={cn("relative inline-block rounded", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center justify-between gap-2 pl-4 pr-8 rounded border border-[#7F5539]/30 dark:border-[#7F5539]/50 bg-[#7F5539] dark:bg-[#7F5539] text-white text-[13px] font-medium leading-none whitespace-nowrap w-full min-w-[var(--min-w)] shadow-[0_2px_6px_rgba(127,85,57,0.25)] hover:bg-[#6b4730] dark:hover:bg-[#8f6342] transition-colors focus:outline-none focus:ring-2 focus:ring-[#7F5539]/50 focus:ring-offset-2"
        style={{ ["--min-w" as string]: minWidth }}
      >
        <span className="truncate text-left text-white">{displayLabel}</span>
        <ChevronDown
          className={cn(
            "absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none text-white transition-transform duration-200",
            open && "rotate-180"
          )}
          strokeWidth={2.5}
        />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-1.5 min-w-full rounded border border-[#7F5539]/30 dark:border-[#7F5539]/50 bg-white dark:bg-[#101211] shadow-[0_4px_14px_rgba(127,85,57,0.15)] dark:shadow-xl overflow-hidden"
          style={{ minWidth }}
        >
          <div className="max-h-[15rem] overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors",
                value === ""
                  ? "bg-nexgate-brown/12 dark:bg-nexgate-brown/25 text-nexgate-brown dark:text-nexgate-brownLight"
                  : "text-nexgate-text dark:text-gray-200 hover:bg-nexgate-beige/60 dark:hover:bg-white/10"
              )}
            >
              {placeholder}
            </button>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors",
                  value === opt.value
                    ? "bg-nexgate-brown/12 dark:bg-nexgate-brown/25 text-nexgate-brown dark:text-nexgate-brownLight"
                    : "text-nexgate-text dark:text-gray-200 hover:bg-nexgate-beige/60 dark:hover:bg-white/10"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
