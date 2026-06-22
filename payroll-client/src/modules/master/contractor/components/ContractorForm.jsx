import React, { useState, useEffect } from 'react';
import styles from './ContractorPage.module.css';
import { useToast } from '../../../../shared/components';

const ADDRESS_TEMPLATES = [
  {
    value: 'BANDHA GHAT',
    label: 'BANDHA GHAT',
    postOffice: 'JHALDA',
    district: 'PURULIA',
    pincode: '723202'
  },
  {
    value: 'DURGAPUR INDUSTRIAL AREA',
    label: 'DURGAPUR INDUSTRIAL AREA',
    postOffice: 'DURGAPUR HQ',
    district: 'PASCHIM BARDHAMAN',
    pincode: '713216'
  },
  {
    value: 'SALT LAKE SECTOR V',
    label: 'SALT LAKE SECTOR V',
    postOffice: 'BIDHANNAGAR',
    district: 'NORTH 24 PARGANAS',
    pincode: '700091'
  }
];

const ContractorForm = ({ contractor, onSave, onCancel }) => {
  const addToast = useToast();

  const [formData, setFormData] = useState({
    id: '',
    ccode: '',
    name: '',
    address: '',
    postOffice: '',
    district: '',
    pincode: '',
    pfCode: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    pan: '',
    aadhaar: '',
    gstNo: '',
    bankAccount: '',
    bankName: '',
    ifsc: '',
    isActive: true
  });

  useEffect(() => {
    if (contractor) {
      setFormData({
        ...contractor,
        isActive: contractor.status === 'Active'
      });
    } else {
      setFormData({
        id: '',
        ccode: '',
        name: '',
        address: '',
        postOffice: '',
        district: '',
        pincode: '',
        pfCode: '',
        dateOfJoining: new Date().toISOString().split('T')[0],
        pan: '',
        aadhaar: '',
        gstNo: '',
        bankAccount: '',
        bankName: '',
        ifsc: '',
        isActive: true
      });
    }
  }, [contractor]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddressChange = (e) => {
    const val = e.target.value;
    const template = ADDRESS_TEMPLATES.find((t) => t.value === val);
    if (template) {
      setFormData((prev) => ({
        ...prev,
        address: val,
        postOffice: template.postOffice,
        district: template.district,
        pincode: template.pincode
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        address: val
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validations
    if (!formData.ccode.trim()) {
      addToast({ type: 'error', message: 'Contractor Code (ccode) is required!' });
      return;
    }
    if (!formData.name.trim()) {
      addToast({ type: 'error', message: 'Name is required!' });
      return;
    }
    if (!formData.address) {
      addToast({ type: 'error', message: 'Address is required!' });
      return;
    }
    if (!formData.pfCode.trim()) {
      addToast({ type: 'error', message: 'PF Code is required!' });
      return;
    }
    if (!formData.dateOfJoining) {
      addToast({ type: 'error', message: 'Date of Joining is required!' });
      return;
    }

    // Optional regex validations
    if (formData.pan) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(formData.pan.toUpperCase())) {
        addToast({ type: 'warning', message: 'Invalid PAN format!' });
        return;
      }
    }
    if (formData.aadhaar) {
      const aadhaarRegex = /^[0-9]{12}$/;
      if (!aadhaarRegex.test(formData.aadhaar)) {
        addToast({ type: 'warning', message: 'Aadhaar must be exactly 12 digits!' });
        return;
      }
    }
    if (formData.ifsc) {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(formData.ifsc.toUpperCase())) {
        addToast({ type: 'warning', message: 'Invalid IFSC format!' });
        return;
      }
    }

    const payload = {
      ...formData,
      status: formData.isActive ? 'Active' : 'Inactive'
    };
    delete payload.isActive;

    onSave(payload);
  };

  return (
    <div className={styles.formCard}>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          {/* Ccode */}
          <div className={styles.field}>
            <label className={styles.label}>
              Ccode <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="ccode"
              value={formData.ccode}
              onChange={handleChange}
              placeholder="ENTER CCODE *"
              className={styles.input}
              required
            />
          </div>

          {/* Name */}
          <div className={styles.field}>
            <label className={styles.label}>
              Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="ENTER NAME *"
              className={styles.input}
              required
            />
          </div>

          {/* Address dropdown */}
          <div className={styles.field}>
            <label className={styles.label}>
              Address <span className={styles.required}>*</span>
            </label>
            <select
              name="address"
              value={formData.address}
              onChange={handleAddressChange}
              className={styles.select}
              required
            >
              <option value="" disabled>SELECT ADDRESS</option>
              {ADDRESS_TEMPLATES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Post Office */}
          <div className={styles.field}>
            <label className={styles.label}>
              Post Office <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="postOffice"
              value={formData.postOffice}
              onChange={handleChange}
              placeholder="ENTER POST OFFICE *"
              className={styles.input}
              required
            />
          </div>

          {/* Dist */}
          <div className={styles.field}>
            <label className={styles.label}>
              Dist <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="district"
              value={formData.district}
              readOnly
              placeholder="ENTER DIST *"
              className={`${styles.input} ${styles.disabledInput}`}
              required
            />
          </div>

          {/* Pincode */}
          <div className={styles.field}>
            <label className={styles.label}>
              Pincode <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              readOnly
              placeholder="ENTER PIN *"
              className={`${styles.input} ${styles.disabledInput}`}
              required
            />
          </div>

          {/* PF Code */}
          <div className={styles.field}>
            <label className={styles.label}>
              PF Code <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="pfCode"
              value={formData.pfCode}
              onChange={handleChange}
              placeholder="ENTER PF CODE *"
              className={styles.input}
              required
            />
          </div>

          {/* Date of Joining */}
          <div className={styles.field}>
            <label className={styles.label}>
              Date of Joining <span className={styles.required}>*</span>
            </label>
            <input
              type="date"
              name="dateOfJoining"
              value={formData.dateOfJoining}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          {/* PAN */}
          <div className={styles.field}>
            <label className={styles.label}>PAN</label>
            <input
              type="text"
              name="pan"
              value={formData.pan}
              onChange={handleChange}
              placeholder="ENTER PAN"
              className={styles.input}
            />
          </div>

          {/* Aadhaar */}
          <div className={styles.field}>
            <label className={styles.label}>Aadhar</label>
            <input
              type="text"
              name="aadhaar"
              value={formData.aadhaar}
              onChange={handleChange}
              placeholder="ENTER AADHAR"
              maxLength={12}
              className={styles.input}
            />
          </div>

          {/* GST No. */}
          <div className={styles.field}>
            <label className={styles.label}>GST No.</label>
            <input
              type="text"
              name="gstNo"
              value={formData.gstNo}
              onChange={handleChange}
              placeholder="ENTER GST NO."
              className={styles.input}
            />
          </div>

          {/* Bank A/c */}
          <div className={styles.field}>
            <label className={styles.label}>Bank A/c</label>
            <input
              type="text"
              name="bankAccount"
              value={formData.bankAccount}
              onChange={handleChange}
              placeholder="ENTER BANK A/C"
              className={styles.input}
            />
          </div>

          {/* Bank Name */}
          <div className={styles.field}>
            <label className={styles.label}>Bank Name</label>
            <input
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              placeholder="ENTER BANK NAME"
              className={styles.input}
            />
          </div>

          {/* IFSC */}
          <div className={styles.field}>
            <label className={styles.label}>IFSC</label>
            <input
              type="text"
              name="ifsc"
              value={formData.ifsc}
              onChange={handleChange}
              placeholder="ENTER IFSC"
              className={styles.input}
            />
          </div>

          {/* Status (Active) */}
          <div className={styles.field} style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
            <label className={styles.label} style={{ marginBottom: '6px' }}>Status (Active)</label>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className={styles.checkbox}
            />
          </div>
        </div>

        {/* Centered Actions */}
        <div className={styles.buttonGroupCentered}>
          <button type="button" onClick={onCancel} className={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" className={styles.saveBtn}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContractorForm;
