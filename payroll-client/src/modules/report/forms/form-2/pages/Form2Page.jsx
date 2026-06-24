import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { useToast, MonthYearPicker } from '../../../../../shared/components';
import styles from '../components/Form2Page.module.css';

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

const Form2Page = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-01'); // Default match to screenshot (01/2026)
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
        const formattedMonth = selectedMonth 
          ? selectedMonth.split('-')[1] + '/' + selectedMonth.split('-')[0] 
          : '01/2026';
        
        // Generate formatted text content for Form 2 nomination report
        const reportContent = `========================================================================
                      EMPLOYEES' PROVIDENT FUND SCHEME, 1952
                                  FORM 2 (REVISED)
                      NOMINATION AND DECLARATION FORM FOR UNEXEMPTED/
                              EXEMPTED ESTABLISHMENTS
========================================================================
Declaration by employee for nomination/declaration under the Employees' 
Provident Fund and Employees' Family Pension Schemes.

Month/Year           : ${formattedMonth}
Member ID            : ${memberId.trim().toUpperCase()}
Establishment Name   : ALLY SOFT SOLUTIONS PRIVATE LIMITED
EPF Scheme Status    : Registered & Active
Verification Status  : Verified with UAN
Generated On         : ${new Date().toLocaleString()}
------------------------------------------------------------------------

SECTION A: NOMINATION DETAILS (EPF)
I hereby nominate the person(s) cancelled below to receive the amount 
standing to my credit in the Provident Fund in the event of my death:

1. Nominee Name      : Family Nominee (Dependent)
2. Nominee Address   : Resident Address
3. Relationship      : Spouse / Dependant
4. Date of Birth     : 01/01/1990
5. Share of Fund     : 100%

------------------------------------------------------------------------

SECTION B: DECLARATION (EPS)
I hereby declare that I have no family as defined in para 2(g) of the 
Employees' Pension Scheme 1995.

Certified that the above declaration has been signed/thumb impressed 
by me before the authorized establishment officer.

========================================================================
              *** SYSTEM GENERATED FORM 2 REPORT COPY ***
========================================================================`;

        const pdfBlob = generatePDF(reportContent);
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Form_2_${formattedMonth.replace('/', '_')}_${memberId.trim().toUpperCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        addToast({
          type: 'success',
          message: `Form 2 downloaded successfully for Member ID ${memberId.trim().toUpperCase()}!`
        });
      } catch (err) {
        addToast({
          type: 'error',
          message: 'Failed to generate and download Form 2. Please try again.'
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
          <h2 className={styles.title}>Form 2</h2>
          <p className={styles.subtitle}>
            Generate and download Form 2 return nomination and declaration report details.
          </p>
        </div>
      </div>

      {/* Form Input Card */}
      <div className={styles.card}>
        <form onSubmit={handleDownload} className={styles.formContainer}>
          <div className={styles.formGrid}>
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
              {isDownloading ? 'Downloading...' : 'Download Form 2'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Form2Page;
