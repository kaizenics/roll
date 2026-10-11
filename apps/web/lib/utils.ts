import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatViews(count: number): string {
  return `${count.toLocaleString("en")} ${count === 1 ? "view" : "views"}`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
