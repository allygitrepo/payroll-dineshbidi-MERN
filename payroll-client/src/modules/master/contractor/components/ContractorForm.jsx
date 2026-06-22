import React, { useState, useEffect } from 'react';
import styles from './ContractorPage.module.css';
import { useToast } from '../../../../shared/components';

const ContractorForm = ({ contractor, addresses = [], onSave, onCancel }) => {
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

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setErrors({});
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

  const validateField = (name, value) => {
    if (name === 'ccode') {
      return !value.trim() ? 'Contractor Code is required!' : '';
    }
    if (name === 'name') {
      return !value.trim() ? 'Name is required!' : '';
    }
    if (name === 'address') {
      return !value ? 'Address is required!' : '';
    }
    if (name === 'postOffice') {
      return !value.trim() ? 'Post Office is required!' : '';
    }
    if (name === 'district') {
      return !value.trim() ? 'District is required!' : '';
    }
    if (name === 'pincode') {
      return !value.trim() ? 'Pincode is required!' : '';
    }
    if (name === 'pfCode') {
      return !value.trim() ? 'PF Code is required!' : '';
    }
    if (name === 'dateOfJoining') {
      return !value ? 'Date of Joining is required!' : '';
    }
    if (name === 'pan') {
      if (value && value.trim()) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return !panRegex.test(value.toUpperCase()) ? 'Invalid PAN format! (e.g. ABCDE1234F)' : '';
      }
      return '';
    }
    if (name === 'aadhaar') {
      if (value && value.trim()) {
        const aadhaarRegex = /^[0-9]{12}$/;
        return !aadhaarRegex.test(value) ? 'Aadhaar must be exactly 12 digits!' : '';
      }
      return '';
    }
    if (name === 'ifsc') {
      if (value && value.trim()) {
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        return !ifscRegex.test(value.toUpperCase()) ? 'Invalid IFSC format! (e.g. SBIN0001234)' : '';
      }
      return '';
    }
    if (name === 'gstNo') {
      if (value && value.trim()) {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return !gstRegex.test(value.toUpperCase()) ? 'Invalid GST format! (e.g. 22AAAAA0000A1Z5)' : '';
      }
      return '';
    }
    if (name === 'bankAccount') {
      if (value && value.trim()) {
        const accountRegex = /^[0-9]{9,18}$/;
        return !accountRegex.test(value) ? 'Bank Account must be between 9 to 18 digits!' : '';
      }
      return '';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;

    if (type !== 'checkbox') {
      if (name === 'pan') {
        finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      } else if (name === 'aadhaar') {
        finalValue = value.replace(/\D/g, '').slice(0, 12);
      } else if (name === 'ifsc') {
        finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
      } else if (name === 'gstNo') {
        finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
      } else if (name === 'bankAccount') {
        finalValue = value.replace(/\D/g, '').slice(0, 18);
      } else if (name === 'pfCode') {
        finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 22);
      } else if (name === 'ccode') {
        finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue
    }));

    if (type !== 'checkbox') {
      const error = validateField(name, finalValue);
      setErrors((prev) => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error
    }));
  };

  const handleAddressChange = (e) => {
    const val = e.target.value;
    const template = addresses.find((t) => t.address === val);
    
    let updatedFormData;
    if (template) {
      updatedFormData = {
        address: val,
        postOffice: template.postOffice,
        district: template.district,
        pincode: template.pincode
      };
    } else {
      updatedFormData = {
        address: val
      };
    }

    setFormData((prev) => {
      const nextData = { ...prev, ...updatedFormData };
      
      const addressError = validateField('address', val);
      const poError = validateField('postOffice', nextData.postOffice);
      const distError = validateField('district', nextData.district);
      const pinError = validateField('pincode', nextData.pincode);

      setErrors((prevErrors) => ({
        ...prevErrors,
        address: addressError,
        postOffice: poError,
        district: distError,
        pincode: pinError
      }));

      return nextData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const tempErrors = {};
    const keysToValidate = [
      'ccode', 'name', 'address', 'postOffice', 'district', 'pincode', 'pfCode', 'dateOfJoining',
      'pan', 'aadhaar', 'ifsc', 'gstNo', 'bankAccount'
    ];

    keysToValidate.forEach((key) => {
      const error = validateField(key, formData[key] || '');
      if (error) {
        tempErrors[key] = error;
      }
    });

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      addToast({ type: 'error', message: 'Please correct the errors in the form.' });
      return;
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
      <form onSubmit={handleSubmit} noValidate>
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
              onBlur={handleBlur}
              placeholder="ENTER CCODE *"
              className={styles.input}
            />
            {errors.ccode && <span className={styles.errorText}>{errors.ccode}</span>}
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
              onBlur={handleBlur}
              placeholder="ENTER NAME *"
              className={styles.input}
            />
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
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
              onBlur={handleBlur}
              className={styles.select}
            >
              <option value="">SELECT ADDRESS</option>
              {addresses.map((opt) => (
                <option key={opt.id} value={opt.address}>{opt.address}</option>
              ))}
            </select>
            {errors.address && <span className={styles.errorText}>{errors.address}</span>}
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
              onBlur={handleBlur}
              placeholder="ENTER POST OFFICE *"
              className={styles.input}
            />
            {errors.postOffice && <span className={styles.errorText}>{errors.postOffice}</span>}
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
            />
            {errors.district && <span className={styles.errorText}>{errors.district}</span>}
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
            />
            {errors.pincode && <span className={styles.errorText}>{errors.pincode}</span>}
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
              onBlur={handleBlur}
              placeholder="ENTER PF CODE *"
              className={styles.input}
            />
            {errors.pfCode && <span className={styles.errorText}>{errors.pfCode}</span>}
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
              onBlur={handleBlur}
              className={styles.input}
            />
            {errors.dateOfJoining && <span className={styles.errorText}>{errors.dateOfJoining}</span>}
          </div>

          {/* PAN */}
          <div className={styles.field}>
            <label className={styles.label}>PAN</label>
            <input
              type="text"
              name="pan"
              value={formData.pan}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="ENTER PAN"
              className={styles.input}
            />
            {errors.pan && <span className={styles.errorText}>{errors.pan}</span>}
          </div>

          {/* Aadhaar */}
          <div className={styles.field}>
            <label className={styles.label}>Aadhar</label>
            <input
              type="text"
              name="aadhaar"
              value={formData.aadhaar}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="ENTER AADHAR"
              className={styles.input}
            />
            {errors.aadhaar && <span className={styles.errorText}>{errors.aadhaar}</span>}
          </div>

          {/* GST No. */}
          <div className={styles.field}>
            <label className={styles.label}>GST No.</label>
            <input
              type="text"
              name="gstNo"
              value={formData.gstNo}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="ENTER GST NO."
              className={styles.input}
            />
            {errors.gstNo && <span className={styles.errorText}>{errors.gstNo}</span>}
          </div>

          {/* Bank A/c */}
          <div className={styles.field}>
            <label className={styles.label}>Bank A/c</label>
            <input
              type="text"
              name="bankAccount"
              value={formData.bankAccount}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="ENTER BANK A/C"
              className={styles.input}
            />
            {errors.bankAccount && <span className={styles.errorText}>{errors.bankAccount}</span>}
          </div>

          {/* Bank Name */}
          <div className={styles.field}>
            <label className={styles.label}>Bank Name</label>
            <input
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              onBlur={handleBlur}
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
              onBlur={handleBlur}
              placeholder="ENTER IFSC"
              className={styles.input}
            />
            {errors.ifsc && <span className={styles.errorText}>{errors.ifsc}</span>}
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
