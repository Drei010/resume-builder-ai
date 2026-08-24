export function WizardProgressBar({ step, total = 6 }: { step: number; total?: number }) {
  const pct = Math.round(((step + 1) / total) * 100);
  return (
    <div className="h-0.5 bg-border" role="none">
      <div
        className="h-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
