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

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setErrors({});
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

  const validateField = (name, value) => {
    if (name === 'estbId') {
      return !value.trim() ? 'Estb ID is required!' : '';
    }
    if (name === 'estbName') {
      return !value.trim() ? 'Establishment Name is required!' : '';
    }
    if (name === 'estbType') {
      return !value ? 'Establishment Type is required!' : '';
    }
    if (name === 'epfoOffice') {
      return !value.trim() ? 'Under EPFO Office is required!' : '';
    }
    if (name === 'linNo') {
      return '';
    }
    if (name === 'esicId') {
      return '';
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
    if (name === 'pan') {
      return !value.trim() ? 'PAN is required!' : '';
    }
    if (name === 'tan') {
      return !value.trim() ? 'TAN is required!' : '';
    }
    if (name === 'ptax') {
      return '';
    }
    if (name === 'email') {
      return !value.trim() ? 'Primary Email Id is required!' : '';
    }
    if (name === 'phone') {
      return !value.trim() ? 'Phone is required!' : '';
    }
    if (name === 'website') {
      return '';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'pan' || name === 'tan') {
      finalValue = value.toUpperCase();
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue
    }));

    const error = validateField(name, finalValue);
    setErrors((prev) => ({
      ...prev,
      [name]: error
    }));
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
    setErrors((prev) => {
      const next = { ...prev };
      delete next.address;
      delete next.postOffice;
      delete next.district;
      delete next.pincode;
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const tempErrors = {};
    Object.keys(formData).forEach((key) => {
      if (key !== 'id') {
        const error = validateField(key, formData[key]);
        if (error) {
          tempErrors[key] = error;
        }
      }
    });

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      addToast({ type: 'error', message: 'Please correct the errors in the form.' });
      return;
    }

    onSave(formData);
  };

  return (
    <div className={styles.formCard}>
      <form onSubmit={handleSubmit} noValidate>
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
              onBlur={handleBlur}
              placeholder="ENTER ESTB ID *"
              className={styles.input}
              required
            />
            {errors.estbId && <span className={styles.errorText}>{errors.estbId}</span>}
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
              onBlur={handleBlur}
              placeholder="ENTER ESTABLISHMENT NAME *"
              className={styles.input}
              required
            />
            {errors.estbName && <span className={styles.errorText}>{errors.estbName}</span>}
          </div>

          <div className={`${styles.field} ${styles.fieldEstbType}`}>
            <label className={styles.label}>
              Establishment Type <span className={styles.required}>*</span>
            </label>
            <select
              name="estbType"
              value={formData.estbType}
              onChange={handleChange}
              onBlur={handleBlur}
              className={styles.select}
              required
            >
              <option value="" disabled>SELECT</option>
              {ESTB_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.estbType && <span className={styles.errorText}>{errors.estbType}</span>}
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
              onBlur={handleBlur}
              placeholder="ENTER UNDER EPFO OFFICE *"
              className={styles.input}
              required
            />
            {errors.epfoOffice && <span className={styles.errorText}>{errors.epfoOffice}</span>}
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
              onBlur={handleBlur}
              placeholder="ENTER LIN NO. *"
              className={styles.input}
              maxLength={10}
              required
            />
            {errors.linNo && <span className={styles.errorText}>{errors.linNo}</span>}
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
              onBlur={handleBlur}
              placeholder="ENTER ESIC ID *"
              className={styles.input}
              maxLength={17}
              required
            />
            {errors.esicId && <span className={styles.errorText}>{errors.esicId}</span>}
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
              onBlur={handleBlur}
              className={styles.select}
              required
            >
              <option value="" disabled>SELECT ADDRESS</option>
              {ADDRESS_TEMPLATES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.address && <span className={styles.errorText}>{errors.address}</span>}
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
              onBlur={handleBlur}
              placeholder="ENTER POST OFFICE *"
              className={styles.input}
              required
            />
            {errors.postOffice && <span className={styles.errorText}>{errors.postOffice}</span>}
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
            {errors.district && <span className={styles.errorText}>{errors.district}</span>}
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
            {errors.pincode && <span className={styles.errorText}>{errors.pincode}</span>}
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
              onBlur={handleBlur}
              placeholder="ENTER PAN *"
              className={styles.input}
              maxLength={10}
              required
            />
            {errors.pan && <span className={styles.errorText}>{errors.pan}</span>}
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
              onBlur={handleBlur}
              placeholder="ENTER TAN *"
              className={styles.input}
              maxLength={10}
              required
            />
            {errors.tan && <span className={styles.errorText}>{errors.tan}</span>}
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
              onBlur={handleBlur}
              placeholder="ENTER P. TAX *"
              className={styles.input}
              required
            />
            {errors.ptax && <span className={styles.errorText}>{errors.ptax}</span>}
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
              onBlur={handleBlur}
              placeholder="ENTER PRIMARY EMAIL ID *"
              className={styles.input}
              required
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
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
              onBlur={handleBlur}
              placeholder="ENTER PHONE *"
              className={styles.input}
              maxLength={10}
              required
            />
            {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
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
              onBlur={handleBlur}
              placeholder="ENTER WEBSITE NAME"
              className={styles.input}
            />
            {errors.website && <span className={styles.errorText}>{errors.website}</span>}
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
