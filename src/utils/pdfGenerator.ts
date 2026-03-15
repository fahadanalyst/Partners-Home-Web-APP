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
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 4. Find all page-break elements and split content
    const contentElements = Array.from(container.querySelectorAll('.pdf-content > *'));
    const chunks: HTMLElement[][] = [[]];
    let currentChunkIndex = 0;

    contentElements.forEach((el) => {
      if (el.classList.contains('page-break')) {
        chunks.push([el as HTMLElement]);
        currentChunkIndex++;
      } else {
        chunks[currentChunkIndex].push(el as HTMLElement);
      }
    });

    // 5. Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // Standard margin for all pages

    // 6. Capture and add each chunk
    for (let i = 0; i < chunks.length; i++) {
      if (i > 0) pdf.addPage();

      // Create a temporary container for this chunk
      const chunkContainer = document.createElement('div');
      chunkContainer.className = 'pdf-template-container bg-white p-10 font-sans';
      chunkContainer.style.width = '210mm';
      chunkContainer.style.backgroundColor = '#ffffff';
      
      // Add the header only to the first page, or a simplified header to others
      if (i === 0) {
        const header = container.querySelector('.flex.justify-between.items-start')?.cloneNode(true);
        if (header) chunkContainer.appendChild(header);
      } else {
        // Simple header for subsequent pages
        const miniHeader = document.createElement('div');
        miniHeader.className = 'border-b border-zinc-200 pb-2 mb-4 flex justify-between items-center';
        miniHeader.innerHTML = `
          <span class="text-[10px] font-bold text-partners-blue-dark uppercase tracking-wider">${filename.split('_')[0].replace(/_/g, ' ')}</span>
          <span class="text-[10px] text-zinc-400">Page ${i + 1}</span>
        `;
        chunkContainer.appendChild(miniHeader);
      }

      const contentDiv = document.createElement('div');
      contentDiv.className = 'pdf-content space-y-6';
      chunks[i].forEach(el => contentDiv.appendChild(el.cloneNode(true)));
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
        windowWidth: 1200
      });

      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = imgProps.width / imgProps.height;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = contentWidth / ratio;

      let chunkHeightLeft = contentHeight;
      let chunkPosition = 0;

      // Add the first part of the chunk
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
      chunkHeightLeft -= (pdfHeight - (margin * 2));

      // If the chunk is longer than one page, add more pages
      while (chunkHeightLeft > 2) {
        pdf.addPage();
        chunkPosition = chunkHeightLeft - contentHeight + margin;
        pdf.addImage(imgData, 'PNG', margin, chunkPosition, contentWidth, contentHeight);
        chunkHeightLeft -= (pdfHeight - (margin * 2));
      }
      
      document.body.removeChild(chunkContainer);
    }
    
    pdf.save(filename);
    
    // Cleanup
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
