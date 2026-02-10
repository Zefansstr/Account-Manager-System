"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = value ? new Date(value) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date && onChange) {
      // Format as YYYY-MM-DD for input type="date" compatibility
      const formattedDate = format(date, "yyyy-MM-dd");
      onChange(formattedDate);
      // Close popover after a small delay to ensure state updates
      setTimeout(() => {
        setOpen(false);
      }, 100);
    } else if (!date && onChange) {
      onChange("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative w-full">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        {open && (
          <PopoverContent 
            className="w-auto p-0 mt-1 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200" 
            align="start"
          >
            <Calendar selected={selectedDate} onSelect={handleSelect} />
          </PopoverContent>
        )}
      </div>
    </Popover>
  );
}
