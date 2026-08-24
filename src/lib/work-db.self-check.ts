import assert from "node:assert/strict";
import {
  deriveDateRange,
  formatMonth,
  groupEntriesByCompany,
  type Company,
  type WorkEntry,
} from "./work-db";

const company: Company = {
  id: "company-1",
  name: "Acme",
  jobTitle: "Automation Developer",
};

const entry = (id: string, startMonth: string, endMonth: string | null): WorkEntry => ({
  id,
  companyId: company.id,
  startMonth,
  endMonth,
  task: id,
});

assert.equal(formatMonth("2024-10"), "October 2024");
assert.equal(deriveDateRange([entry("one", "2024-10", "2024-10")]), "October 2024");
assert.equal(
  deriveDateRange([
    entry("later", "2025-02", "2025-03"),
    entry("earlier", "2024-06", "2024-08"),
  ]),
  "June 2024 – March 2025"
);
assert.equal(
  deriveDateRange([
    entry("fixed", "2025-06", "2025-12"),
    entry("ongoing", "2024-10", null),
  ]),
  "October 2024 – Present"
);

const groups = groupEntriesByCompany(
  [company, { id: "company-2", name: "Empty Co", jobTitle: "Intern" }],
  [entry("later", "2025-02", "2025-03"), entry("earlier", "2024-06", "2024-08")]
);
assert.equal(groups[0].id, company.id);
assert.equal(groups[0].dateRange, "June 2024 – March 2025");
assert.deepEqual(
  groups[0].entries.map(({ id }) => id),
  ["later", "earlier"],
  "entries should be newest first regardless of insertion order"
);
assert.equal(groups[1].entries.length, 0);
assert.equal(groups[1].dateRange, "");

console.log("work-db self-check passed");
