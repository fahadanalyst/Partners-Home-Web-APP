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
    
    // Improved chunking: only break if the element has 'page-break' AND it's not the first element in the chunk
    // or if the chunk is getting too large (though we don't know the height yet)
    contentElements.forEach((el, index) => {
      if (el.classList.contains('page-break') && chunks[currentChunkIndex].length > 0) {
        chunks.push([el as HTMLElement]);
        currentChunkIndex++;
      } else {
        chunks[currentChunkIndex].push(el as HTMLElement);
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
          // 1. Add a global style override to the cloned document to force hex colors
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              color-scheme: light !important;
            }
            .bg-partners-blue-dark { background-color: #005696 !important; }
            .text-partners-blue-dark { color: #005696 !important; }
            .bg-partners-green { background-color: #00A651 !important; }
            .text-partners-green { color: #00A651 !important; }
            .border-partners-blue-dark { border-color: #005696 !important; }
            .border-partners-blue-dark\\/20 { border-color: rgba(0, 86, 150, 0.2) !important; }
            .bg-zinc-50 { background-color: #fafafa !important; }
            .bg-zinc-100 { background-color: #f4f4f5 !important; }
            .bg-zinc-200 { background-color: #e4e4e7 !important; }
            .border-zinc-100 { border-color: #f4f4f5 !important; }
            .border-zinc-200 { border-color: #e4e4e7 !important; }
            .border-zinc-300 { border-color: #d4d4d8 !important; }
            .text-zinc-400 { color: #a1a1aa !important; }
            .text-zinc-500 { color: #71717a !important; }
            .text-zinc-600 { color: #52525b !important; }
            .text-zinc-700 { color: #3f3f46 !important; }
            .text-zinc-800 { color: #27272a !important; }
            .text-zinc-900 { color: #18181b !important; }
          `;
          clonedDoc.head.appendChild(style);

          // 2. Aggressively remove any oklab/oklch from all style tags in the cloned document
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let s = 0; s < styleTags.length; s++) {
            const tag = styleTags[s];
            if (tag.innerHTML.includes('oklch') || tag.innerHTML.includes('oklab')) {
              // Replace oklch/oklab with a safe color or just remove the rule
              // This is a bit brute force but effective for html2canvas
              tag.innerHTML = tag.innerHTML.replace(/oklch\([^)]+\)/g, '#000000');
              tag.innerHTML = tag.innerHTML.replace(/oklab\([^)]+\)/g, '#000000');
            }
          }

          // 3. Last ditch effort to remove oklab/oklch in the cloned document elements
          const clonedElements = clonedDoc.getElementsByTagName('*');
          for (let k = 0; k < clonedElements.length; k++) {
            const cel = clonedElements[k] as HTMLElement;
            const cstyle = clonedDoc.defaultView?.getComputedStyle(cel);
            
            if (cstyle) {
              const props = ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke'];
              props.forEach(prop => {
                const val = (cstyle as any)[prop];
                if (val && (val.includes('oklab') || val.includes('oklch'))) {
                  if (cel.classList.contains('bg-partners-blue-dark')) cel.style.backgroundColor = '#005696';
                  else if (cel.classList.contains('text-partners-blue-dark')) cel.style.color = '#005696';
                  else if (cel.classList.contains('bg-partners-green')) cel.style.backgroundColor = '#00A651';
                  else if (cel.classList.contains('text-partners-green')) cel.style.color = '#00A651';
                  else if (cel.classList.contains('bg-zinc-50')) cel.style.backgroundColor = '#fafafa';
                  else if (cel.classList.contains('bg-zinc-100')) cel.style.backgroundColor = '#f4f4f5';
                  else if (cel.classList.contains('bg-zinc-200')) cel.style.backgroundColor = '#e4e4e7';
                  else if (cel.classList.contains('text-zinc-400')) cel.style.color = '#a1a1aa';
                  else if (cel.classList.contains('text-zinc-500')) cel.style.color = '#71717a';
                  else if (cel.classList.contains('text-zinc-600')) cel.style.color = '#52525b';
                  else if (cel.classList.contains('text-zinc-700')) cel.style.color = '#3f3f46';
                  else if (cel.classList.contains('text-zinc-800')) cel.style.color = '#27272a';
                  else if (cel.classList.contains('text-zinc-900')) cel.style.color = '#18181b';
                  else {
                    if (prop === 'backgroundColor') cel.style.backgroundColor = '#ffffff';
                    else if (prop === 'color') cel.style.color = '#000000';
                    else if (prop === 'borderColor') cel.style.borderColor = '#dddddd';
                    else if (prop === 'fill') cel.style.fill = '#000000';
                    else if (prop === 'stroke') cel.style.stroke = '#000000';
                  }
                }
              });
            }
          }
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
