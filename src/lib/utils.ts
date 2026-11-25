import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const pct = (p: number, digits = 1): string => `${(p * 100).toFixed(digits)}%`;
