import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/lib/profile-store";

const TEXT_FIELDS: { key: keyof Profile; label: string }[] = [
  { key: "fullName",  label: "Full name" },
  { key: "email",     label: "Email" },
  { key: "phone",     label: "Phone" },
  { key: "location",  label: "Location" },
  { key: "linkedin",  label: "LinkedIn URL" },
  { key: "github",    label: "GitHub URL" },
];

const AREA_FIELDS: { key: keyof Profile; label: string; placeholder?: string }[] = [
  { key: "education",       label: "Education",            placeholder: "BS Computer Science, University of Santo Tomas, 2024" },
  { key: "skills",          label: "Skills & abilities",   placeholder: "JavaScript, TypeScript, React, Python…" },
  { key: "certifications",  label: "Certifications",       placeholder: "AWS Certified Cloud Practitioner, 2024" },
];

export function StepProfile({
  profile,
  onChange,
  onNext,
  onSkip,
}: {
  profile: Profile;
  onChange: (p: Profile) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const set = (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...profile, [key]: e.target.value });

  return (
    <div className="space-y-10">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your profile</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Add the details you want recruiters to see. This section is optional — you can skip it and fill it in later.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {TEXT_FIELDS.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`profile-${key}`}>{label}</Label>
            <Input
              id={`profile-${key}`}
              value={profile[key]}
              onChange={set(key)}
              autoComplete={key === "email" ? "email" : key === "phone" ? "tel" : "off"}
            />
          </div>
        ))}
      </div>

      <div className="grid gap-5">
        {AREA_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`profile-${key}`}>{label}</Label>
            <Textarea
              id={`profile-${key}`}
              value={profile[key]}
              onChange={set(key)}
              placeholder={placeholder}
              className="min-h-28 resize-none rounded-2xl bg-background"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onNext} className="rounded-pill px-7" data-testid="step-continue">
          Continue ↗
        </Button>
        <Button
          variant="ghost"
          onClick={onSkip}
          className="rounded-pill text-muted-foreground hover:text-foreground"
          data-testid="step-skip"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
