import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { NotFoundPoster } from "@/components/not-found-poster";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <NotFoundPoster title="Page not found">
      <Button asChild size="lg">
        <Link href="/">
          Go home
          <ArrowUpRight aria-hidden />
        </Link>
      </Button>
    </NotFoundPoster>
  );
}
