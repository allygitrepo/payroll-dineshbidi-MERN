import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import styles from './KycUpdatePage.module.css';
import { useToast } from '../../../../shared/components';

const DOC_TYPES = ['AADHAAR', 'PAN', 'UAN', 'BANK PASSBOOK', 'VOTER ID'];

const KycForm = ({ kycDetails, onAddKyc, onRemoveKyc, onSave, onCancel }) => {
  const addToast = useToast();

  // Local inputs state
  const [kycInput, setKycInput] = useState({
    documentType: '',
    documentNumber: '',
    nameAsPerDocument: '',
    ifsc: '',
    kycImage: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setKycInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setKycInput((prev) => ({ ...prev, kycImage: e.target.files[0].name }));
    }
  };

  const handleAddClick = () => {
    if (!kycInput.documentType) {
      addToast({ type: 'warning', message: 'Select Document Type first!' });
      return;
    }
    if (!kycInput.documentNumber.trim()) {
      addToast({ type: 'warning', message: 'Document Number is required!' });
      return;
    }
    if (!kycInput.nameAsPerDocument.trim()) {
      addToast({ type: 'warning', message: 'Name as per document is required!' });
      return;
    }
    if (kycInput.documentType === 'BANK PASSBOOK' && !kycInput.ifsc.trim()) {
      addToast({ type: 'warning', message: 'IFSC is required for Bank Passbook!' });
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
  };

  return (
    <div className={styles.card}>
      {/* Inline Document Entries Row */}
      <div className={styles.inlineRow}>
        <div className={styles.inlineField}>
          <label className={styles.label}>Document Type *</label>
          <select
            name="documentType"
            value={kycInput.documentType}
            onChange={handleInputChange}
            className={styles.select}
          >
            <option value="">SELECT</option>
            {DOC_TYPES.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className={styles.inlineField}>
          <label className={styles.label}>Document Number *</label>
          <input
            type="text"
            name="documentNumber"
            value={kycInput.documentNumber}
            onChange={handleInputChange}
            placeholder="ENTER DOCUMENT NUMBER*"
            className={styles.input}
          />
        </div>

        <div className={styles.inlineField}>
          <label className={styles.label}>Name as Per Document *</label>
          <input
            type="text"
            name="nameAsPerDocument"
            value={kycInput.nameAsPerDocument}
            onChange={handleInputChange}
            placeholder="ENTER NAME AS PER DOCUMENT*"
            className={styles.input}
          />
        </div>

        <div className={styles.inlineField}>
          <label className={styles.label}>IFSC *</label>
          <input
            type="text"
            name="ifsc"
            value={kycInput.ifsc}
            onChange={handleInputChange}
            placeholder="ENTER IFSC*"
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.inlineRow} style={{ marginTop: '-12px' }}>
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
