"use client";

import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminActionButtonProps = Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  successLabel?: string;
};

export function AdminActionButton({
  children,
  className,
  successLabel = "Saved",
  ...props
}: AdminActionButtonProps) {
  const [state, setState] = useState<"idle" | "working" | "done">("idle");

  const handleClick = () => {
    setState("working");
    window.setTimeout(() => {
      setState("done");
      window.setTimeout(() => setState("idle"), 1800);
    }, 450);
  };

  return (
    <Button
      className={cn("min-w-24", className)}
      onClick={handleClick}
      disabled={state === "working" || props.disabled}
      {...props}
    >
      {state === "working" ? <LoaderCircle className="animate-spin" /> : null}
      {state === "done" ? <Check /> : null}
      {state === "done" ? successLabel : children}
    </Button>
  );
}
