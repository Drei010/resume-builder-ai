export type SavedJD = { id: string; label: string; text: string; createdAt: string };
const KEY = "savedJDs";
export function loadSavedJDs(): SavedJD[] { try { const value = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } }
export function saveSavedJDs(items: SavedJD[]): void { try { localStorage.setItem(KEY, JSON.stringify(items.slice(-20))); } catch { /* unavailable storage */ } }
export function addSavedJD(text: string, label = "Saved job description"): SavedJD[] { const next = [...loadSavedJDs(), { id: crypto.randomUUID(), label, text, createdAt: new Date().toISOString() }]; saveSavedJDs(next); return next.slice(-20); }
