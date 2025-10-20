"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "warning";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  };

  const bgColors = {
    success: "bg-green-100 border-green-300",
    error: "bg-red-100 border-red-300",
    warning: "bg-yellow-100 border-yellow-300",
  };

  const textColors = {
    success: "text-green-900",
    error: "text-red-900",
    warning: "text-yellow-900",
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 min-w-[320px] max-w-[480px] p-4 rounded-lg border-2 shadow-lg animate-in slide-in-from-top-2 ${bgColors[type]}`}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <p className={`flex-1 text-sm font-medium ${textColors[type]}`}>{message}</p>
      <button
        onClick={onClose}
        className={`flex-shrink-0 hover:opacity-70 transition-opacity ${textColors[type]}`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

