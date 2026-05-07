import { domToJpeg } from 'modern-screenshot';

export async function generateExportData(
  elementId: string, 
  name: string, 
  type: 'pdf' | 'image'
): Promise<{ id?: string, url?: string }> {
  const el = document.getElementById(elementId);
  if (!el) throw new Error('Element not found');
  
  try {
    // Temporarily disable transform to avoid offset issues on mobile 
    const prevTransform = el.style.transform;
    const prevTransition = el.style.transition;
    const prevPosition = el.style.position;
    const prevLeft = el.style.left;
    const prevTop = el.style.top;
    const prevMargin = el.style.margin;

    el.style.transform = 'none';
    el.style.transition = 'none';
    el.style.position = 'absolute';
    el.style.left = '0';
    el.style.top = '0';
    el.style.margin = '0';
    
    // Wait for layout to update
    await new Promise(r => setTimeout(r, 100));

    const width = el.offsetWidth;
    const height = el.offsetHeight;

    const imgData = await domToJpeg(el, {
      quality: 0.95,
      scale: 2,
      backgroundColor: '#ffffff',
      width: width,
      height: height,
      style: {
        transform: 'none',
        transformOrigin: 'top left',
        margin: '0',
      }
    });

    // Restore original transform
    el.style.transform = prevTransform;
    el.style.transition = prevTransition;
    el.style.position = prevPosition;
    el.style.left = prevLeft;
    el.style.top = prevTop;
    el.style.margin = prevMargin;
    
    if (type === 'image') {
      return { url: imgData };
    } else {
      const { jsPDF } = await import('jspdf');
      
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (height * pdfWidth) / width;
      const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      return { url };
    }
  } catch (err) {
    console.error('Export failed:', err);
    throw err;
  }
}
