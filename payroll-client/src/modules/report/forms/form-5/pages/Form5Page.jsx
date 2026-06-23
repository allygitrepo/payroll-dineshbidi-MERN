import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { useToast, MonthYearPicker } from '../../../../../shared/components';
import styles from '../components/Form5Page.module.css';

// Helper function to generate a standard compliant PDF file dynamically
const generatePDF = (text) => {
  const lines = text.split('\n');
  const fontSize = 10;
  const lineSpacing = 14;
  
  // Construct content stream drawing commands
  let streamContent = 'BT\n/F1 ' + fontSize + ' Tf\n' + lineSpacing + ' TL\n50 780 Td\n';
  lines.forEach((line) => {
    // Escape standard PDF delimiters
    const escapedLine = line
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
    streamContent += `(${escapedLine}) Tj T*\n`;
  });
  streamContent += 'ET';
  
  const catalogIdx = 1;
  const pagesIdx = 2;
  const pageIdx = 3;
  const resourcesIdx = 4;
  const contentIdx = 5;
  const fontIdx = 6;
  
  const catalog = `${catalogIdx} 0 obj\n<< /Type /Catalog /Pages ${pagesIdx} 0 R >>\nendobj`;
  const pages = `${pagesIdx} 0 obj\n<< /Type /Pages /Kids [${pageIdx} 0 R] /Count 1 >>\nendobj`;
  const page = `${pageIdx} 0 obj\n<< /Type /Page /Parent ${pagesIdx} 0 R /Resources ${resourcesIdx} 0 R /MediaBox [0 0 595 842] /Contents ${contentIdx} 0 R >>\nendobj`;
  const resources = `${resourcesIdx} 0 obj\n<< /Font << /F1 ${fontIdx} 0 R >> >>\nendobj`;
  
  const streamLength = streamContent.length;
  const contentStream = `${contentIdx} 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`;
  const font = `${fontIdx} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj`;
  
  const pdfObjects = [catalog, pages, page, resources, contentStream, font];
  
  let pdfString = '%PDF-1.4\n';
  const offsets = [];
  
  pdfObjects.forEach((obj) => {
    offsets.push(pdfString.length);
    pdfString += obj + '\n';
  });
  
  const xrefOffset = pdfString.length;
  pdfString += 'xref\n';
  pdfString += `0 ${pdfObjects.length + 1}\n`;
  pdfString += '0000000000 65535 f \n';
  
  offsets.forEach((offset) => {
    const paddedOffset = ('0000000000' + offset).slice(-10);
    pdfString += `${paddedOffset} 00000 n \n`;
  });
  
  pdfString += 'trailer\n';
  pdfString += `<< /Size ${pdfObjects.length + 1} /Root 1 0 R >>\n`;
  pdfString += 'startxref\n';
  pdfString += `${xrefOffset}\n`;
  pdfString += '%%EOF';
  
  // Convert output string to matching binary array buffer
  const buf = new ArrayBuffer(pdfString.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0; i < pdfString.length; i++) {
    bufView[i] = pdfString.charCodeAt(i);
  }
  
  return new Blob([buf], { type: 'application/pdf' });
};

const Form5Page = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-06'); // Default selection matching screenshot
  const [isDownloading, setIsDownloading] = useState(false);
  const addToast = useToast();

  const handleDownload = (e) => {
    e.preventDefault();
    setIsDownloading(true);

    // Premium micro-animation: Simulate download delay for 800ms
    setTimeout(() => {
      try {
        const formattedMonth = selectedMonth 
          ? selectedMonth.split('-')[1] + '/' + selectedMonth.split('-')[0] 
          : '06/2026';
        
        // Generate formatted text content for Form 5 report
        const reportContent = `========================================================================
                      EMPLOYEES' PROVIDENT FUND SCHEME, 1952
                                     FORM 5
              RETURN OF EMPLOYEES QUALIFYING FOR MEMBERSHIP OF THE
                 EMPLOYEES' PROVIDENT FUND FOR THE FIRST TIME
========================================================================
Month/Year           : ${formattedMonth}
Establishment Name   : ALLY SOFT SOLUTIONS PRIVATE LIMITED
EPF Scheme Status    : Active
Generated On         : ${new Date().toLocaleString()}
------------------------------------------------------------------------

NEW EPF MEMBERS ELIGIBILITY SCHEDULE:
------------------------------------------------------------------------
Sr.  Employee Name      Father's Name        Gender   UAN           DOB
------------------------------------------------------------------------
1    SAMIR MACHHWAR     ANAND MACHHWAR       MALE     100329862005  15/08/1993
2    NARESH BAGDI       SHANKAR BAGDI        MALE     100251178836  12/10/1995
3    RAMKRISHNA BAGTI   GOPAL BAGTI          MALE     101177429203  04/04/1990
------------------------------------------------------------------------

Certified that the above mentioned employees are qualifying for the 
EPF membership for the first time during the currency month, and the 
relevant forms have been obtained and submitted.

========================================================================
              *** SYSTEM GENERATED FORM 5 REPORT COPY ***
========================================================================`;

        const pdfBlob = generatePDF(reportContent);
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Form_5_${formattedMonth.replace('/', '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        addToast({
          type: 'success',
          message: `Form 5 downloaded successfully for Month ${formattedMonth}!`
        });
      } catch (err) {
        addToast({
          type: 'error',
          message: 'Failed to generate and download Form 5. Please try again.'
        });
      } finally {
        setIsDownloading(false);
      }
    }, 800);
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Form 5</h2>
          <p className={styles.subtitle}>
            Generate and download Form 5 return of employees qualifying for EPF membership for the first time.
          </p>
        </div>
      </div>

      {/* Form Input Card */}
      <div className={styles.card}>
        <form onSubmit={handleDownload} className={styles.formContainer}>
          {/* Month Picker */}
          <div className={styles.field}>
            <label className={styles.label}>
              Select Month <span className={styles.required}>*</span>
            </label>
            <MonthYearPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
          </div>

          {/* Action Buttons */}
          <div className={styles.buttonGroup}>
            <button 
              type="submit" 
              className={styles.downloadBtn} 
              disabled={isDownloading}
            >
              <Download size={18} />
              {isDownloading ? 'Downloading...' : 'Download Form 5'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Form5Page;
