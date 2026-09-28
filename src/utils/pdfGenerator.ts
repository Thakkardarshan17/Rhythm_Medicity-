import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ═══════════════════════════════════════════════════════════════
 *  MASTER A5 PDF & PRINT GENERATOR
 *
 *  NON-NEGOTIABLE RULE:
 *  PDF output = Web preview = Print output  (pixel-perfect)
 *
 *  Strategy:
 *  1. Clone the letter element into a fixed-pixel off-screen container
 *  2. Convert all mm dimensions to px at a controlled DPI
 *  3. Let html2canvas capture the pixel-perfect clone
 *  4. Place into A5 PDF at exact dimensions
 *
 *  A5 = 148mm × 210mm
 * ═══════════════════════════════════════════════════════════════ */

const A5_MM_W = 148;
const A5_MM_H = 210;

// Use 96 DPI conversion: 1mm = 3.7795px
// A5 at 96 DPI: 559.37px × 793.70px
// We round to clean integers for html2canvas stability
const A5_PX_W = 559;
const A5_PX_H = 794;

// Canvas capture scale (2 = good quality, 3 = print quality)
const CAPTURE_SCALE = 3;

// Master font
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`;
const FONT_STACK = "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

/**
 * Recursively converts all mm-based inline styles to px equivalents
 * at 96 DPI (1mm = 3.7795px).
 */
function convertMmToPxInline(el: HTMLElement): void {
  const style = el.style;
  const mmProps = [
    'width', 'minWidth', 'maxWidth',
    'height', 'minHeight', 'maxHeight',
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'top', 'left', 'right', 'bottom',
  ];

  for (const prop of mmProps) {
    const val = style.getPropertyValue(prop) || (style as any)[prop];
    if (val && typeof val === 'string' && val.includes('mm')) {
      // Handle compound values like "6mm 7mm 5mm 7mm"
      const converted = val.replace(/([\d.]+)mm/g, (_: string, num: string) => {
        return `${Math.round(parseFloat(num) * 3.7795)}px`;
      });
      (style as any)[prop] = converted;
    }
  }

  // Process all children
  const children = el.children;
  for (let i = 0; i < children.length; i++) {
    convertMmToPxInline(children[i] as HTMLElement);
  }
}

/**
 * Generates an A5 Portrait PDF from the master appointment letter element.
 *
 * Uses an off-screen clone with fixed pixel dimensions to guarantee
 * the captured image matches the web layout exactly.
 */
export const generateAppointmentPdf = async (
  elementId: string,
  appointmentNumber: string
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Appointment letter element not found. Please try again.');
  }

  // ── Step 1: Create off-screen container ──
  const offscreen = document.createElement('div');
  Object.assign(offscreen.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: `${A5_PX_W}px`,
    height: `${A5_PX_H}px`,
    overflow: 'hidden',
    zIndex: '-9999',
    opacity: '0',
    pointerEvents: 'none',
    background: '#ffffff',
  });
  document.body.appendChild(offscreen);

  // ── Step 2: Deep clone the letter element ──
  const clone = element.cloneNode(true) as HTMLElement;

  // Remove the ID to avoid conflicts (html2canvas doesn't need it)
  clone.removeAttribute('id');

  // ── Step 3: Force exact pixel dimensions on clone ──
  Object.assign(clone.style, {
    width: `${A5_PX_W}px`,
    minWidth: `${A5_PX_W}px`,
    maxWidth: `${A5_PX_W}px`,
    height: `${A5_PX_H}px`,
    minHeight: `${A5_PX_H}px`,
    maxHeight: `${A5_PX_H}px`,
    boxSizing: 'border-box',
    // Convert padding from mm to px: 6mm≈23px, 7mm≈26px, 5mm≈19px
    padding: '23px 26px 19px 26px',
    // Strip screen-only styles
    boxShadow: 'none',
    borderRadius: '0',
    margin: '0',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#ffffff',
    border: '1.5px solid #006655',
    fontFamily: FONT_STACK,
  });

  // ── Step 4: Convert any remaining mm units in children to px ──
  convertMmToPxInline(clone);

  // ── Step 5: Strip framer-motion artifacts from all children ──
  clone.querySelectorAll('*').forEach((child) => {
    const htmlChild = child as HTMLElement;
    const s = htmlChild.style;

    // Preserve watermark transform (translate(-50%, -50%))
    const isWatermark = htmlChild.getAttribute('aria-hidden') === 'true';

    if (!isWatermark) {
      // Remove framer-motion-injected transforms
      if (s.transform && !s.transform.includes('-50%')) {
        s.transform = 'none';
      }
    }

    // Fix watermark dimensions from mm to px
    if (isWatermark) {
      // 58mm ≈ 219px
      if (s.width?.includes('mm')) {
        const mmVal = parseFloat(s.width);
        const pxVal = Math.round(mmVal * 3.7795);
        s.width = `${pxVal}px`;
        s.height = `${pxVal}px`;
      }
    }
  });

  // ── Step 6: Insert clone into off-screen container ──
  offscreen.appendChild(clone);

  // ── Step 7: Wait for images and fonts to load ──
  await new Promise<void>((resolve) => {
    // Wait for all images in the clone to load
    const images = clone.querySelectorAll('img');
    let loaded = 0;
    const total = images.length;

    if (total === 0) {
      setTimeout(resolve, 100);
      return;
    }

    const checkDone = () => {
      loaded++;
      if (loaded >= total) {
        setTimeout(resolve, 100); // small extra delay for paint
      }
    };

    images.forEach((img) => {
      if (img.complete) {
        checkDone();
      } else {
        img.onload = checkDone;
        img.onerror = checkDone;
      }
    });

    // Safety timeout — don't wait forever
    setTimeout(resolve, 3000);
  });

  // ── Step 8: Capture with html2canvas ──
  const canvas = await html2canvas(clone, {
    scale: CAPTURE_SCALE,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    width: A5_PX_W,
    height: A5_PX_H,
  });

  // ── Step 9: Clean up off-screen container ──
  document.body.removeChild(offscreen);

  // ── Step 10: Generate PDF ──
  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [A5_MM_W, A5_MM_H],
    compress: true,
  });

  // Fill the entire A5 page with the captured image
  pdf.addImage(imgData, 'JPEG', 0, 0, A5_MM_W, A5_MM_H, undefined, 'FAST');
  pdf.save(`Rhythm-Medicity-Appointment-${appointmentNumber}.pdf`);
};

/**
 * Opens the browser print dialog with the appointment letter
 * isolated in a hidden iframe. Same HTML as web — no redesign.
 */
export const printAppointmentLetter = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  // Remove any previous print iframe
  const existing = document.getElementById('print-iframe-appointment');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'print-iframe-appointment';
  Object.assign(iframe.style, {
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
    width: `${A5_PX_W}px`,
    height: `${A5_PX_H}px`,
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Clone and strip screen styles
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  clone.style.margin = '0';

  const html = clone.outerHTML;

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Rhythm Medicity - Appointment Letter</title>
  <style>
    ${FONT_IMPORT}

    @page {
      size: 148mm 210mm;
      margin: 0;
    }

    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    html, body {
      width: 148mm;
      height: 210mm;
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: ${FONT_STACK};
      overflow: hidden;
    }

    body {
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }

    /* Force the master template to exact A5 for print */
    [data-master-template="true"] {
      width: 148mm !important;
      min-width: 148mm !important;
      max-width: 148mm !important;
      height: 210mm !important;
      min-height: 210mm !important;
      max-height: 210mm !important;
      margin: 0 !important;
      padding: 6mm 7mm 5mm 7mm !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      overflow: hidden !important;
      position: relative !important;
      display: flex !important;
      flex-direction: column !important;
      background: #ffffff !important;
      border: 1.5px solid #006655 !important;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`);
  doc.close();

  // Wait for fonts and images, then print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
    setTimeout(() => iframe.remove(), 5000);
  }, 800);
};
