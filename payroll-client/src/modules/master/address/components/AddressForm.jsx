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

  useEffect(() => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validations
    if (!formData.address.trim()) {
      addToast({ type: 'error', message: 'Address is required!' });
      return;
    }
    if (!formData.postOffice.trim()) {
      addToast({ type: 'error', message: 'Post Office is required!' });
      return;
    }
    if (!formData.district.trim()) {
      addToast({ type: 'error', message: 'District is required!' });
      return;
    }
    if (!formData.pincode.trim()) {
      addToast({ type: 'error', message: 'Pincode is required!' });
      return;
    }

    // Pincode regex validation
    const pinRegex = /^[0-9]{6}$/;
    if (!pinRegex.test(formData.pincode)) {
      addToast({ type: 'warning', message: 'Pincode must be exactly 6 digits!' });
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
    }
  };

  return (
    <div className={styles.formCard} style={{ marginBottom: '24px' }}>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          {/* Address (textarea) */}
          <div className={styles.field}>
            <label className={styles.label}>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="ADDRESS"
              className={styles.textarea}
              required
            />
          </div>

          {/* Post Office */}
          <div className={styles.field}>
            <label className={styles.label}>Post Office</label>
            <input
              type="text"
              name="postOffice"
              value={formData.postOffice}
              onChange={handleChange}
              placeholder="POST OFFICE"
              className={styles.input}
              required
            />
          </div>

          {/* District */}
          <div className={styles.field}>
            <label className={styles.label}>District</label>
            <input
              type="text"
              name="district"
              value={formData.district}
              onChange={handleChange}
              placeholder="DISTRICT"
              className={styles.input}
              required
            />
          </div>

          {/* Pincode */}
          <div className={styles.field}>
            <label className={styles.label}>Pincode</label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="PINCODE"
              className={styles.input}
              required
            />
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
