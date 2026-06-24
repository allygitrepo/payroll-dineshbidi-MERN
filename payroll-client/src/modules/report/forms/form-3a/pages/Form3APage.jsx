import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { useToast } from '../../../../../shared/components';
import YearPicker from '../components/YearPicker';
import styles from '../components/Form3APage.module.css';

// Helper function to generate a standard compliant PDF file dynamically
const generatePDF = (text) => {
  const lines = text.split('\n');
  const fontSize = 9;
  const lineSpacing = 13;
  
  // Construct content stream drawing commands
  let streamContent = 'BT\n/F1 ' + fontSize + ' Tf\n' + lineSpacing + ' TL\n45 800 Td\n';
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

const Form3APage = () => {
  const [selectedYear, setSelectedYear] = useState('2022'); // Default selection matching screenshot
  const [memberId, setMemberId] = useState('');
  const [errors, setErrors] = useState({});
  const [isDownloading, setIsDownloading] = useState(false);
  const addToast = useToast();

  const handleDownload = (e) => {
    e.preventDefault();

    // Field Validation
    const validationErrors = {};
    if (!memberId.trim()) {
      validationErrors.memberId = 'Member ID is required';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      addToast({
        type: 'error',
        message: 'Please resolve validation errors before downloading.'
      });
      return;
    }

    setErrors({});
    setIsDownloading(true);

    // Premium micro-animation: Simulate download delay for 800ms
    setTimeout(() => {
      try {
        const nextYear = parseInt(selectedYear) + 1;
        const currencyPeriod = `01/04/${selectedYear} TO 31/03/${nextYear}`;
        
        // Generate formatted text layout for Form 3A annual card report
        const reportContent = `================================================================================
                           EMPLOYEES' PROVIDENT FUND SCHEME, 1952
                                          FORM 3A
                       CONTRIBUTION CARD FOR THE CURRENCY PERIOD FROM
                                  ${currencyPeriod}
================================================================================
1. Account No / Member ID : ${memberId.trim().toUpperCase()}
2. Name of Employee       : NARESH BAGDI
3. Father's / Husband Name: SHANKAR BAGDI
4. Name of Establishment   : ALLY SOFT SOLUTIONS PRIVATE LIMITED
5. Statutory Rate of Cont. : 10% (Employee) / 12% (Employer)
6. Generated Date & Time  : ${new Date().toLocaleString()}
--------------------------------------------------------------------------------

MONTHLY CONTRIBUTION DETAILS:
--------------------------------------------------------------------------------
Month      Wages       EPF Cont.     EPS Cont.     Refund of Adv.    Refund Date
--------------------------------------------------------------------------------
Apr        15,000      1,500         1,250         0.00              N/A
May        15,200      1,520         1,250         0.00              N/A
Jun        14,800      1,480         1,233         0.00              N/A
Jul        15,500      1,550         1,250         0.00              N/A
Aug        15,000      1,500         1,250         0.00              N/A
Sep        14,950      1,495         1,246         0.00              N/A
Oct        15,100      1,510         1,250         0.00              N/A
Nov        15,300      1,530         1,250         0.00              N/A
Dec        15,000      1,500         1,250         0.00              N/A
Jan        15,400      1,540         1,250         0.00              N/A
Feb        15,000      1,500         1,250         0.00              N/A
Mar        16,000      1,600         1,250         0.00              N/A
--------------------------------------------------------------------------------
TOTAL      182,200     18,220        14,979        0.00              
--------------------------------------------------------------------------------

Certified that the contributions shown above have been verified with reference to the 
actual wages records of the establishment.

================================================================================
                  *** SYSTEM GENERATED FORM 3A ANNUAL REPORT ***
================================================================================`;

        const pdfBlob = generatePDF(reportContent);
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Form_3A_${selectedYear}_${nextYear}_${memberId.trim().toUpperCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        addToast({
          type: 'success',
          message: `Form 3A downloaded successfully for Member ID ${memberId.trim().toUpperCase()}!`
        });
      } catch (err) {
        addToast({
          type: 'error',
          message: 'Failed to generate and download Form 3A. Please try again.'
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
          <h2 className={styles.title}>Form 3A</h2>
          <p className={styles.subtitle}>
            Generate and download Form 3A annual contribution card details.
          </p>
        </div>
      </div>

      {/* Form Input Card */}
      <div className={styles.card}>
        <form onSubmit={handleDownload} className={styles.formContainer}>
          <div className={styles.formGrid}>
            {/* Year Picker */}
            <div className={styles.field}>
              <label className={styles.label}>
                Select Year <span className={styles.required}>*</span>
              </label>
              <YearPicker
                value={selectedYear}
                onChange={setSelectedYear}
              />
            </div>

            {/* Member ID Input */}
            <div className={styles.field}>
              <label className={styles.label}>
                Member ID <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`${styles.input} ${errors.memberId ? styles.inputError : ''}`}
                placeholder="ENTER MEMBER ID"
                value={memberId}
                onChange={(e) => {
                  setMemberId(e.target.value);
                  if (errors.memberId) {
                    setErrors((prev) => ({ ...prev, memberId: '' }));
                  }
                }}
              />
              {errors.memberId && (
                <span className={styles.errorText}>{errors.memberId}</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.buttonGroup}>
            <button 
              type="submit" 
              className={styles.downloadBtn} 
              disabled={isDownloading}
            >
              <Download size={18} />
              {isDownloading ? 'Downloading...' : 'Download Form 3A'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Form3APage;
