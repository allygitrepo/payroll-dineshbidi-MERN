import React, { useState, useEffect } from 'react';
import styles from './CompanyPage.module.css';
import { useToast } from '../../../../shared/components';

const ESTB_TYPES = [
  { value: 'PROPRIETORSHIP', label: 'PROPRIETORSHIP' },
  { value: 'PARTNERSHIP', label: 'PARTNERSHIP' },
  { value: 'PRIVATE LIMITED', label: 'PRIVATE LIMITED' },
  { value: 'PUBLIC LIMITED', label: 'PUBLIC LIMITED' }
];

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

const CompanyForm = ({ company, onSave, onCancel }) => {
  const addToast = useToast();
  
  const [formData, setFormData] = useState({
    id: '',
    estbId: '',
    estbName: '',
    estbType: '',
    epfoOffice: '',
    linNo: '',
    esicId: '',
    address: '',
    postOffice: '',
    district: '',
    pincode: '',
    pan: '',
    tan: '',
    ptax: '',
    email: '',
    phone: '',
    website: ''
  });

  useEffect(() => {
    if (company) {
      setFormData(company);
    } else {
      setFormData({
        id: '',
        estbId: '',
        estbName: '',
        estbType: '',
        epfoOffice: '',
        linNo: '',
        esicId: '',
        address: '',
        postOffice: '',
        district: '',
        pincode: '',
        pan: '',
        tan: '',
        ptax: '',
        email: '',
        phone: '',
        website: ''
      });
    }
  }, [company]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (e) => {
    const val = e.target.value;
    const template = ADDRESS_TEMPLATES.find(t => t.value === val);
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
    if (!formData.estbId.trim()) {
      addToast({ type: 'error', message: 'Estb ID is required!' });
      return;
    }
    if (!formData.estbName.trim()) {
      addToast({ type: 'error', message: 'Establishment Name is required!' });
      return;
    }
    if (!formData.estbType) {
      addToast({ type: 'error', message: 'Establishment Type is required!' });
      return;
    }
    if (!formData.epfoOffice.trim()) {
      addToast({ type: 'error', message: 'Under EPFO Office is required!' });
      return;
    }
    if (!formData.linNo.trim()) {
      addToast({ type: 'error', message: 'LIN No. is required!' });
      return;
    }
    if (!formData.address) {
      addToast({ type: 'error', message: 'Address is required!' });
      return;
    }
    if (!formData.postOffice.trim()) {
      addToast({ type: 'error', message: 'Post Office is required!' });
      return;
    }
    
    // Regex validations
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (formData.pan && !panRegex.test(formData.pan.toUpperCase())) {
      addToast({ type: 'warning', message: 'Invalid PAN Format (e.g., ABCDE1234F)' });
      return;
    }

    const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;
    if (formData.tan && !tanRegex.test(formData.tan.toUpperCase())) {
      addToast({ type: 'warning', message: 'Invalid TAN Format (e.g., ABCD12345E)' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      addToast({ type: 'warning', message: 'Invalid Email Address Format' });
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      addToast({ type: 'warning', message: 'Phone number must be exactly 10 digits' });
      return;
    }

    onSave(formData);
  };

  return (
    <div className={styles.formCard}>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          
          {/* Row 1 */}
          <div className={`${styles.field} ${styles.fieldEstbId}`}>
            <label className={styles.label}>
              Estb ID <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="estbId"
              value={formData.estbId}
              onChange={handleChange}
              placeholder="ENTER ESTB ID *"
              className={styles.input}
              required
            />
          </div>

          <div className={`${styles.field} ${styles.fieldEstbName}`}>
            <label className={styles.label}>
              Establishment Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="estbName"
              value={formData.estbName}
              onChange={handleChange}
              placeholder="ENTER ESTABLISHMENT NAME *"
              className={styles.input}
              required
            />
          </div>

          <div className={`${styles.field} ${styles.fieldEstbType}`}>
            <label className={styles.label}>
              Establishment Type <span className={styles.required}>*</span>
            </label>
            <select
              name="estbType"
              value={formData.estbType}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="" disabled>SELECT</option>
              {ESTB_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={`${styles.field} ${styles.fieldEpfo}`}>
            <label className={styles.label}>
              Under EPFO Office <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="epfoOffice"
              value={formData.epfoOffice}
              onChange={handleChange}
              placeholder="ENTER UNDER EPFO OFFICE *"
              className={styles.input}
              required
            />
          </div>

          {/* Row 2 */}
          <div className={`${styles.field} ${styles.fieldLin}`}>
            <label className={styles.label}>
              LIN No. <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="linNo"
              value={formData.linNo}
              onChange={handleChange}
              placeholder="ENTER LIN NO. *"
              className={styles.input}
              required
            />
          </div>

          <div className={`${styles.field} ${styles.fieldEsic}`}>
            <label className={styles.label}>
              ESIC ID <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="esicId"
              value={formData.esicId}
              onChange={handleChange}
              placeholder="ENTER ESIC ID *"
              className={styles.input}
              required
            />
          </div>

          {/* Row 3 */}
          <div className={`${styles.field} ${styles.fieldAddress}`}>
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
              {ADDRESS_TEMPLATES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={`${styles.field} ${styles.fieldPostOffice}`}>
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

          <div className={`${styles.field} ${styles.fieldDist}`}>
            <label className={styles.label}>
              Dist <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="district"
              value={formData.district}
              onChange={handleChange}
              placeholder="ENTER DIST *"
              className={`${styles.input} ${styles.disabledInput}`}
              readOnly
              required
            />
          </div>

          {/* Row 4 */}
          <div className={`${styles.field} ${styles.fieldPincode}`}>
            <label className={styles.label}>
              Pincode <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="ENTER PIN *"
              className={`${styles.input} ${styles.disabledInput}`}
              readOnly
              required
            />
          </div>

          <div className={`${styles.field} ${styles.fieldPan}`}>
            <label className={styles.label}>
              PAN <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="pan"
              value={formData.pan}
              onChange={handleChange}
              placeholder="ENTER PAN *"
              className={styles.input}
              required
            />
          </div>

          <div className={`${styles.field} ${styles.fieldTan}`}>
            <label className={styles.label}>
              TAN <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="tan"
              value={formData.tan}
              onChange={handleChange}
              placeholder="ENTER TAN *"
              className={styles.input}
              required
            />
          </div>

          <div className={`${styles.field} ${styles.fieldPtax}`}>
            <label className={styles.label}>
              P. Tax <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="ptax"
              value={formData.ptax}
              onChange={handleChange}
              placeholder="ENTER P. TAX *"
              className={styles.input}
              required
            />
          </div>

          {/* Row 5 */}
          <div className={`${styles.field} ${styles.fieldEmail}`}>
            <label className={styles.label}>
              Primary Email Id <span className={styles.required}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ENTER PRIMARY EMAIL ID *"
              className={styles.input}
              required
            />
          </div>

          <div className={`${styles.field} ${styles.fieldPhone}`}>
            <label className={styles.label}>
              Phone <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="ENTER PHONE *"
              className={styles.input}
              required
            />
          </div>

          <div className={`${styles.field} ${styles.fieldWebsite}`}>
            <label className={styles.label}>
              WebSite Name
            </label>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="ENTER WEBSITE NAME"
              className={styles.input}
            />
          </div>

        </div>

        <div className={styles.buttonGroup}>
          <button type="button" onClick={onCancel} className={styles.cancelBtn}>Cancel</button>
          <button type="submit" className={styles.saveBtn}>Save</button>
        </div>
      </form>
    </div>
  );
};

export default CompanyForm;
