export type SavedResume = { id: string; title: string; text: string; createdAt: string };
const KEY = "savedResumes";
export function loadSavedResumes(): SavedResume[] { try { const value = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } }
export function saveSavedResumes(items: SavedResume[]): void { try { localStorage.setItem(KEY, JSON.stringify(items.slice(-20))); } catch { /* unavailable storage */ } }
export function addSavedResume(text: string, title = "Untitled resume"): SavedResume[] { const items = [...loadSavedResumes(), { id: crypto.randomUUID(), title, text, createdAt: new Date().toISOString() }].slice(-20); saveSavedResumes(items); return items; }
