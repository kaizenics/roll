import type { ReactNode } from "react";
import { MaskLines } from "@/components/landing/motion";

/**
 * The app's page title: display type that slides up from a mask, with an
 * optional line of copy below and actions to the right on wide screens.
 */
export function PageHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-12 flex flex-col gap-8 border-b pb-10 md:mb-16 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="text-[clamp(2.75rem,8vw,7rem)] font-bold uppercase leading-[0.86] tracking-[-0.065em]">
          <span className="sr-only">{title}</span>
          <MaskLines lines={[title]} />
        </h1>
        {description && (
          <p className="text-muted-foreground mt-5 max-w-[60ch] text-lg">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
