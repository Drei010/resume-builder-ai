export type Profile = {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  location: string;
  education: string;
  skills: string;
  certifications: string;
};

export const defaultProfile: Profile = { fullName: "", email: "", phone: "", linkedin: "", github: "", location: "", education: "", skills: "", certifications: "" };
const KEY = "profile";
export function loadProfile(): Profile {
  try { const value = JSON.parse(localStorage.getItem(KEY) || "null"); return { ...defaultProfile, ...(value && typeof value === "object" ? value : {}) }; } catch { return { ...defaultProfile }; }
}
export function saveProfile(profile: Profile): void { try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch { /* unavailable storage */ } }
