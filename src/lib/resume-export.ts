import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

export function downloadPDF(resume: string): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  const lines = doc.splitTextToSize(resume, maxWidth);
  let y = margin;
  const lineHeight = 7;

  lines.forEach((line: string) => {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });

  doc.save("resume.pdf");
}

export async function downloadDocx(resume: string): Promise<void> {
  const paragraphs = resume.split("\n").map((line) => new Paragraph(line));
  const doc = new Document({ sections: [{ children: paragraphs }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, "resume.docx");
}

export function downloadTxt(resume: string): void {
  saveAs(new Blob([resume], { type: "text/plain" }), "resume.txt");
}
