import { AVERAGE_PAY_NOTE } from "@/lib/financial-notes";

export function AveragePayFootnote({ className }: { className?: string }) {
  return (
    <p className={["text-xs leading-relaxed text-muted-foreground", className].filter(Boolean).join(" ")}>
      <span className="font-semibold">*</span> {AVERAGE_PAY_NOTE}
    </p>
  );
}

