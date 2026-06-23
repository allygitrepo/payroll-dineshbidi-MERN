import React, { useState, useEffect } from 'react';
import styles from './EmployeePage.module.css';
import { useToast } from '../../../../shared/components';
import { Plus, Trash2 } from 'lucide-react';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const RELATIONS = ['FATHER', 'MOTHER', 'HUSBAND', 'WIFE', 'SON', 'DAUGHTER', 'BROTHER', 'SISTER', 'OTHER'];
const MARITAL_STATUSES = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'];
const QUALIFICATIONS = ['UNDER MATRIC', 'MATRIC', 'INTERMEDIATE', 'GRADUATE', 'POST GRADUATE', 'DIPLOMA'];
const EMPLOYEE_TYPES = ['OFFICE STAFF', 'PACKING STAFF', 'BIDI ROLLER'];
const CONTRACTORS = ['SELF', 'CONTRACTOR A', 'CONTRACTOR B', 'CONTRACTOR C'];
const DOC_TYPES = ['AADHAAR', 'PAN', 'UAN', 'BANK PASSBOOK', 'VOTER ID'];

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

const EmployeeForm = ({ employee, onSave, onCancel }) => {
  const addToast = useToast();
  const [activeTab, setActiveTab] = useState('Personal Info');
  const [errors, setErrors] = useState({});

  // Form Fields State
  const [formData, setFormData] = useState({
    id: '',
    abryApplicable: false,
    uan: '',
    ipNumber: '',
    memberId: '',
    memberName: '',
    dob: '',
    dateOfJoining: '',
    aadhaarCard: '',
    gender: '',
    fatherHusbandName: '',
    relation: '',
    maritalStatus: '',
    mobile: '',
    qualification: '',
    employeeType: '',
    contractor: '',
    address: '',
    postOffice: '',
    district: '',
    pincode: '',
    nationality: 'INDIAN',
    email: '',
    isInternationalWorker: 'NO',
    physicalHandicap: 'NO',
    pmrpy: 'NO',
    employeeImage: '',
    kycDetails: [],
    nomineeDetails: [],
    familyDetails: []
  });

  // Local Inputs State for nested records addition
  const [kycInput, setKycInput] = useState({
    documentType: '',
    documentNumber: '',
    nameAsPerDocument: '',
    ifsc: '',
    kycImage: ''
  });

  const [nomineeInput, setNomineeInput] = useState({
    name: '',
    address: '',
    postOffice: '',
    district: '',
    pincode: '',
    aadhaarNumber: '',
    relation: '',
    dob: '',
    sharePercentage: '',
    guardianName: '',
    guardianAddress: ''
  });

  const [familyInput, setFamilyInput] = useState({
    relation: '',
    name: '',
    dob: '',
    aadhaarNumber: ''
  });

  // Sync edit mode
  useEffect(() => {
    setErrors({});
    if (employee) {
      setFormData({
        ...employee,
        kycDetails: employee.kycDetails || [],
        nomineeDetails: employee.nomineeDetails || [],
        familyDetails: employee.familyDetails || []
      });
    } else {
      setFormData({
        id: '',
        abryApplicable: false,
        uan: '',
        ipNumber: '',
        memberId: '',
        memberName: '',
        dob: '',
        dateOfJoining: '',
        aadhaarCard: '',
        gender: '',
        fatherHusbandName: '',
        relation: '',
        maritalStatus: '',
        mobile: '',
        qualification: '',
        employeeType: '',
        contractor: '',
        address: '',
        postOffice: '',
        district: '',
        pincode: '',
        nationality: 'INDIAN',
        email: '',
        isInternationalWorker: 'NO',
        physicalHandicap: 'NO',
        pmrpy: 'NO',
        employeeImage: '',
        kycDetails: [],
        nomineeDetails: [],
        familyDetails: []
      });
    }
  }, [employee]);

  // Main handlers
  const validateField = (name, value) => {
    if (name === 'uan') {
      if (!value.trim()) return 'UAN is required!';
      const uanRegex = /^[0-9]{12}$/;
      return !uanRegex.test(value) ? 'UAN must be exactly 12 digits!' : '';
    }
    if (name === 'ipNumber') {
      if (!value.trim()) return 'IP Number is required!';
      const ipRegex = /^[0-9]{10}$/;
      return !ipRegex.test(value) ? 'IP Number must be exactly 10 digits!' : '';
    }
    if (name === 'memberName') {
      return !value.trim() ? 'Employee Name is required!' : '';
    }
    if (name === 'gender') {
      return !value ? 'Gender is required!' : '';
    }
    if (name === 'dateOfJoining') {
      return !value ? 'Date Of Joining is required!' : '';
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
    if (name === 'employeeType') {
      return !value ? 'Type of Employee is required!' : '';
    }
    if (name === 'email') {
      if (value && value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Invalid Email Address Format' : '';
      }
      return '';
    }
    if (name === 'mobile') {
      if (!value.trim()) return 'Mobile is required!';
      const mobileRegex = /^[0-9]{10}$/;
      return !mobileRegex.test(value) ? 'Mobile must be exactly 10 digits' : '';
    }
    if (name === 'aadhaarCard') {
      if (!value || !value.trim()) return 'Aadhar Card Number is required!';
      const aadhaarRegex = /^[0-9]{12}$/;
      return !aadhaarRegex.test(value) ? 'Aadhar Card Number must be exactly 12 digits!' : '';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;

    if (name === 'uan') {
      finalValue = value.replace(/\D/g, '').slice(0, 12);
    } else if (name === 'ipNumber') {
      finalValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'mobile') {
      finalValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'aadhaarCard') {
      finalValue = value.replace(/\D/g, '').slice(0, 12);
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
    setErrors((prev) => {
      const next = { ...prev };
      delete next.address;
      delete next.postOffice;
      delete next.district;
      delete next.pincode;
      return next;
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        employeeImage: e.target.files[0].name
      }));
    }
  };

  // KYC Helpers
  const handleKycInputChange = (e) => {
    const { name, value } = e.target;
    setKycInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleKycFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setKycInput((prev) => ({ ...prev, kycImage: e.target.files[0].name }));
    }
  };

  const addKycDetail = () => {
    if (!kycInput.documentType) {
      addToast({ type: 'warning', message: 'Select Document Type first' });
      return;
    }
    if (!kycInput.documentNumber.trim()) {
      addToast({ type: 'warning', message: 'Document Number is required' });
      return;
    }
    if (!kycInput.nameAsPerDocument.trim()) {
      addToast({ type: 'warning', message: 'Name as per document is required' });
      return;
    }
    if (kycInput.documentType === 'BANK PASSBOOK' && !kycInput.ifsc.trim()) {
      addToast({ type: 'warning', message: 'IFSC is required for Bank Passbook' });
      return;
    }

    const newKyc = {
      ...kycInput,
      id: 'k_' + Date.now()
    };
    setFormData((prev) => ({
      ...prev,
      kycDetails: [...prev.kycDetails, newKyc]
    }));
    setKycInput({
      documentType: '',
      documentNumber: '',
      nameAsPerDocument: '',
      ifsc: '',
      kycImage: ''
    });
    addToast({ type: 'success', message: 'KYC Document added to local list' });
  };

  const removeKycDetail = (id) => {
    setFormData((prev) => ({
      ...prev,
      kycDetails: prev.kycDetails.filter((item) => item.id !== id)
    }));
    addToast({ type: 'info', message: 'KYC Document removed' });
  };

  // Nominee Helpers
  const handleNomineeInputChange = (e) => {
    const { name, value } = e.target;
    setNomineeInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleNomineeAddressChange = (e) => {
    const val = e.target.value;
    const template = ADDRESS_TEMPLATES.find((t) => t.value === val);
    if (template) {
      setNomineeInput((prev) => ({
        ...prev,
        address: val,
        postOffice: template.postOffice,
        district: template.district,
        pincode: template.pincode
      }));
    } else {
      setNomineeInput((prev) => ({ ...prev, address: val }));
    }
  };

  const addNomineeDetail = () => {
    if (!nomineeInput.name.trim()) {
      addToast({ type: 'warning', message: 'Nominee Name is required' });
      return;
    }
    if (!nomineeInput.address) {
      addToast({ type: 'warning', message: 'Nominee Address is required' });
      return;
    }
    if (!nomineeInput.aadhaarNumber.trim()) {
      addToast({ type: 'warning', message: 'Nominee Aadhaar is required' });
      return;
    }
    if (!nomineeInput.relation) {
      addToast({ type: 'warning', message: 'Select Nominee Relation' });
      return;
    }
    if (!nomineeInput.sharePercentage || isNaN(nomineeInput.sharePercentage)) {
      addToast({ type: 'warning', message: 'Enter valid share percentage' });
      return;
    }

    const newNominee = {
      ...nomineeInput,
      id: 'n_' + Date.now()
    };
    setFormData((prev) => ({
      ...prev,
      nomineeDetails: [...prev.nomineeDetails, newNominee]
    }));
    setNomineeInput({
      name: '',
      address: '',
      postOffice: '',
      district: '',
      pincode: '',
      aadhaarNumber: '',
      relation: '',
      dob: '',
      sharePercentage: '',
      guardianName: '',
      guardianAddress: ''
    });
    addToast({ type: 'success', message: 'Nominee added to local list' });
  };

  const removeNomineeDetail = (id) => {
    setFormData((prev) => ({
      ...prev,
      nomineeDetails: prev.nomineeDetails.filter((item) => item.id !== id)
    }));
    addToast({ type: 'info', message: 'Nominee removed' });
  };

  // Family Helpers
  const handleFamilyInputChange = (e) => {
    const { name, value } = e.target;
    setFamilyInput((prev) => ({ ...prev, [name]: value }));
  };

  const addFamilyDetail = () => {
    if (!familyInput.relation) {
      addToast({ type: 'warning', message: 'Select Relation first' });
      return;
    }
    if (!familyInput.name.trim()) {
      addToast({ type: 'warning', message: 'Family Member Name is required' });
      return;
    }
    if (!familyInput.aadhaarNumber.trim() || familyInput.aadhaarNumber.length !== 12) {
      addToast({ type: 'warning', message: 'Aadhaar Card number must be 12 digits' });
      return;
    }

    const newFamily = {
      ...familyInput,
      id: 'f_' + Date.now()
    };
    setFormData((prev) => ({
      ...prev,
      familyDetails: [...prev.familyDetails, newFamily]
    }));
    setFamilyInput({
      relation: '',
      name: '',
      dob: '',
      aadhaarNumber: ''
    });
    addToast({ type: 'success', message: 'Family member added to local list' });
  };

  const removeFamilyDetail = (id) => {
    setFormData((prev) => ({
      ...prev,
      familyDetails: prev.familyDetails.filter((item) => item.id !== id)
    }));
    addToast({ type: 'info', message: 'Family member removed' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const tempErrors = {};
    const keysToValidate = [
      'uan', 'ipNumber', 'memberName', 'gender', 'dateOfJoining', 
      'address', 'postOffice', 'district', 'pincode', 'email', 'mobile', 'aadhaarCard'
    ];

    keysToValidate.forEach((key) => {
      const error = validateField(key, formData[key] || '');
      if (error) {
        tempErrors[key] = error;
      }
    });

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      // Switch to Personal Info tab if there are errors there
      const personalFields = ['uan', 'ipNumber', 'memberName', 'gender', 'dateOfJoining', 'address', 'postOffice', 'district', 'pincode', 'email', 'mobile', 'aadhaarCard'];
      const hasPersonalError = Object.keys(tempErrors).some(k => personalFields.includes(k));
      if (hasPersonalError) {
        setActiveTab('Personal Info');
      }
      addToast({ type: 'error', message: 'Please correct the errors in the form.' });
      return;
    }

    onSave(formData);
  };

  return (
    <div className={styles.formCard}>
      {/* Tabs Menu */}
      <div className={styles.tabsList}>
        {['Personal Info', 'KYC Detail', 'Nominee Details', 'Family Members Details'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.tabButton} ${activeTab === tab ? styles.activeTabButton : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* TAB 1: Personal Info */}
        {activeTab === 'Personal Info' && (
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Select Employee Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={styles.input}
              />
              {formData.employeeImage && (
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                  Selected: {formData.employeeImage}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                UAN <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="uan"
                value={formData.uan}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="ENTER UAN NO"
                maxLength={12}
                className={styles.input}
                required
              />
              {errors.uan && <span className={styles.errorText}>{errors.uan}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                IP Number <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="ipNumber"
                value={formData.ipNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="ENTER IP NUMBER"
                maxLength={10}
                className={styles.input}
                required
              />
              {errors.ipNumber && <span className={styles.errorText}>{errors.ipNumber}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Member Id</label>
              <input
                type="text"
                name="memberId"
                value={formData.memberId}
                onChange={handleChange}
                placeholder="ENTER MEMBER ID"
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Name (as Per Aadhar) <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="memberName"
                value={formData.memberName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="ENTER NAME (AS PER AADHAR)"
                className={styles.input}
                required
              />
              {errors.memberName && <span className={styles.errorText}>{errors.memberName}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Date Of Birth As Per Aadhaar</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Aadhar Card Number <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="aadhaarCard"
                value={formData.aadhaarCard || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="AADHAR CARD NUMBER"
                maxLength={12}
                className={styles.input}
              />
              {errors.aadhaarCard && <span className={styles.errorText}>{errors.aadhaarCard}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Gender <span className={styles.required}>*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                onBlur={handleBlur}
                className={styles.select}
                required
              >
                <option value="" disabled>SELECT</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              {errors.gender && <span className={styles.errorText}>{errors.gender}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Father's/Husband's Name</label>
              <input
                type="text"
                name="fatherHusbandName"
                value={formData.fatherHusbandName}
                onChange={handleChange}
                placeholder="ENTER FATHER'S/HUSBAND'S NAME"
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Relation</label>
              <select
                name="relation"
                value={formData.relation}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="">SELECT RELATION</option>
                {RELATIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Marital Status</label>
              <select
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="">SELECT MARITAL STATUS</option>
                {MARITAL_STATUSES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Mobile <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="ENTER MOBILE"
                maxLength={10}
                className={styles.input}
                required
              />
              {errors.mobile && <span className={styles.errorText}>{errors.mobile}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Qualification</label>
              <select
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="">SELECT QUALIFICATION</option>
                {QUALIFICATIONS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

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
                required
              />
              {errors.dateOfJoining && <span className={styles.errorText}>{errors.dateOfJoining}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Type of Employee <span className={styles.required}>*</span>
              </label>
              <select
                name="employeeType"
                value={formData.employeeType}
                onChange={handleChange}
                onBlur={handleBlur}
                className={styles.select}
                required
              >
                <option value="" disabled>SELECT TYPE OF EMPLOYEE</option>
                {EMPLOYEE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.employeeType && <span className={styles.errorText}>{errors.employeeType}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Contractor</label>
              <select
                name="contractor"
                value={formData.contractor}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="">SELECT CONTRACTOR</option>
                {CONTRACTORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

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
                required
              >
                <option value="" disabled>SELECT ADDRESS</option>
                {ADDRESS_TEMPLATES.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.address && <span className={styles.errorText}>{errors.address}</span>}
            </div>

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
                placeholder="ENTER POST OFFICE"
                className={styles.input}
                required
              />
              {errors.postOffice && <span className={styles.errorText}>{errors.postOffice}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Dist <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder="ENTER DIST"
                className={`${styles.input} ${styles.disabledInput}`}
                readOnly
                required
              />
              {errors.district && <span className={styles.errorText}>{errors.district}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Pincode <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="ENTER PIN"
                className={`${styles.input} ${styles.disabledInput}`}
                readOnly
                required
              />
              {errors.pincode && <span className={styles.errorText}>{errors.pincode}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Nationality</label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email Id</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="ENTER EMAIL"
                className={styles.input}
              />
              {errors.email && <span className={styles.errorText}>{errors.email}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Is International Worker</label>
              <select
                name="isInternationalWorker"
                value={formData.isInternationalWorker}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="NO">NO</option>
                <option value="YES">YES</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Physical Handicap</label>
              <select
                name="physicalHandicap"
                value={formData.physicalHandicap}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="NO">NO</option>
                <option value="YES">YES</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>PMRPY ?</label>
              <select
                name="pmrpy"
                value={formData.pmrpy}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="NO">NO</option>
                <option value="YES">YES</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 2: KYC Detail */}
        {activeTab === 'KYC Detail' && (
          <div>
            <div className={styles.inlineRow}>
              <div className={styles.inlineField}>
                <label className={styles.label}>Document Type *</label>
                <select
                  name="documentType"
                  value={kycInput.documentType}
                  onChange={handleKycInputChange}
                  className={styles.select}
                >
                  <option value="">SELECT</option>
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className={styles.inlineField}>
                <label className={styles.label}>Document Number *</label>
                <input
                  type="text"
                  name="documentNumber"
                  value={kycInput.documentNumber}
                  onChange={handleKycInputChange}
                  placeholder="ENTER DOCUMENT NUMBER"
                  className={styles.input}
                />
              </div>

              <div className={styles.inlineField}>
                <label className={styles.label}>Name as Per Document *</label>
                <input
                  type="text"
                  name="nameAsPerDocument"
                  value={kycInput.nameAsPerDocument}
                  onChange={handleKycInputChange}
                  placeholder="ENTER NAME AS PER DOCUMENT"
                  className={styles.input}
                />
              </div>

              <div className={styles.inlineField}>
                <label className={styles.label}>IFSC *</label>
                <input
                  type="text"
                  name="ifsc"
                  value={kycInput.ifsc}
                  onChange={handleKycInputChange}
                  placeholder="ENTER IFSC"
                  className={styles.input}
                />
              </div>

              <div className={styles.inlineField}>
                <label className={styles.label}>Select KYC Image:</label>
                <input
                  type="file"
                  onChange={handleKycFileChange}
                  className={styles.input}
                />
              </div>

              <button
                type="button"
                className={styles.addButton}
                onClick={addKycDetail}
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Sub-grid Table */}
            <div className={styles.subTableContainer}>
              <table className={styles.subTable}>
                <thead>
                  <tr>
                    <th>Document Type</th>
                    <th>Document No.</th>
                    <th>Name as Per Document</th>
                    <th>IFSC</th>
                    <th>Kyc Image Name</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.kycDetails.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No records added yet.
                      </td>
                    </tr>
                  ) : (
                    formData.kycDetails.map((item) => (
                      <tr key={item.id}>
                        <td>{item.documentType}</td>
                        <td>{item.documentNumber}</td>
                        <td>{item.nameAsPerDocument}</td>
                        <td>{item.ifsc || '-'}</td>
                        <td>{item.kycImage || '-'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => removeKycDetail(item.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Nominee Details */}
        {activeTab === 'Nominee Details' && (
          <div>
            <div className={styles.formGrid} style={{ marginBottom: '20px' }}>
              <div className={styles.field}>
                <label className={styles.label}>Name</label>
                <input
                  type="text"
                  name="name"
                  value={nomineeInput.name}
                  onChange={handleNomineeInputChange}
                  placeholder="ENTER NAME"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Address *</label>
                <select
                  name="address"
                  value={nomineeInput.address}
                  onChange={handleNomineeAddressChange}
                  className={styles.select}
                >
                  <option value="">SELECT ADDRESS</option>
                  {ADDRESS_TEMPLATES.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Post Office *</label>
                <input
                  type="text"
                  name="postOffice"
                  value={nomineeInput.postOffice}
                  onChange={handleNomineeInputChange}
                  placeholder="ENTER POST OFFICE"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>District *</label>
                <input
                  type="text"
                  name="district"
                  value={nomineeInput.district}
                  readOnly
                  placeholder="ENTER DISTRICT"
                  className={`${styles.input} ${styles.disabledInput}`}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  value={nomineeInput.pincode}
                  readOnly
                  placeholder="ENTER PINCODE"
                  className={`${styles.input} ${styles.disabledInput}`}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Aadhaar Card Number *</label>
                <input
                  type="text"
                  name="aadhaarNumber"
                  value={nomineeInput.aadhaarNumber}
                  onChange={handleNomineeInputChange}
                  placeholder="AADHAR CARD NUMBER"
                  maxLength={12}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Relation</label>
                <select
                  name="relation"
                  value={nomineeInput.relation}
                  onChange={handleNomineeInputChange}
                  className={styles.select}
                >
                  <option value="">SELECT RELATION</option>
                  {RELATIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>DOB (as Per Aadhar)</label>
                <input
                  type="date"
                  name="dob"
                  value={nomineeInput.dob}
                  onChange={handleNomineeInputChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>% of Share</label>
                <input
                  type="text"
                  name="sharePercentage"
                  value={nomineeInput.sharePercentage}
                  onChange={handleNomineeInputChange}
                  placeholder="ENTER % OF SHARE"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Guardian Name</label>
                <input
                  type="text"
                  name="guardianName"
                  value={nomineeInput.guardianName}
                  onChange={handleNomineeInputChange}
                  placeholder="ENTER GUARDIAN NAME"
                  className={styles.input}
                />
              </div>

              <div className={styles.fieldHalf}>
                <label className={styles.label}>Guardian Address</label>
                <input
                  type="text"
                  name="guardianAddress"
                  value={nomineeInput.guardianAddress}
                  onChange={handleNomineeInputChange}
                  placeholder="ENTER GUARDIAN ADDRESS"
                  className={styles.input}
                />
              </div>

              <div className={styles.field} style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={addNomineeDetail}
                  style={{ width: '40px' }}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Sub-grid Table */}
            <div className={styles.subTableContainer}>
              <table className={styles.subTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Postoffice</th>
                    <th>District</th>
                    <th>Pincode</th>
                    <th>Aadhaar Card No.</th>
                    <th>Relation</th>
                    <th>DOB</th>
                    <th>% of Share</th>
                    <th>Guardian Name</th>
                    <th>Guardian Address</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.nomineeDetails.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No nominees added yet.
                      </td>
                    </tr>
                  ) : (
                    formData.nomineeDetails.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.address}</td>
                        <td>{item.postOffice}</td>
                        <td>{item.district}</td>
                        <td>{item.pincode}</td>
                        <td>{item.aadhaarNumber}</td>
                        <td>{item.relation}</td>
                        <td>{item.dob || '-'}</td>
                        <td>{item.sharePercentage}%</td>
                        <td>{item.guardianName || '-'}</td>
                        <td>{item.guardianAddress || '-'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => removeNomineeDetail(item.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Family Members Details */}
        {activeTab === 'Family Members Details' && (
          <div>
            <div className={styles.inlineRow}>
              <div className={styles.inlineField}>
                <label className={styles.label}>Relation</label>
                <select
                  name="relation"
                  value={familyInput.relation}
                  onChange={handleFamilyInputChange}
                  className={styles.select}
                >
                  <option value="">SELECT RELATION</option>
                  {RELATIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className={styles.inlineField}>
                <label className={styles.label}>Name</label>
                <input
                  type="text"
                  name="name"
                  value={familyInput.name}
                  onChange={handleFamilyInputChange}
                  placeholder="ENTER NAME"
                  className={styles.input}
                />
              </div>

              <div className={styles.inlineField}>
                <label className={styles.label}>DOB (as Per Aadhar)</label>
                <input
                  type="date"
                  name="dob"
                  value={familyInput.dob}
                  onChange={handleFamilyInputChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.inlineField}>
                <label className={styles.label}>Aadhaar Card Number *</label>
                <input
                  type="text"
                  name="aadhaarNumber"
                  value={familyInput.aadhaarNumber}
                  onChange={handleFamilyInputChange}
                  placeholder="AADHAR CARD NUMBER"
                  maxLength={12}
                  className={styles.input}
                />
              </div>

              <button
                type="button"
                className={styles.addButton}
                onClick={addFamilyDetail}
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Sub-grid Table */}
            <div className={styles.subTableContainer}>
              <table className={styles.subTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>DOB As Per Aadhar</th>
                    <th>Relation</th>
                    <th>Aadhaar No.</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.familyDetails.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No family members added yet.
                      </td>
                    </tr>
                  ) : (
                    formData.familyDetails.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.dob || '-'}</td>
                        <td>{item.relation}</td>
                        <td>{item.aadhaarNumber}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => removeFamilyDetail(item.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Buttons right-aligned */}
        <div className={styles.buttonGroup}>
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

export default EmployeeForm;
