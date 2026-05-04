import { toJpeg } from 'html-to-image';

export async function generateExportData(
  elementId: string, 
  name: string, 
  type: 'pdf' | 'image'
): Promise<{ id?: string, url?: string }> {
  const el = document.getElementById(elementId);
  if (!el) throw new Error('Element not found');
  
  let parentContainer = el.parentElement;
  let oldOverflow = '';
  let oldHeight = '';
  if (parentContainer) {
    oldOverflow = parentContainer.style.overflow;
    oldHeight = parentContainer.style.height;
    parentContainer.style.overflow = 'visible';
    parentContainer.style.height = 'auto';
  }

  let oldElOverflow = el.style.overflow;
  let oldElHeight = el.style.height;
  el.style.overflow = 'visible';
  el.style.height = 'auto';

  try {
    const imgData = await toJpeg(el, { 
      quality: 0.95,
      pixelRatio: 2, 
      backgroundColor: '#ffffff',
      skipFonts: true,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left'
      }
    });

    if (parentContainer) {
      parentContainer.style.overflow = oldOverflow;
      parentContainer.style.height = oldHeight;
    }
    el.style.overflow = oldElOverflow;
    el.style.height = oldElHeight;
    
    if (type === 'image') {
      return { url: imgData };
    } else {
      const { jsPDF } = await import('jspdf');
      
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (height * pdfWidth) / width;
      const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      return { url };
    }
  } catch (err) {
    if (parentContainer) {
      parentContainer.style.overflow = oldOverflow;
      parentContainer.style.height = oldHeight;
    }
    el.style.overflow = oldElOverflow;
    el.style.height = oldElHeight;
    throw err;
  }
}
