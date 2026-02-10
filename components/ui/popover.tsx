"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
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
  const triggerRef = React.useRef<HTMLElement | null>(null);
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
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
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

    // Combined ref callback to set both forwarded ref and context ref
    const setRefs = React.useCallback((node: HTMLButtonElement | null) => {
      // Set forwarded ref
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      }
      // Set context ref (cast to HTMLElement since triggerRef accepts HTMLElement)
      if (context.triggerRef) {
        (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node as HTMLElement | null;
      }
    }, [ref, context.triggerRef]);

    if (asChild && React.isValidElement(children)) {
      const childElement = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
      const mergedProps: React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement>; "data-popover-trigger"?: boolean } = {
        ref: setRefs,
        onClick: (e: React.MouseEvent<HTMLElement>) => {
          handleClick();
          if (childElement.props.onClick) {
            childElement.props.onClick(e as React.MouseEvent<HTMLElement>);
          }
        },
        "data-popover-trigger": true,
      };
      return React.cloneElement(childElement, mergedProps);
    }

    return (
      <button
        ref={setRefs}
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
    if (!context) throw new Error("PopoverContent must be used within Popover");
    
    const contentRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = context.triggerRef;

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
      if (context?.open && triggerRef.current) {
        // Use requestAnimationFrame with double frame to ensure DOM is fully rendered
        const updatePosition = () => {
          // First frame: ensure trigger is found
          requestAnimationFrame(() => {
            // Second frame: calculate position after DOM is stable
            requestAnimationFrame(() => {
              if (!context?.open) return;
              
              const trigger = triggerRef.current;
              if (!trigger || !contentRef.current) return;
              
              const triggerRect = trigger.getBoundingClientRect();
              const content = contentRef.current;
              
              // Wait for content to be rendered
              if (content.offsetWidth === 0 || content.offsetHeight === 0) {
                // If content not yet rendered, try again after a short delay
                setTimeout(updatePosition, 10);
                return;
              }
              
              // Check if trigger is inside a dialog
              const dialog = trigger.closest('[role="dialog"]') as HTMLElement;
              const isInDialog = !!dialog;
              
              let top: number;
              let left: number;
              let position: 'fixed' | 'absolute' = 'fixed';
              
              if (isInDialog) {
                // If inside dialog, use absolute positioning relative to dialog
                const dialogRect = dialog.getBoundingClientRect();
                const triggerRelativeTop = triggerRect.top - dialogRect.top;
                const triggerRelativeLeft = triggerRect.left - dialogRect.left;
                
                top = triggerRelativeTop + triggerRect.height + sideOffset;
                left = triggerRelativeLeft;
                
                if (align === "center") {
                  left = triggerRelativeLeft + (triggerRect.width / 2) - (content.offsetWidth / 2);
                } else if (align === "end") {
                  left = triggerRelativeLeft + triggerRect.width - content.offsetWidth;
                }
                
                // Check if content goes off dialog horizontally
                if (left + content.offsetWidth > dialogRect.width - 10) {
                  left = dialogRect.width - content.offsetWidth - 10;
                }
                if (left < 10) left = 10;
                
                // Check if content goes off dialog vertically
                if (top + content.offsetHeight > dialogRect.height - 10) {
                  // Show above trigger instead
                  top = triggerRelativeTop - content.offsetHeight - sideOffset;
                }
                if (top < 10) top = 10;
                
                position = 'absolute';
                content.style.position = position;
                content.style.top = `${top}px`;
                content.style.left = `${left}px`;
              } else {
                // If not in dialog, use fixed positioning
                top = triggerRect.bottom + sideOffset;
                left = triggerRect.left;
                
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
                
                content.style.position = position;
                content.style.top = `${top}px`;
                content.style.left = `${left}px`;
              }
              
              // Set styles
              content.style.zIndex = "9999";
              content.style.pointerEvents = "auto";
              
              // Set initial state for animation
              content.style.opacity = "0";
              content.style.transform = "scale(0.96) translateY(-2px)";
              
              // Animate in smoothly with better easing curve
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  content.style.transition = "opacity 250ms cubic-bezier(0.16, 1, 0.3, 1), transform 250ms cubic-bezier(0.16, 1, 0.3, 1)";
                  content.style.opacity = "1";
                  content.style.transform = "scale(1) translateY(0)";
                });
              });
            });
          });
        };

        updatePosition();
        
        const handleResize = () => updatePosition();
        const handleScroll = () => updatePosition();
        
        window.addEventListener("resize", handleResize);
        window.addEventListener("scroll", handleScroll, true);
        
        return () => {
          window.removeEventListener("resize", handleResize);
          window.removeEventListener("scroll", handleScroll, true);
        };
      }
    }, [context?.open, align, sideOffset, triggerRef]);

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
          "w-72 rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-xl",
          className
        )}
        style={{ 
          pointerEvents: 'auto',
          zIndex: 9999,
        }}
        {...props}
      >
        {children}
      </div>
    );

    if (typeof document !== 'undefined') {
      // Try to find dialog content to render inside dialog, otherwise use body
      const dialogContent = triggerRef.current?.closest('[role="dialog"]') as HTMLElement;
      const portalTarget = dialogContent || document.body;
      
      return createPortal(content, portalTarget);
    }

    return content;
  }
);
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
