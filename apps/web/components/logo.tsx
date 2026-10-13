import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="focus-visible:ring-ring/50 flex items-center gap-2 rounded-md text-lg font-semibold tracking-tight outline-none focus-visible:ring-[3px]"
    >
      <span
        aria-hidden
        className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full"
      >
        <span className="bg-record size-2.5 rounded-full" />
      </span>
      Roll
    </Link>
  );
}
