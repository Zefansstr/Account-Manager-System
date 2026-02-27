"use client";

import { create } from "zustand";

export interface Operator {
  id: string;
  username: string;
  full_name?: string;
  [key: string]: unknown;
}

function getInitialOperator(): Operator | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem("operator");
    return s ? (JSON.parse(s) as Operator) : null;
  } catch {
    return null;
  }
}

interface OperatorState {
  operator: Operator | null;
  setOperator: (operator: Operator | null) => void;
  clearOperator: () => void;
}

export const useOperatorStore = create<OperatorState>((set) => ({
  operator: getInitialOperator(),
  setOperator: (operator) => {
    if (operator && typeof window !== "undefined") {
      localStorage.setItem("operator", JSON.stringify(operator));
    }
    set({ operator });
  },
  clearOperator: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("operator");
      localStorage.removeItem("permissions");
    }
    set({ operator: null });
  },
}));

/** Operator ID untuk fetch (tersedia di render pertama, no waterfall) */
export function useOperatorId(): string | undefined {
  return useOperatorStore((s) => s.operator?.id);
}
