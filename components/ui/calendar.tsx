"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
}

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    if (onSelect) {
      onSelect(date);
    }
  };

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div 
      className={cn("p-3 bg-card rounded-lg", className)}
      style={{ pointerEvents: 'auto' }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={previousMonth}
          className="p-1.5 hover:bg-secondary rounded-md transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="font-semibold text-sm text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 hover:bg-secondary rounded-md transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1.5">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selected && isSameDay(day, selected);
          const isTodayDate = isToday(day);

          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log("Button clicked for date:", day);
                handleDateClick(day);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                console.log("MouseDown on date:", day);
              }}
              style={{ pointerEvents: 'auto', zIndex: 101 }}
              className={cn(
                "h-8 w-8 text-xs rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 cursor-pointer relative",
                !isCurrentMonth && "text-muted-foreground opacity-30",
                isSelected && "bg-primary text-primary-foreground font-semibold shadow-sm",
                !isSelected && isCurrentMonth && "hover:bg-secondary hover:text-foreground",
                isTodayDate && !isSelected && "border border-primary font-semibold",
                isCurrentMonth && !isSelected && !isTodayDate && "text-foreground"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDateClick(new Date());
          }}
          className="text-xs text-primary hover:underline font-medium px-2 py-1 rounded hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
        >
          Today
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(undefined);
          }}
          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
