import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <p className="text-primary text-sm font-medium">404</p>
      <h1 className="font-serif text-5xl tracking-[-0.02em]">Page not found</h1>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
