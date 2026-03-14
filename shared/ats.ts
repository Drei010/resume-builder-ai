import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const AtsWorkExperienceSchema = z
  .object({
    company: z.string(),
    title: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    current: z.boolean(),
    description: z.string(),
  })
  .strict();

const AtsSchema = z
  .object({
    candidate_id: z.string(),
    personal_info: z
      .object({
        full_name: z.string(),
        email: z.string(),
        phone: z.string(),
        location: z
          .object({
            city: z.string(),
            country: z.string(),
            remote_willing: z.boolean(),
          })
          .strict(),
        linkedin_url: z.string(),
      })
      .strict(),
    application: z
      .object({
        job_id: z.string(),
        job_title: z.string(),
        department: z.string(),
        applied_date: z.string(),
        source: z.string(),
        status: z.string(),
      })
      .strict(),
    resume_summary: z
      .object({
        headline: z.string(),
        years_of_experience: z.number().int(),
        highest_education: z
          .object({
            degree: z.string(),
            field: z.string(),
            institution: z.string(),
            year: z.number().int(),
          })
          .strict(),
        skills: z
          .object({
            technical: z.array(z.string()),
            soft: z.array(z.string()),
          })
          .strict(),
        certifications: z.array(z.string()),
        work_experience: z.array(AtsWorkExperienceSchema),
      })
      .strict(),
    scoring: z
      .object({
        overall_match_score: z.number().int(),
        keyword_match_score: z.number().int(),
        experience_match_score: z.number().int(),
        education_match_score: z.number().int(),
        matched_keywords: z.array(z.string()),
        missing_keywords: z.array(z.string()),
      })
      .strict(),
    metadata: z
      .object({
        created_at: z.string(),
        updated_at: z.string(),
        created_by: z.string(),
        tags: z.array(z.string()),
        gdpr_consent: z.boolean(),
      })
      .strict(),
  })
  .strict();

type ATSWorkExperience = z.infer<typeof AtsWorkExperienceSchema>;
type ATSCandidateSummary = z.infer<typeof AtsSchema>;

const ATS_JSON_SCHEMA = zodToJsonSchema(AtsSchema);

export {
  ATS_JSON_SCHEMA,
  AtsSchema,
  AtsWorkExperienceSchema,
  type ATSCandidateSummary,
  type ATSWorkExperience,
};
