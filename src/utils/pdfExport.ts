import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Utility to export an HTML element to PDF with fixes for modern CSS features 
 * that html2canvas doesn't support (like oklch/oklab colors).
 */
export const exportToPDF = async (
  element: HTMLElement, 
  filename: string,
  options: { scale?: number; windowWidth?: number } = {}
) => {
  const { scale = 2, windowWidth = 1200 } = options;
  
  try {
    element.classList.add('pdf-mode');
    
    // Small delay to ensure styles are fully applied
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      windowWidth,
      logging: false,
      backgroundColor: '#ffffff',
      scrollY: -window.scrollY,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('.pdf-mode') as HTMLElement;
        if (clonedElement) {
          clonedElement.style.height = 'auto';
          clonedElement.style.overflow = 'visible';
        }

        // RECURSIVE FIXES:
        const allElements = clonedDoc.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i] as HTMLElement;
          const style = window.getComputedStyle(el);
          
          // 1. Fix modern color functions (oklch/oklab)
          const hasModernColor = (val: string) => val && (val.includes('oklch') || val.includes('oklab'));

          if (hasModernColor(style.backgroundColor)) el.style.backgroundColor = 'white';
          if (hasModernColor(style.color)) el.style.color = 'black';
          if (hasModernColor(style.borderColor)) el.style.borderColor = '#eeeeee';
          if (style.boxShadow && hasModernColor(style.boxShadow)) el.style.boxShadow = 'none';
          if (style.textShadow && hasModernColor(style.textShadow)) el.style.textShadow = 'none';

          // 2. Fix text fitting in inputs/textareas (the "text not fitting" issue)
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            const input = el as HTMLInputElement | HTMLTextAreaElement;
            const value = input.value || '';
            
            // Create a replacement div that looks like the input but contains real text
            const replacement = clonedDoc.createElement('div');
            
            // Copy relevant styles
            const styles = window.getComputedStyle(el);
            replacement.style.width = styles.width;
            replacement.style.height = styles.height;
            replacement.style.padding = styles.padding;
            replacement.style.margin = styles.margin;
            replacement.style.border = styles.border;
            replacement.style.borderRadius = styles.borderRadius;
            replacement.style.fontSize = styles.fontSize;
            replacement.style.fontFamily = styles.fontFamily;
            replacement.style.fontWeight = styles.fontWeight;
            replacement.style.color = styles.color;
            replacement.style.backgroundColor = styles.backgroundColor;
            replacement.style.display = 'flex';
            replacement.style.alignItems = 'center'; // Center vertically
            replacement.style.justifyContent = styles.textAlign === 'center' ? 'center' : 'flex-start';
            replacement.style.boxSizing = 'border-box';
            replacement.style.whiteSpace = el.tagName === 'TEXTAREA' ? 'pre-wrap' : 'nowrap';
            replacement.style.overflow = 'hidden';
            
            replacement.textContent = value;
            
            // Replace the input with the div in the cloned document
            if (el.parentNode) {
              el.parentNode.replaceChild(replacement, el);
            }
          }

          // 3. Fix SVG colors
          if (el instanceof SVGElement) {
            const svgEl = el as unknown as SVGElement;
            const svgStyle = window.getComputedStyle(svgEl);
            if (hasModernColor(svgStyle.fill)) svgEl.style.fill = 'currentColor';
            if (hasModernColor(svgStyle.stroke)) svgEl.style.stroke = 'currentColor';
          }
        }
      }
    });
    
    element.classList.remove('pdf-mode');
    
    const imgData = canvas.toDataURL('image/png');
    
    // PDF Generation with Centering and Scaling
    // We'll use A4 as the standard format
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate dimensions to fit width while maintaining aspect ratio
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = imgProps.width / imgProps.height;
    
    const margin = 10; // 10mm margin
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = contentWidth / ratio;
    
    // Handle multi-page if content is longer than one page
    let heightLeft = contentHeight;
    let position = 0;
    
    // Center horizontally
    const xOffset = margin;

    // Add first page
    pdf.addImage(imgData, 'PNG', xOffset, margin, contentWidth, contentHeight);
    heightLeft -= (pdfHeight - margin * 2);

    // Add subsequent pages if needed
    while (heightLeft > 0) {
      position = heightLeft - contentHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', xOffset, position, contentWidth, contentHeight);
      heightLeft -= pdfHeight;
    }
    
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    element.classList.remove('pdf-mode');
    throw error;
  }
};
