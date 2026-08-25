/* ============================================================
   parse.js
   Client-side text extraction for .txt, .pdf, and .docx files.
   Nothing here ever leaves the browser except the extracted text,
   which the app later sends to the Anthropic API.
   ============================================================ */

// point pdf.js at its worker (loaded from the same CDN version)
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

/**
 * Extract plain text from a File object based on its extension.
 * Returns a Promise<string>.
 */
async function extractTextFromFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return await file.text();
  }

  if (name.endsWith(".pdf")) {
    return await extractPdfText(file);
  }

  if (name.endsWith(".docx")) {
    return await extractDocxText(file);
  }

  throw new Error(`Unsupported file type: ${file.name}. Use .txt, .pdf, or .docx.`);
}

async function extractPdfText(file) {
  if (!window.pdfjsLib) throw new Error("PDF reader failed to load. Check your internet connection and reload the page.");
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    text += pageText + "\n\n";
  }
  return text.trim();
}

async function extractDocxText(file) {
  if (!window.mammoth) throw new Error("DOCX reader failed to load. Check your internet connection and reload the page.");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value.trim();
}

/** Derive a readable default candidate ID from a filename. */
function idFromFilename(filename) {
  return filename
    .replace(/\.(pdf|docx|txt|md)$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}
