import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { useTranslation } from "react-i18next";
import { ResumeBuilderSection } from "@/components/ResumeBuilderSection";

const ResumeFromStory = () => {
  const { t } = useTranslation();
  const items = t("landing.closerItems", { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader
        center={<Link to="/" className="rounded-pill px-3 py-2 hover:bg-secondary hover:text-foreground">Home</Link>}
        right={<Button asChild className="hidden rounded-pill sm:inline-flex"><Link to="/create">Create</Link></Button>}
      />
      <main>
        <section className="mx-auto max-w-content px-4 pb-16 pt-24 sm:px-6 sm:pb-24 sm:pt-36">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-primary">Resume from Your Story</p>
          <h1 className="max-w-3xl text-section">Resume from Your Story</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">Generate a polished, ATS-friendly resume from your unstructured job details.</p>
          <div className="mt-14 divide-y divide-border border-y border-border">
            {items.map((title, index) => (
              <div key={title} className="grid gap-4 py-8 sm:grid-cols-[80px_1fr] sm:py-10">
                <span className="text-sm font-semibold tabular-nums text-primary">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                  <p className="mt-2 max-w-xl text-muted-foreground">{t(`landing.closerDescriptions.${index}`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-secondary/70 px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-content">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-primary">{t("landing.toolEyebrow")}</p>
            <h2 className="text-section">{t("landing.toolTitle")}</h2>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">Turn your experience into a polished, personal resume with a focused workflow built around your story.</p>
            <ResumeBuilderSection />
          </div>
        </section>
      </main>
    </div>
  );
};

export default ResumeFromStory;
