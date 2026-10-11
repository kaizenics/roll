import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary:
    "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

export function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-10 rounded-full transition-colors ${checked ? "bg-brand" : "bg-zinc-300 dark:bg-zinc-700"}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`}
        />
      </button>
    </label>
  );
}

export function Alert({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "info";
}) {
  const styles =
    tone === "error"
      ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
      : "bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-lg p-3 text-sm ${styles}`}>
      {children}
    </p>
  );
}
