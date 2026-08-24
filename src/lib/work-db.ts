export type Company = {
  id: string;
  name: string;
  jobTitle: string;
  location?: string;
};

export type WorkEntry = {
  id: string;
  companyId: string;
  /** "YYYY-MM" as produced by <input type="month"> */
  startMonth: string;
  /** "YYYY-MM", or null when the task is ongoing ("Present") */
  endMonth: string | null;
  task: string;
};

export type CompanyGroup = Company & {
  entries: WorkEntry[];
  /** Derived from the min/max of this company's entry months, e.g. "October 2024 – Present" */
  dateRange: string;
};

const COMPANIES_KEY = "workdb.companies";
const ENTRIES_KEY = "workdb.entries";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "YYYY-MM" is lexicographically sortable, so plain string compare is a correct chronological compare. */
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidMonth(month: string): boolean {
  return MONTH_PATTERN.test(month);
}

export function formatMonth(month: string): string {
  if (!isValidMonth(month)) return month;
  const [year, monthNumber] = month.split("-");
  return `${MONTH_NAMES[Number(monthNumber) - 1]} ${year}`;
}

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    // Corrupt or unavailable storage (private mode, quota, hand-edited JSON):
    // start empty rather than crashing the page.
    return [];
  }
}

function writeArray<T>(key: string, value: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to persist ${key}:`, error);
  }
}

export const loadCompanies = (): Company[] => readArray<Company>(COMPANIES_KEY);
export const saveCompanies = (companies: Company[]): void =>
  writeArray(COMPANIES_KEY, companies);

export const loadEntries = (): WorkEntry[] => readArray<WorkEntry>(ENTRIES_KEY);
export const saveEntries = (entries: WorkEntry[]): void =>
  writeArray(ENTRIES_KEY, entries);

export const createCompany = (draft: Omit<Company, "id">): Company => ({
  ...draft,
  id: crypto.randomUUID(),
});

export const createEntry = (draft: Omit<WorkEntry, "id">): WorkEntry => ({
  ...draft,
  id: crypto.randomUUID(),
});

/**
 * Groups entries under their company and derives each company's date range from the
 * min start month and max end month of its own entries.
 *
 * ponytail: the range is derived from logged tasks, not real employment dates, because an
 * entry only carries month + company + task. A company you worked at longer than your logged
 * tasks span will read short. Upgrade path: add explicit start/end fields to Company.
 */
export function groupEntriesByCompany(
  companies: Company[],
  entries: WorkEntry[]
): CompanyGroup[] {
  const groups = companies.map((company) => {
    const companyEntries = entries
      .filter((entry) => entry.companyId === company.id)
      .sort((a, b) => b.startMonth.localeCompare(a.startMonth));

    return { ...company, entries: companyEntries, dateRange: deriveDateRange(companyEntries) };
  });

  // Most recent company first; companies with no entries sink to the bottom.
  return groups.sort((a, b) => {
    const aStart = earliestStart(a.entries);
    const bStart = earliestStart(b.entries);
    if (!aStart) return bStart ? 1 : 0;
    if (!bStart) return -1;
    return latestEndKey(b.entries).localeCompare(latestEndKey(a.entries));
  });
}

function earliestStart(entries: WorkEntry[]): string | null {
  return entries.reduce<string | null>(
    (min, entry) =>
      min === null || entry.startMonth.localeCompare(min) < 0 ? entry.startMonth : min,
    null
  );
}

/** Ongoing entries sort above every fixed month, so "\uffff" stands in for "Present". */
function latestEndKey(entries: WorkEntry[]): string {
  return entries.reduce((max, entry) => {
    const key = entry.endMonth ?? "\uffff";
    return key.localeCompare(max) > 0 ? key : max;
  }, "");
}

export function deriveDateRange(entries: WorkEntry[]): string {
  const start = earliestStart(entries);
  if (!start) return "";

  const hasOngoing = entries.some((entry) => entry.endMonth === null);
  if (hasOngoing) return `${formatMonth(start)} – Present`;

  const end = entries.reduce<string>(
    (max, entry) =>
      entry.endMonth && entry.endMonth.localeCompare(max) > 0 ? entry.endMonth : max,
    ""
  );

  if (!end || end === start) return formatMonth(start);
  return `${formatMonth(start)} – ${formatMonth(end)}`;
}
