"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({
  url,
  variant = "outline",
  size = "sm",
  label = "Copy link",
}: {
  url: string;
  variant?: "outline" | "default" | "ghost" | "secondary";
  size?: "sm" | "default" | "icon";
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link. Copy it from the address bar instead.");
    }
  }

  const Icon = copied ? Check : Link2;
  return (
    <Button type="button" variant={variant} size={size} onClick={copy} aria-label={label}>
      <Icon aria-hidden />
      {size !== "icon" && <span>{copied ? "Copied" : label}</span>}
    </Button>
  );
}
