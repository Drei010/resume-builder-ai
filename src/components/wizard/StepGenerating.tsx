import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/lib/api-config";
import type { Company, WorkEntry } from "@/lib/work-db";
import type { Profile } from "@/lib/profile-store";
import { AiLoader } from "@/components/AiLoader";

const MESSAGES = [
  "Reading your work history…",
  "Matching to the job…",
  "Polishing the language…",
  "Almost there…",
];

export function StepGenerating({
  profile,
  companies,
  entries,
  jobDescription,
  onDone,
}: {
  profile: Profile;
  companies: Company[];
  entries: WorkEntry[];
  jobDescription: string;
  onDone: (resume: string) => void;
}) {
  const [progress, setProgress] = useState(8);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Animate to 85% while the request is in flight
    const slowTimer = setTimeout(() => setProgress(85), 3000);
    const messageCycle = setInterval(() => setMessageIndex((i) => (i + 1) % MESSAGES.length), 1400);

    (async () => {
      const payload = entries
        .map((e) => {
          const c = companies.find((x) => x.id === e.companyId);
          return {
            id: e.id, companyId: e.companyId,
            companyName: c?.name ?? "", jobTitle: c?.jobTitle ?? "",
            location: c?.location ?? "", startMonth: e.startMonth,
            endMonth: e.endMonth, task: e.task.slice(0, 2000),
          };
        })
        .filter((e) => e.companyName && e.task);

      try {
        const res = await fetch(API_ENDPOINTS.tailorResume, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobDescription: jobDescription.slice(0, 12_000),
            entries: payload,
            profile: { fullName: profile.fullName, email: profile.email, phone: profile.phone, linkedin: profile.linkedin, github: profile.github, location: profile.location },
          }),
        });
        const data = await res.json().catch(() => ({ resume: "" }));
        setProgress(100);
        // brief pause so the user sees 100%
        setTimeout(() => onDone(data.resume ?? ""), 400);
      } catch {
        setProgress(100);
        setTimeout(() => onDone(""), 400);
      }
    })();

    return () => { clearTimeout(slowTimer); clearInterval(messageCycle); };
  }, [companies, entries, jobDescription, onDone, profile]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Progress bar */}
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Generating your resume</h1>
          <AiLoader message={MESSAGES[messageIndex]} />
        </div>

        {/* Animated dots */}
        <div className="flex justify-center gap-2" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-primary/60"
              style={{ animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
