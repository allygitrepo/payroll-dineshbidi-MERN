import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import styles from './KycUpdatePage.module.css';
import { useToast } from '../../../../shared/components';

const DOC_TYPES = ['AADHAAR', 'PAN', 'UAN', 'BANK PASSBOOK', 'VOTER ID'];

const KycForm = ({ activeEmployee, kycDetails, onAddKyc, onRemoveKyc, onSave, onCancel }) => {
  const addToast = useToast();

  // Local inputs state
  const [kycInput, setKycInput] = useState({
    documentType: '',
    documentNumber: '',
    nameAsPerDocument: '',
    ifsc: '',
    kycImage: ''
  });

  const [errors, setErrors] = useState({});

  const validateField = (name, value, docType = kycInput.documentType) => {
    if (name === 'documentType') {
      return !value ? 'Document Type is required!' : '';
    }
    if (name === 'documentNumber') {
      if (!value.trim()) return 'Document Number is required!';
      if (docType === 'AADHAAR') {
        const aadhaarRegex = /^[0-9]{12}$/;
        return !aadhaarRegex.test(value) ? 'Aadhaar Card Number must be exactly 12 digits!' : '';
      }
      if (docType === 'UAN') {
        const uanRegex = /^[0-9]{12}$/;
        return !uanRegex.test(value) ? 'UAN must be exactly 12 digits!' : '';
      }
      if (docType === 'PAN') {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return !panRegex.test(value.toUpperCase()) ? 'Invalid PAN Format (e.g., ABCDE1234F)' : '';
      }
      if (docType === 'BANK PASSBOOK') {
        const bankRegex = /^[0-9]{9,18}$/;
        return !bankRegex.test(value) ? 'Bank Account Number must be between 9 to 18 digits!' : '';
      }
      if (docType === 'VOTER ID') {
        const voterRegex = /^[A-Z0-9]{10,15}$/;
        return !voterRegex.test(value.toUpperCase()) ? 'Voter ID must be between 10 to 15 alphanumeric characters!' : '';
      }
      return '';
    }
    if (name === 'nameAsPerDocument') {
      return !value.trim() ? 'Name as per document is required!' : '';
    }
    if (name === 'ifsc') {
      if (docType === 'BANK PASSBOOK') {
        if (!value.trim()) return 'IFSC is required for Bank Passbook!';
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        return !ifscRegex.test(value.toUpperCase()) ? 'Invalid IFSC Format (e.g., SBIN0001234)' : '';
      }
      return '';
    }
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    const currentDocType = name === 'documentType' ? value : kycInput.documentType;

    // Apply keystroke constraints
    if (name === 'documentNumber') {
      if (currentDocType === 'AADHAAR' || currentDocType === 'UAN' || currentDocType === 'BANK PASSBOOK') {
        finalValue = value.replace(/\D/g, '');
        if (currentDocType === 'AADHAAR' || currentDocType === 'UAN') {
          finalValue = finalValue.slice(0, 12);
        } else {
          finalValue = finalValue.slice(0, 18);
        }
      } else if (currentDocType === 'PAN') {
        finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      } else if (currentDocType === 'VOTER ID') {
        finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
      }
    } else if (name === 'ifsc') {
      finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    }

    setKycInput((prev) => {
      const nextInput = { ...prev, [name]: finalValue };
      if (name === 'documentType') {
        if (value === 'AADHAAR') {
          nextInput.documentNumber = activeEmployee?.aadhaarCard || '';
          nextInput.nameAsPerDocument = activeEmployee?.memberName || '';
        } else {
          nextInput.documentNumber = '';
          nextInput.nameAsPerDocument = '';
        }
        nextInput.ifsc = '';
        setErrors({});
      }
      return nextInput;
    });

    if (name !== 'documentType') {
      const error = validateField(name, finalValue, currentDocType);
      setErrors((prev) => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value, kycInput.documentType);
    setErrors((prev) => ({
      ...prev,
      [name]: error
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setKycInput((prev) => ({ ...prev, kycImage: e.target.files[0].name }));
    }
  };

  const handleAddClick = () => {
    const tempErrors = {};
    const keysToValidate = ['documentType', 'documentNumber', 'nameAsPerDocument'];
    if (kycInput.documentType === 'BANK PASSBOOK') {
      keysToValidate.push('ifsc');
    }

    keysToValidate.forEach((key) => {
      const error = validateField(key, kycInput[key] || '');
      if (error) {
        tempErrors[key] = error;
      }
    });

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      addToast({ type: 'warning', message: 'Please correct the errors in the KYC form.' });
      return;
    }

    onAddKyc(kycInput);
    // Reset local input form
    setKycInput({
      documentType: '',
      documentNumber: '',
      nameAsPerDocument: '',
      ifsc: '',
      kycImage: ''
    });
    setErrors({});
  };

  return (
    <div className={styles.card}>
      {/* Inline Document Entries Row */}
      <div className={styles.inlineRow}>
        <div className={styles.inlineField}>
          <label className={styles.label}>
            Document Type <span className={styles.required}>*</span>
          </label>
          <select
            name="documentType"
            value={kycInput.documentType}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={styles.select}
          >
            <option value="">SELECT</option>
            {DOC_TYPES.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors.documentType && <span className={styles.errorText}>{errors.documentType}</span>}
        </div>

        <div className={styles.inlineField}>
          <label className={styles.label}>
            Document Number <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="documentNumber"
            value={kycInput.documentNumber}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="ENTER DOCUMENT NUMBER*"
            className={styles.input}
          />
          {errors.documentNumber && <span className={styles.errorText}>{errors.documentNumber}</span>}
        </div>

        <div className={styles.inlineField}>
          <label className={styles.label}>
            Name as Per Document <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="nameAsPerDocument"
            value={kycInput.nameAsPerDocument}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="ENTER NAME AS PER DOCUMENT*"
            className={styles.input}
          />
          {errors.nameAsPerDocument && <span className={styles.errorText}>{errors.nameAsPerDocument}</span>}
        </div>

        <div className={styles.inlineField}>
          <label className={styles.label}>
            IFSC {kycInput.documentType === 'BANK PASSBOOK' && <span className={styles.required}>*</span>}
          </label>
          <input
            type="text"
            name="ifsc"
            value={kycInput.ifsc}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="ENTER IFSC*"
            className={styles.input}
            disabled={kycInput.documentType !== 'BANK PASSBOOK'}
          />
          {errors.ifsc && <span className={styles.errorText}>{errors.ifsc}</span>}
        </div>
      </div>

      <div className={styles.inlineRow} style={{ marginTop: '-12px', alignItems: 'flex-end' }}>
        <div className={styles.inlineField} style={{ maxWidth: '300px' }}>
          <label className={styles.label}>Select KYC Image:</label>
          <input
            type="file"
            onChange={handleFileChange}
            className={styles.input}
          />
        </div>

        <button
          type="button"
          onClick={handleAddClick}
          className={styles.addButton}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* KYC Sub-table grid */}
      <div className={styles.subTableContainer}>
        <table className={styles.subTable}>
          <thead>
            <tr>
              <th>Document Type</th>
              <th>Document No.</th>
              <th>Name as Per Document</th>
              <th>IFSC</th>
              <th>Kyc Image Name</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Remove</th>
            </tr>
          </thead>
          <tbody>
            {kycDetails.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                  No documents added yet.
                </td>
              </tr>
            ) : (
              kycDetails.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td>{item.documentType}</td>
                  <td>{item.documentNumber}</td>
                  <td>{item.nameAsPerDocument}</td>
                  <td>{item.ifsc || '-'}</td>
                  <td>{item.kycImage || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => onRemoveKyc(item.id || idx)}
                      className={styles.removeBtn}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Centered Actions */}
      <div className={styles.buttonGroupCentered}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </button>
        <button type="button" onClick={onSave} className={styles.saveBtn}>
          Save
        </button>
      </div>
    </div>
  );
};

export default KycForm;
