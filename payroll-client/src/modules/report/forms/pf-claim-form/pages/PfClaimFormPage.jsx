import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { useToast } from '../../../../../shared/components';
import styles from '../components/PfClaimFormPage.module.css';

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

const PfClaimFormPage = () => {
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
        // Generate formatted text content for PF Claim Form report
        const reportContent = `========================================================================
                      EMPLOYEES' PROVIDENT FUND SCHEME, 1952
                         CLAIM FORM (FORM 19 / 31 / 10C)
========================================================================
Member ID / Account No: ${memberId.trim().toUpperCase()}
Employee Name         : NARESH BAGDI
Father's Name         : SHANKAR BAGDI
Establishment Name    : ALLY SOFT SOLUTIONS PRIVATE LIMITED
PAN Card Status       : Verified & Linked
Bank Account Linked   : State Bank of India (Verified)
Generated On         : ${new Date().toLocaleString()}
------------------------------------------------------------------------

CLAIM DETAILS DESCRIPTION:
------------------------------------------------------------------------
1. Universal Account Number (UAN)   : 100251178836
2. Reason for Claim / Withdrawal    : Cessation (Short Service)
3. Claim Type / Form Select         : Form 19 (PF Final Settlement)
4. Pension Withdrawal Benefit       : Form 10C (Applicable)
5. Permanent Address                : Resident Address, India

I hereby declare that I have retired / left service and all details provided 
in this declaration form are true to the best of my knowledge.

========================================================================
            *** SYSTEM GENERATED PF CLAIM FORM SUMMARY COPY ***
========================================================================`;

        const pdfBlob = generatePDF(reportContent);
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `PF_Claim_Form_${memberId.trim().toUpperCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        addToast({
          type: 'success',
          message: `PF Claim Form downloaded successfully for Member ID ${memberId.trim().toUpperCase()}!`
        });
      } catch (err) {
        addToast({
          type: 'error',
          message: 'Failed to generate and download PF Claim Form. Please try again.'
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
          <h2 className={styles.title}>PF Claim Form</h2>
          <p className={styles.subtitle}>
            Generate and download Employees' Provident Fund Claim Form (Form 19 / 31 / 10C) details.
          </p>
        </div>
      </div>

      {/* Form Input Card */}
      <div className={styles.card}>
        <form onSubmit={handleDownload} className={styles.formContainer}>
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

          {/* Action Buttons */}
          <div className={styles.buttonGroup}>
            <button 
              type="submit" 
              className={styles.downloadBtn} 
              disabled={isDownloading}
            >
              <Download size={18} />
              {isDownloading ? 'Downloading...' : 'Download PF Claim Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PfClaimFormPage;
