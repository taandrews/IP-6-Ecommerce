import { DSHEA_DISCLAIMER } from "@/lib/compliance/claim-linter";

export function DsheaDisclaimer({ className }: { className?: string }) {
  return (
    <aside
      aria-label="FDA disclaimer"
      className={`rounded-md bg-ivory-200 border border-ivory-300 px-5 py-4 text-sm text-ink/80 leading-relaxed ${className ?? ""}`}
    >
      <strong className="text-forest-800">Disclaimer:</strong> {DSHEA_DISCLAIMER}
    </aside>
  );
}
