import React, { useState, useEffect } from 'react';
import styles from './AddressPage.module.css';
import { useToast } from '../../../../shared/components';

const AddressForm = ({ address, onSave, onCancel }) => {
  const addToast = useToast();

  const [formData, setFormData] = useState({
    id: '',
    address: '',
    postOffice: '',
    district: '',
    pincode: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setErrors({});
    if (address) {
      setFormData(address);
    } else {
      setFormData({
        id: '',
        address: '',
        postOffice: '',
        district: '',
        pincode: ''
      });
    }
  }, [address]);

  const validateField = (name, value) => {
    if (name === 'pincode') {
      if (value && value.trim()) {
        const pinRegex = /^[0-9]{6}$/;
        return !pinRegex.test(value) ? 'Pincode must be exactly 6 digits!' : '';
      }
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'pincode') {
      finalValue = value.replace(/\D/g, '').slice(0, 6);
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));

    const error = validateField(name, finalValue);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const tempErrors = {};
    const keysToValidate = ['pincode'];

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

    onSave(formData);
    // Reset form if creating new
    if (!address) {
      setFormData({
        id: '',
        address: '',
        postOffice: '',
        district: '',
        pincode: ''
      });
      setErrors({});
    }
  };

  return (
    <div className={styles.formCard} style={{ marginBottom: '24px' }}>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.formGrid}>
          {/* Address (textarea) */}
          <div className={styles.field}>
            <label className={styles.label}>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="ADDRESS"
              className={styles.textarea}
            />
            {errors.address && <span className={styles.errorText}>{errors.address}</span>}
          </div>

          {/* Post Office */}
          <div className={styles.field}>
            <label className={styles.label}>Post Office</label>
            <input
              type="text"
              name="postOffice"
              value={formData.postOffice}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="POST OFFICE"
              className={styles.input}
            />
            {errors.postOffice && <span className={styles.errorText}>{errors.postOffice}</span>}
          </div>

          {/* District */}
          <div className={styles.field}>
            <label className={styles.label}>District</label>
            <input
              type="text"
              name="district"
              value={formData.district}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="DISTRICT"
              className={styles.input}
            />
            {errors.district && <span className={styles.errorText}>{errors.district}</span>}
          </div>

          {/* Pincode */}
          <div className={styles.field}>
            <label className={styles.label}>Pincode</label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="PINCODE"
              className={styles.input}
            />
            {errors.pincode && <span className={styles.errorText}>{errors.pincode}</span>}
          </div>
        </div>

        {/* Centered actions */}
        <div className={styles.buttonGroupCentered}>
          {address && (
            <button type="button" onClick={onCancel} className={styles.cancelBtn}>
              Cancel
            </button>
          )}
          <button type="submit" className={styles.saveBtn}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddressForm;
