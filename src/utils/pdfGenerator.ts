import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import React from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Advanced PDF Generator that uses React templates for high-fidelity output.
 */
export const generatePDFFromTemplate = async (
  Template: React.FC<any>,
  data: any,
  filename: string
) => {
  // 1. Create a hidden container for rendering the template
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm'; // A4 width
  document.body.appendChild(container);

  try {
    // 2. Render the React template into the container
    const root = createRoot(container);
    root.render(React.createElement(Template, { data }));

    // 3. Wait for rendering and images to load
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Ensure all images are loaded
    const images = Array.from(container.getElementsByTagName('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));

    // 3.5 Fix modern color functions (oklch, oklab) that html2canvas cannot parse
    // Add a global style to the main document temporarily to help with the capture
    const styleFix = document.createElement('style');
    styleFix.id = 'pdf-color-fix';
    styleFix.innerHTML = `
      * {
        color-scheme: light !important;
      }
      [class*="bg-partners"], [class*="text-partners"], [class*="bg-zinc"], [class*="text-zinc"], [class*="border-zinc"] {
        color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
      }
      /* Force hex fallbacks for common Tailwind 4 oklch/oklab colors */
      .bg-partners-blue-dark { background-color: #005696 !important; }
      .text-partners-blue-dark { color: #005696 !important; }
      .bg-partners-green { background-color: #00A651 !important; }
      .text-partners-green { color: #00A651 !important; }
      .text-zinc-900 { color: #18181b !important; }
      .text-zinc-500 { color: #71717a !important; }
      .border-zinc-200 { border-color: #e4e4e7 !important; }
    `;
    document.head.appendChild(styleFix);

    const allElements = container.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i] as HTMLElement;
      const style = window.getComputedStyle(el);
      
      // Properties that might contain colors
      const colorProps = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'outlineColor', 'fill', 'stroke'];
      
      colorProps.forEach(prop => {
        const value = style.getPropertyValue(prop);
        if (value.includes('oklch') || value.includes('oklab')) {
          // Force standard colors for common Tailwind 4 defaults
          if (prop === 'color') el.style.color = '#18181b'; // zinc-900
          else if (prop === 'backgroundColor') {
            if (el.classList.contains('bg-partners-blue-dark')) el.style.backgroundColor = '#003b5c';
            else if (el.classList.contains('bg-partners-green')) el.style.backgroundColor = '#00a651';
            else el.style.backgroundColor = '#ffffff';
          }
          else if (prop.includes('borderColor')) el.style.borderColor = '#e4e4e7'; // zinc-200
          else el.style.setProperty(prop, 'inherit', 'important');
        }
      });
    }

    // 4. Find all page-break elements and split content
    const contentElements = Array.from(container.querySelectorAll('.pdf-content > *'));
    const chunks: HTMLElement[][] = [[]];
    let currentChunkIndex = 0;
    
    // Improved chunking: break by top-level children of .pdf-content
    // If an element is too tall, we still have an issue, but this allows more granular pages
    contentElements.forEach((el, index) => {
      const elementHeight = (el as HTMLElement).offsetHeight;
      const estimatedPageHeightPx = 1100; // Rough estimate for A4 at 96dpi
      
      if (el.classList.contains('page-break') && chunks[currentChunkIndex].length > 0) {
        chunks.push([el as HTMLElement]);
        currentChunkIndex++;
      } else {
        // Simple heuristic: if adding this element makes the chunk too tall, start a new page
        // This is not perfect because of margins/padding but better than 1 page
        let currentChunkHeight = 0;
        chunks[currentChunkIndex].forEach(chunkEl => {
          currentChunkHeight += chunkEl.offsetHeight;
        });

        if (currentChunkHeight + elementHeight > estimatedPageHeightPx && chunks[currentChunkIndex].length > 0) {
          chunks.push([el as HTMLElement]);
          currentChunkIndex++;
        } else {
          chunks[currentChunkIndex].push(el as HTMLElement);
        }
      }
    });

    // 6. Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 15; // Increased margin for better layout
    const topMargin = 20;
    const bottomMargin = 20;

    // 6.5 Helper to add header/footer to a page
    const addDecorations = (pdf: jsPDF, pageNum: number, totalPages: number) => {
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(`Partners Home Nursing Services - ${filename.split('_')[0].replace(/_/g, ' ')}`, margin, pdfHeight - 10);
      pdf.text(`Page ${pageNum} of ${totalPages}`, pdfWidth - margin - 20, pdfHeight - 10);
    };

    // 7. Capture and add each chunk
    for (let i = 0; i < chunks.length; i++) {
      if (i > 0) pdf.addPage();

      // Create a temporary container for this chunk
      const chunkContainer = document.createElement('div');
      chunkContainer.className = 'pdf-template-container bg-white font-sans';
      chunkContainer.style.width = '190mm'; // Slightly less than A4 to allow for margins
      chunkContainer.style.padding = '10mm';
      chunkContainer.style.backgroundColor = '#ffffff';
      
      // Add the header only to the first page, or a simplified header to others
      if (i === 0) {
        const header = container.querySelector('.flex.justify-between.items-start')?.cloneNode(true);
        if (header) chunkContainer.appendChild(header);
      } else {
        // Simple header for subsequent pages
        const miniHeader = document.createElement('div');
        miniHeader.className = 'border-b-2 border-partners-blue-dark pb-2 mb-6 flex justify-between items-center';
        miniHeader.innerHTML = `
          <span class="text-[12px] font-bold text-partners-blue-dark uppercase tracking-wider">${filename.split('_')[0].replace(/_/g, ' ')}</span>
          <span class="text-[10px] text-zinc-400 font-bold">CONTINUED</span>
        `;
        chunkContainer.appendChild(miniHeader);
      }

      const contentDiv = document.createElement('div');
      contentDiv.className = 'pdf-content space-y-8'; // Increased spacing
      chunks[i].forEach(el => {
        const clone = el.cloneNode(true) as HTMLElement;
        // Ensure no oklab/oklch in clones either
        const subElements = clone.getElementsByTagName('*');
        for (let j = 0; j < subElements.length; j++) {
          const subEl = subElements[j] as HTMLElement;
          if (subEl.style.color?.includes('okl')) subEl.style.color = '#18181b';
          if (subEl.style.backgroundColor?.includes('okl')) subEl.style.backgroundColor = '#ffffff';
        }
        contentDiv.appendChild(clone);
      });
      chunkContainer.appendChild(contentDiv);

      // Add footer to every page
      const footer = container.querySelector('.mt-12.pt-6.border-t.border-zinc-200')?.cloneNode(true);
      if (footer) chunkContainer.appendChild(footer);

      document.body.appendChild(chunkContainer);
      chunkContainer.style.position = 'absolute';
      chunkContainer.style.left = '-9999px';

      const canvas = await html2canvas(chunkContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          // 1. Remove all external stylesheets to prevent oklab/oklch parsing errors
          const links = Array.from(clonedDoc.getElementsByTagName('link'));
          links.forEach(link => {
            if (link.rel === 'stylesheet') {
              link.remove();
            }
          });

          // 2. Remove ANY style tag that contains oklch or oklab
          // This is more effective than trying to replace them
          const styleTags = Array.from(clonedDoc.getElementsByTagName('style'));
          styleTags.forEach(tag => {
            const css = tag.innerHTML;
            if (css.includes('oklch') || css.includes('oklab')) {
              tag.remove();
            }
          });

          // 3. Add our own safe global style override
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              color-scheme: light !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif !important;
              box-sizing: border-box !important;
            }
            body {
              background-color: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .pdf-template-container {
              width: 210mm !important;
              padding: 10mm !important;
              background-color: #ffffff !important;
              color: #18181b !important;
              display: block !important;
              visibility: visible !important;
              position: relative !important;
              left: 0 !important;
              top: 0 !important;
            }
            .bg-partners-blue-dark { background-color: #005696 !important; }
            .text-partners-blue-dark { color: #005696 !important; }
            .bg-partners-green { background-color: #00A651 !important; }
            .text-partners-green { color: #00A651 !important; }
            .border-partners-blue-dark { border-color: #005696 !important; }
            .bg-zinc-50 { background-color: #fafafa !important; }
            .bg-zinc-100 { background-color: #f4f4f5 !important; }
            .bg-zinc-200 { background-color: #e4e4e7 !important; }
            .border-zinc-100 { border-color: #f4f4f5 !important; }
            .border-zinc-200 { border-color: #e4e4e7 !important; }
            .text-zinc-400 { color: #a1a1aa !important; }
            .text-zinc-500 { color: #71717a !important; }
            .text-zinc-600 { color: #52525b !important; }
            .text-zinc-700 { color: #3f3f46 !important; }
            .text-zinc-800 { color: #27272a !important; }
            .text-zinc-900 { color: #18181b !important; }
            
            /* Table layout fixes for MAR/TAR */
            table {
              table-layout: fixed !important;
              width: 100% !important;
              border-collapse: collapse !important;
              border-spacing: 0 !important;
              margin-bottom: 1rem !important;
            }
            th, td {
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              word-break: break-word !important;
              border: 1px solid #e4e4e7 !important;
              padding: 4px !important;
            }
            
            /* Grid and Flex fixes */
            .grid { display: block !important; } /* Fallback to block for better compatibility */
            .flex { display: flex !important; }
            .grid-cols-2 > *, .grid-cols-3 > *, .grid-cols-4 > * {
              display: inline-block !important;
              vertical-align: top !important;
              margin-bottom: 1rem !important;
            }
            .grid-cols-2 > * { width: 48% !important; margin-right: 2% !important; }
            .grid-cols-3 > * { width: 31% !important; margin-right: 2% !important; }
            .grid-cols-4 > * { width: 23% !important; margin-right: 2% !important; }
            
            /* Ensure images render */
            img {
              max-width: 100% !important;
              height: auto !important;
              display: block !important;
            }
          `;
          clonedDoc.head.appendChild(style);

          // 4. Final pass on elements to remove oklab/oklch from inline styles
          const clonedElements = Array.from(clonedDoc.getElementsByTagName('*'));
          clonedElements.forEach(el => {
            const cel = el as HTMLElement;
            if (cel.style) {
              const props = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'fill', 'stroke'];
              props.forEach(prop => {
                const val = (cel.style as any)[prop];
                if (val && (val.includes('oklch') || val.includes('oklab'))) {
                  (cel.style as any)[prop] = ''; // Clear it
                }
              });
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = imgProps.width / imgProps.height;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = contentWidth / ratio;

      // Add the chunk to the page
      pdf.addImage(imgData, 'PNG', margin, topMargin, contentWidth, contentHeight);
      
      document.body.removeChild(chunkContainer);
    }
    
    // Add page numbers
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addDecorations(pdf, i, totalPages);
    }
    
    pdf.save(filename);
    
    // Cleanup
    const cleanupStyleFix = document.getElementById('pdf-color-fix');
    if (cleanupStyleFix) cleanupStyleFix.remove();
    root.unmount();
    document.body.removeChild(container);
    return true;
  } catch (error) {
    console.error('Template PDF Generation Error:', error);
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    throw error;
  }
};
