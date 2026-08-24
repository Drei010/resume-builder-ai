function escapeLatex(value: string): string { return value.replace(/[&%$#_{}~^\\]/g, (char) => ({ "&": "\\&", "%": "\\%", "$": "\\$", "#": "\\#", "_": "\\_", "{": "\\{", "}": "\\}", "~": "\\textasciitilde{}", "^": "\\textasciicircum{}", "\\": "\\textbackslash{}" }[char] || char)); }
export function resumeToLatex(text: string): string {
  const lines = text.split(/\r?\n/); const out = ["\\documentclass[10pt]{article}", "\\usepackage[margin=0.7in]{geometry}", "\\usepackage{enumitem}", "\\begin{document}"]; let inList = false;
  const close = () => { if (inList) { out.push("\\end{itemize}"); inList = false; } };
  for (const raw of lines) { const line = raw.trim(); if (!line) { close(); continue; } if (/^[A-Z][A-Z &]+$/.test(line)) { close(); out.push(`\\section*{${escapeLatex(line.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()))}}`); continue; } if (/^(?:[-•*]|\\item\s)/.test(line)) { if (!inList) { out.push("\\begin{itemize}[leftmargin=*]"); inList = true; } out.push(`\\item ${escapeLatex(line.replace(/^(?:[-•*]|\\item\s)+/, ""))}`); } else { close(); out.push(escapeLatex(line) + "\\\\"); } } close(); out.push("\\end{document}"); return out.join("\n");
}
