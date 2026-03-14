import type { ReactNode } from "react";
import type { ATSCandidateSummary, ATSWorkExperience } from "@shared/ats";
import { cn } from "@/lib/utils";

type ResumeOutputProps = {
  resumeData: ATSCandidateSummary;
  className?: string;
};

const formatLocation = (city: string, country: string) => {
  const parts = [city, country].filter(Boolean);
  return parts.length ? parts.join(", ") : "";
};

const formatDateRange = (
  startDate: string,
  endDate: string,
  current: boolean
) => {
  if (!startDate && !endDate && !current) return "";
  const endLabel = current ? "Present" : endDate || "N/A";
  return `${startDate || "N/A"} - ${endLabel}`;
};

const splitDescription = (description: string) =>
  description
    .split(/\r?\n|\u2022|\u00b7|\u00e2\u20ac\u00a2|\u00c2\u00b7/g)
    .map((line) => line.trim())
    .filter(Boolean);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="space-y-3">
    <div className="flex items-center gap-3">
      <div className="h-1 w-10 bg-primary rounded-full" />
      <h2 className="text-lg font-semibold uppercase tracking-wide text-foreground">
        {title}
      </h2>
    </div>
    {children}
  </section>
);

const ExperienceItem = ({
  item,
}: {
  item: ATSWorkExperience;
}) => {
  const bullets = splitDescription(item.description);
  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="font-semibold text-foreground">{item.title || "Role"}</p>
          <p className="text-sm text-muted-foreground">
            {item.company || "Company"}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDateRange(item.start_date, item.end_date, item.current)}
        </span>
      </div>
      {bullets.length > 0 ? (
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          {bullets.map((bullet, index) => (
            <li key={`${item.company}-${index}`}>{bullet}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No description provided.
        </p>
      )}
    </div>
  );
};

const ResumeOutput = ({ resumeData, className }: ResumeOutputProps) => {
  const { personal_info, resume_summary } = resumeData;
  const location = formatLocation(
    personal_info.location?.city ?? "",
    personal_info.location?.country ?? ""
  );

  const contactItems = [
    personal_info.email && {
      label: "Email",
      value: personal_info.email,
      href: `mailto:${personal_info.email}`,
    },
    personal_info.phone && {
      label: "Phone",
      value: personal_info.phone,
      href: `tel:${personal_info.phone}`,
    },
    personal_info.linkedin_url && {
      label: "LinkedIn",
      value: personal_info.linkedin_url,
      href: personal_info.linkedin_url,
    },
    location && { label: "Location", value: location },
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    href?: string;
  }>;

  // Heuristic: entries containing "project" are surfaced in the Projects section.
  const projectEntries = resume_summary.work_experience.filter((item) =>
    /project/i.test(`${item.title} ${item.company} ${item.description}`)
  );
  const workEntries = resume_summary.work_experience.filter(
    (item) => !projectEntries.includes(item)
  );

  return (
    <div
      className={cn(
        "rounded-xl border bg-background p-6 shadow-sm text-foreground space-y-8",
        className
      )}
    >
      <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {personal_info.full_name || "Candidate Name"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {resume_summary.headline || "Professional Headline"}
          </p>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          {contactItems.length ? (
            contactItems.map((item) =>
              item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  className="block hover:text-foreground transition-smooth"
                >
                  {item.value}
                </a>
              ) : (
                <span key={item.label} className="block">
                  {item.value}
                </span>
              )
            )
          ) : (
            <span className="block">Contact details not provided.</span>
          )}
        </div>
      </header>

      <Section title="Work Experience">
        {workEntries.length ? (
          <div className="space-y-5">
            {workEntries.map((item, index) => (
              <ExperienceItem
                key={`${item.company}-${item.title}-${index}`}
                item={item}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No work experience available.
          </p>
        )}
      </Section>

      {projectEntries.length > 0 && (
        <Section title="Projects">
          <div className="space-y-5">
            {projectEntries.map((item, index) => (
              <ExperienceItem
                key={`project-${item.company}-${item.title}-${index}`}
                item={item}
              />
            ))}
          </div>
        </Section>
      )}

      <Section title="Skills & Abilities">
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground mb-2">Technical</h3>
            {resume_summary.skills.technical.length ? (
              <ul className="list-disc list-inside space-y-1">
                {resume_summary.skills.technical.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            ) : (
              <p>No technical skills listed.</p>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">Soft Skills</h3>
            {resume_summary.skills.soft.length ? (
              <ul className="list-disc list-inside space-y-1">
                {resume_summary.skills.soft.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            ) : (
              <p>No soft skills listed.</p>
            )}
          </div>
        </div>
      </Section>

      <Section title="Education">
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">
            {resume_summary.highest_education.degree || "Degree"}
          </p>
          <p>
            {resume_summary.highest_education.institution || "Institution"}
          </p>
          <p className="text-xs">
            {resume_summary.highest_education.field
              ? `${resume_summary.highest_education.field} \u00b7 `
              : ""}
            {resume_summary.highest_education.year || "Year"}
          </p>
        </div>
      </Section>
    </div>
  );
};

export { ResumeOutput };
