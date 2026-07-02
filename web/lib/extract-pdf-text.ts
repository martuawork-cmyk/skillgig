// Client-side PDF → text extraction for the CV Review tool.
// -----------------------------------------------------------------------------
// Loads Mozilla's pdf.js from a CDN on first use (NO npm install / bundle
// dependency) and pulls the text layer out of the uploaded file entirely in the
// browser — the raw PDF never leaves the user's device; only the extracted text
// is later sent to the review API. If the CDN is blocked or the PDF is a scan
// with no text layer, the caller falls back to the paste-text box.

const PDFJS_VERSION = '3.11.174'; // last UMD build (exposes window.pdfjsLib)
const PDFJS_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

/** Max pages we read — a CV is rarely longer, and it caps work on big files. */
const MAX_PAGES = 10;

// Minimal shape of the parts of pdf.js we touch (avoids depending on its types).
type PdfTextItem = { str?: string };
type PdfPage = { getTextContent: () => Promise<{ items: PdfTextItem[] }> };
type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPage> };
type PdfJsLib = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: { data: ArrayBuffer }) => { promise: Promise<PdfDoc> };
};

let libPromise: Promise<PdfJsLib> | null = null;

function loadPdfJs(): Promise<PdfJsLib> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('PDF hanya bisa diproses di browser.'));
  }
  const existing = (window as unknown as { pdfjsLib?: PdfJsLib }).pdfjsLib;
  if (existing) return Promise.resolve(existing);
  if (libPromise) return libPromise;

  libPromise = new Promise<PdfJsLib>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PDFJS_SRC;
    script.async = true;
    script.onload = () => {
      const lib = (window as unknown as { pdfjsLib?: PdfJsLib }).pdfjsLib;
      if (!lib) {
        reject(new Error('Gagal memuat pembaca PDF.'));
        return;
      }
      lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      resolve(lib);
    };
    script.onerror = () => reject(new Error('Gagal memuat pembaca PDF.'));
    document.head.appendChild(script);
  });
  return libPromise;
}

/**
 * Extract the text layer from a PDF File. Returns the concatenated text of the
 * first MAX_PAGES pages, collapsed to sane whitespace. Throws a user-friendly
 * Error on load failure or when the PDF has no extractable text (e.g. a scan).
 */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;

  const pages: string[] = [];
  const count = Math.min(doc.numPages, MAX_PAGES);
  for (let i = 1; i <= count; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((it) => (typeof it.str === 'string' ? it.str : ''))
      .join(' ');
    pages.push(line);
  }

  const text = pages
    .join('\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (text.length < 40) {
    throw new Error(
      'Tidak menemukan teks di PDF ini (mungkin hasil scan/gambar). Tempel teks CV secara manual ya.',
    );
  }
  return text;
}
