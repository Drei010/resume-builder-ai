import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SavedJD } from "@/lib/saved-jd-store";

export function StepJobDescription({
  value,
  onChange,
  saved,
  onSave,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  saved: SavedJD[];
  onSave: () => void;
  onNext: () => void;
}) {
  const [shouldSave, setShouldSave] = useState(false);

  const handleNext = () => {
    if (shouldSave && value.trim()) onSave();
    onNext();
  };

  return (
    <div className="space-y-10">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">What role are you targeting?</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Paste the job description. The AI will match only the most relevant accomplishments from your work library.
        </p>
      </div>

      {saved.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">Saved descriptions</p>
          <div className="flex flex-wrap gap-2">
            {saved.map((j) => (
              <button
                key={j.id}
                type="button"
                onClick={() => onChange(j.text)}
                className="rounded-pill border border-border px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary"
              >
                {j.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Label htmlFor="jd-textarea" className="text-base font-medium">Job description</Label>
        <Textarea
          id="jd-textarea"
          data-testid="jd-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste the full job description here…"
          className="min-h-72 resize-none rounded-2xl bg-background text-base"
        />
      </div>

      <div className="flex flex-col gap-5">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={shouldSave}
            onChange={(e) => setShouldSave(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          Save this job description for later
        </label>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleNext}
            disabled={!value.trim()}
            className="rounded-pill px-7"
            data-testid="step-continue"
          >
            Generate my resume ↗
          </Button>
        </div>
      </div>
    </div>
  );
}
