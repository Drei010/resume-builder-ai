import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEP_LABELS = ["Start", "Profile", "Work library", "Job description", "Generating", "Preview"];

export function WizardNav({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <div className="border-b border-border/70 bg-background/60 px-4 py-3 sm:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        {/* Back button — invisible placeholder when on step 0 to keep layout stable */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={step === 0}
          className={`rounded-pill ${step === 0 ? "invisible" : ""}`}
          aria-label="Go back"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        {/* Step dots with labels */}
        <nav aria-label="Wizard progress" className="flex items-center gap-1 sm:gap-2">
          {STEP_LABELS.map((label, index) => {
            const isDone    = index < step;
            const isCurrent = index === step;
            return (
              <div key={label} className="flex items-center gap-1 sm:gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isDone    ? "bg-primary/20 text-primary"
                  : isCurrent ? "bg-primary text-primary-foreground"
                  :             "bg-muted text-muted-foreground"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`${label}${isDone ? " — completed" : isCurrent ? " — current" : ""}`}
                >
                  {isDone ? "✓" : index + 1}
                </div>
                <span className={`hidden text-xs font-medium sm:block ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
                {index < STEP_LABELS.length - 1 && (
                  <div className={`h-px w-4 sm:w-6 ${index < step ? "bg-primary/40" : "bg-border"}`} aria-hidden="true" />
                )}
              </div>
            );
          })}
        </nav>

        <span className="min-w-[4rem] text-right text-xs text-muted-foreground">
          {step + 1} / {STEP_LABELS.length}
        </span>
      </div>
    </div>
  );
}
