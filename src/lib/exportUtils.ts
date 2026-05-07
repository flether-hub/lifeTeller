import { domToJpeg } from 'modern-screenshot';

export async function generateExportData(
  elementId: string, 
  name: string, 
  type: 'pdf' | 'image'
): Promise<{ id?: string, url?: string }> {
  const el = document.getElementById(elementId);
  if (!el) throw new Error('Element not found');
  
  try {
    // Wait for fonts and images to be ready
    await new Promise(r => setTimeout(r, 500));

    const imgData = await domToJpeg(el, {
      quality: 0.95,
      scale: 2,
      backgroundColor: '#ffffff',
    });
    
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
    console.error('Export failed:', err);
    throw err;
  }
}
