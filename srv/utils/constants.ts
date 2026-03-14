const ATS_JSON_RULES = `Return ONLY valid JSON.
Do not include explanations, comments, or markdown.
All required fields must exist, even if values are empty.
Arrays must always be arrays ([]) even if empty.
Boolean fields must be true or false.
Dates must use ISO format (YYYY-MM-DD or ISO timestamp).
Scores must be integers between 0 and 100.
Do not rename fields or modify the schema structure.`;

const ATS_OUTPUT_TEMPLATE = `{
  "candidate_id": "",
  "personal_info": {
    "full_name": "",
    "email": "",
    "phone": "",
    "location": {
      "city": "",
      "country": "",
      "remote_willing": false
    },
    "linkedin_url": ""
  },
  "application": {
    "job_id": "",
    "job_title": "",
    "department": "",
    "applied_date": "YYYY-MM-DD",
    "source": "",
    "status": ""
  },
  "resume_summary": {
    "headline": "",
    "years_of_experience": 0,
    "highest_education": {
      "degree": "",
      "field": "",
      "institution": "",
      "year": 0
    },
    "skills": {
      "technical": [],
      "soft": []
    },
    "certifications": [],
    "work_experience": [
      {
        "company": "",
        "title": "",
        "start_date": "YYYY-MM-DD",
        "end_date": "YYYY-MM-DD",
        "current": false,
        "description": ""
      }
    ]
  },
  "scoring": {
    "overall_match_score": 0,
    "keyword_match_score": 0,
    "experience_match_score": 0,
    "education_match_score": 0,
    "matched_keywords": [],
    "missing_keywords": []
  },
  "metadata": {
    "created_at": "ISO_TIMESTAMP",
    "updated_at": "ISO_TIMESTAMP",
    "created_by": "",
    "tags": [],
    "gdpr_consent": false
  }
}`;

const SYSTEM_PROMPT = `You are an expert ATS resume summarizer.
Convert the user's resume information into the ATS Candidate Summary JSON.

${ATS_JSON_RULES}

If job data is unavailable, set all scoring values to 0 and keep matched/missing keywords empty.
Use only the provided resume data.

ATS Candidate Summary JSON template:
${ATS_OUTPUT_TEMPLATE}`;

const TAILOR_PROMPT = `You are an expert ATS resume summarizer.
You will be given:
1) A job posting summary (title, responsibilities, required skills, nice-to-haves, location constraints)
2) The candidate's existing resume

Your tasks:
- Extract the role requirements and the language used in the posting.
- Tailor the ATS candidate summary to align with the role.
- Emphasize only relevant skills and experience.
- Do NOT invent experience, employers, degrees, or certifications.
- Use the job data to calculate the scoring section and matched/missing keywords.

${ATS_JSON_RULES}

ATS Candidate Summary JSON template:
${ATS_OUTPUT_TEMPLATE}`;

const JOB_EXTRACTION_PROMPT = `You are an expert job description analyst.

Extract structured information from a LinkedIn job posting.
Return ONLY valid JSON with the following schema:
{
  "jobTitle": "string",
  "company": "string",
  "responsibilities": ["string"],
  "requiredSkills": ["string"],
  "preferredQualifications": ["string"]
}

Rules:
- Do not add any extra keys.
- Use empty strings or empty arrays if information is missing.
- Keep each array item short and specific.
- Output JSON only.`;

const RESUME_OPTIMIZATION_PROMPT = `You are an expert ATS resume optimizer.
You will receive:
1) A structured job description JSON
2) The candidate's resume text

${ATS_JSON_RULES}

Use the job description to calculate the scoring section.
Populate matched_keywords and missing_keywords based on job requirements.
Do NOT invent experience, employers, degrees, or certifications.

ATS Candidate Summary JSON template:
${ATS_OUTPUT_TEMPLATE}`;

export {
  ATS_JSON_RULES,
  ATS_OUTPUT_TEMPLATE,
  SYSTEM_PROMPT,
  TAILOR_PROMPT,
  JOB_EXTRACTION_PROMPT,
  RESUME_OPTIMIZATION_PROMPT,
};
