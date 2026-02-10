"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PopoverContext = React.createContext<PopoverContextValue | undefined>(undefined);

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Popover = ({ open: controlledOpen, onOpenChange, children }: PopoverProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [controlledOpen, onOpenChange]
  );

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      {children}
    </PopoverContext.Provider>
  );
};

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ className, children, asChild, ...props }, ref) => {
    const context = React.useContext(PopoverContext);
    if (!context) throw new Error("PopoverTrigger must be used within Popover");

    const handleClick = () => {
      context.setOpen(!context.open);
    };

    if (asChild && React.isValidElement(children)) {
      const childElement = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
      const mergedProps: React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement>; "data-popover-trigger"?: boolean } = {
        onClick: (e: React.MouseEvent<HTMLElement>) => {
          handleClick();
          if (childElement.props.onClick) {
            childElement.props.onClick(e as React.MouseEvent<HTMLElement>);
          }
        },
        "data-popover-trigger": true,
      };
      if (ref) {
        mergedProps.ref = ref as React.Ref<HTMLElement>;
      }
      return React.cloneElement(childElement, mergedProps);
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        data-popover-trigger
        className={cn(className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
PopoverTrigger.displayName = "PopoverTrigger";

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "start", sideOffset = 4, children, ...props }, ref) => {
    const context = React.useContext(PopoverContext);
    const triggerRef = React.useRef<HTMLElement | null>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (context?.open) {
        const trigger = document.querySelector('[data-popover-trigger]') as HTMLElement;
        if (trigger) triggerRef.current = trigger;
      }
    }, [context?.open]);

    React.useEffect(() => {
      if (!context?.open) return;

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!contentRef.current || !triggerRef.current) return;
        
        // Check if click is inside the popover content
        if (contentRef.current.contains(target)) {
          return; // Don't close if clicking inside popover
        }
        
        // Check if click is on the trigger
        if (triggerRef.current.contains(target)) {
          return; // Don't close if clicking trigger
        }
        
        // Close popover if clicking outside
        context.setOpen(false);
      };

      // Add event listener with a small delay to allow calendar button clicks to process first
      const timeoutId = setTimeout(() => {
        document.addEventListener("click", handleClickOutside, true);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("click", handleClickOutside, true);
      };
    }, [context?.open, context?.setOpen]);

    React.useEffect(() => {
      if (context?.open && triggerRef.current && contentRef.current) {
        const updatePosition = () => {
          if (!triggerRef.current || !contentRef.current) return;
          
          const triggerRect = triggerRef.current.getBoundingClientRect();
          const content = contentRef.current;
          
          let top = triggerRect.bottom + sideOffset;
          let left = triggerRect.left;
          
          if (align === "center") {
            left = triggerRect.left + (triggerRect.width / 2) - (content.offsetWidth / 2);
          } else if (align === "end") {
            left = triggerRect.right - content.offsetWidth;
          }

          // Check if content goes off screen horizontally
          if (left + content.offsetWidth > window.innerWidth - 10) {
            left = window.innerWidth - content.offsetWidth - 10;
          }
          if (left < 10) left = 10;

          // Check if content goes off screen vertically (below)
          if (top + content.offsetHeight > window.innerHeight - 10) {
            // Show above trigger instead
            top = triggerRect.top - content.offsetHeight - sideOffset;
          }
          if (top < 10) top = 10;

          content.style.position = "fixed";
          content.style.top = `${top}px`;
          content.style.left = `${left}px`;
          content.style.zIndex = "100";
          content.style.pointerEvents = "auto";
        };

        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        
        return () => {
          window.removeEventListener("resize", updatePosition);
          window.removeEventListener("scroll", updatePosition, true);
        };
      }
    }, [context?.open, align, sideOffset]);

    if (!context?.open) return null;

    const content = (
      <div
        ref={(node) => {
          if (ref) {
            if (typeof ref === 'function') ref(node);
            else ref.current = node;
          }
          contentRef.current = node;
        }}
        data-popover-content
        className={cn(
          "z-[100] w-72 rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-xl",
          className
        )}
        style={{ 
          pointerEvents: 'auto',
          zIndex: 100
        }}
        {...props}
      >
        {children}
      </div>
    );

    if (typeof document !== 'undefined') {
      return createPortal(content, document.body);
    }

    return content;
  }
);
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
