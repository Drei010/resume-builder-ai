import { useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { WizardNav } from "@/components/wizard/WizardNav";
import { WizardProgressBar } from "@/components/wizard/WizardProgressBar";
import { StepStart } from "@/components/wizard/StepStart";
import { StepProfile } from "@/components/wizard/StepProfile";
import { StepWorkLibrary } from "@/components/wizard/StepWorkLibrary";
import { StepJobDescription } from "@/components/wizard/StepJobDescription";
import { StepGenerating } from "@/components/wizard/StepGenerating";
import { StepPreview } from "@/components/wizard/StepPreview";
import { defaultProfile, loadProfile, saveProfile, type Profile } from "@/lib/profile-store";
import { addSavedJD, loadSavedJDs, type SavedJD } from "@/lib/saved-jd-store";
import { loadCompanies, loadEntries, saveCompanies, saveEntries, type Company, type WorkEntry } from "@/lib/work-db";

export default function Create() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [companies, setCompanies] = useState<Company[]>(loadCompanies);
  const [entries, setEntries] = useState<WorkEntry[]>(loadEntries);
  const [jobDescription, setJobDescription] = useState("");
  const [saved, setSaved] = useState<SavedJD[]>(loadSavedJDs);
  const [resume, setResume] = useState("");

  const next = () => {
    saveProfile(profile);
    setStep((s) => Math.min(5, s + 1));
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const updateCompanies = (next: Company[]) => { setCompanies(next); saveCompanies(next); };
  const updateEntries   = (next: WorkEntry[]) => { setEntries(next); saveEntries(next); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader
        right={
          <Link
            to="/"
            className="rounded-pill px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            ← Back
          </Link>
        }
      />

      <WizardProgressBar step={step} />
      <WizardNav step={step} onBack={back} />

      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        {step === 0 && (
          <StepStart
            onNext={next}
            onParsed={(p, c, e) => {
              setProfile({ ...defaultProfile, ...p });
              updateCompanies(c);
              updateEntries(e);
            }}
          />
        )}
        {step === 1 && (
          <StepProfile
            profile={profile}
            onChange={setProfile}
            onNext={next}
            onSkip={next}
          />
        )}
        {step === 2 && (
          <StepWorkLibrary
            companies={companies}
            entries={entries}
            setCompanies={updateCompanies}
            setEntries={updateEntries}
            onNext={next}
          />
        )}
        {step === 3 && (
          <StepJobDescription
            value={jobDescription}
            onChange={setJobDescription}
            saved={saved}
            onSave={() => setSaved(addSavedJD(jobDescription))}
            onNext={next}
          />
        )}
        {step === 4 && (
          <StepGenerating
            profile={profile}
            companies={companies}
            entries={entries}
            jobDescription={jobDescription}
            onDone={(r) => { setResume(r); setStep(5); }}
          />
        )}
        {step === 5 && (
          <StepPreview resume={resume} onChange={setResume} />
        )}
      </main>
    </div>
  );
}
