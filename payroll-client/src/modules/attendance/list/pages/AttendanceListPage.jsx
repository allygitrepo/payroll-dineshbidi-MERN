import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardList,
  Search,
  Plus,
  Camera,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Package,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import styles from './AttendanceListPage.module.css';

// Initial mock employees data (12 records to demonstrate pagination of max 10 records per page)
const initialEmployees = [
  { id: 1, empCode: 'EMP001', name: 'Dinesh Bidi', category: 'Bidi Roller Employee', contact: '9876543210', address: 'Bidi Colony, Sagar, MP', faceStatus: true },
  { id: 2, empCode: 'EMP002', name: 'Ramesh Patel', category: 'Office Employee', contact: '8765432109', address: 'Civil Lines, Jabalpur, MP', faceStatus: true },
  { id: 3, empCode: 'EMP003', name: 'Sunita Sharma', category: 'Packing Employee', contact: '7654321098', address: 'Industrial Area, Indore, MP', faceStatus: false },
  { id: 4, empCode: 'EMP004', name: 'Amit Kumar', category: 'Bidi Roller Employee', contact: '6543210987', address: 'Bidi Colony, Damoh, MP', faceStatus: false },
  { id: 5, empCode: 'EMP005', name: 'Priya Gupta', category: 'Office Employee', contact: '9123456789', address: 'Vijay Nagar, Indore, MP', faceStatus: true },
  { id: 6, empCode: 'EMP006', name: 'Rajesh Sen', category: 'Packing Employee', contact: '9234567890', address: 'Kotwali, Sagar, MP', faceStatus: false },
  { id: 7, empCode: 'EMP007', name: 'Karan Mehra', category: 'Bidi Roller Employee', contact: '9345678901', address: 'Bidi Colony, Damoh, MP', faceStatus: false },
  { id: 8, empCode: 'EMP008', name: 'Neha Verma', category: 'Office Employee', contact: '9456789012', address: 'Arera Colony, Bhopal, MP', faceStatus: true },
  { id: 9, empCode: 'EMP009', name: 'Vikram Singh', category: 'Packing Employee', contact: '9567890123', address: 'Malanpur, Gwalior, MP', faceStatus: false },
  { id: 10, empCode: 'EMP010', name: 'Anjali Das', category: 'Bidi Roller Employee', contact: '9678901234', address: 'Bidi Colony, Sagar, MP', faceStatus: true },
  { id: 11, empCode: 'EMP011', name: 'Sanjay Prasad', category: 'Bidi Roller Employee', contact: '9789012345', address: 'Cantt Road, Jabalpur, MP', faceStatus: false },
  { id: 12, empCode: 'EMP012', name: 'Gopal Sharma', category: 'Packing Employee', contact: '9890123456', address: 'New Colony, Guna, MP', faceStatus: false }
];

const AttendanceListPage = () => {
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); // default/max 10 records per page

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // Active records for Edit/Delete/Register
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Form inputs state
  const [formValues, setFormValues] = useState({
    name: '',
    category: 'Office Employee',
    contact: '',
    address: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Camera integration state
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isProcessingFace, setIsProcessingFace] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState('');

  // Auto-clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Handle Camera initialization
  useEffect(() => {
    if (isCameraModalOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCameraModalOpen]);

  const startCamera = async () => {
    setIsProcessingFace(false);
    setProcessingStep('');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCamera(true);
        setCameraError('');
      } catch (err) {
        console.error('Webcam stream error:', err);
        setHasCamera(false);
        setCameraError('Camera access denied or unavailable. Loading simulator.');
      }
    } else {
      setHasCamera(false);
      setCameraError('Webcam APIs are not supported in this browser. Loading simulator.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasCamera(false);
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.empCode.toLowerCase().includes(search.toLowerCase()) ||
      emp.category.toLowerCase().includes(search.toLowerCase()) ||
      emp.address.toLowerCase().includes(search.toLowerCase()) ||
      emp.contact.includes(search);
    const matchesCategory = categoryFilter === 'All' || emp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Reset pagination on search or category filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, rowsPerPage]);

  // Form input validation
  const validateForm = () => {
    const errors = {};
    if (!formValues.name.trim()) errors.name = 'Name is required';
    if (!formValues.contact.trim()) {
      errors.contact = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formValues.contact.trim())) {
      errors.contact = 'Contact must be a 10-digit number';
    }
    if (!formValues.address.trim()) errors.address = 'Address is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Add Employee submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const nextId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
    const formattedCode = `EMP${String(nextId).padStart(3, '0')}`;
    const newEmp = {
      id: nextId,
      empCode: formattedCode,
      name: formValues.name,
      category: formValues.category,
      contact: formValues.contact,
      address: formValues.address,
      faceStatus: false
    };

    setEmployees(prev => [newEmp, ...prev]);
    setIsAddModalOpen(false);
    setToastMessage(`Employee ${newEmp.name} added successfully!`);
    resetForm();
  };

  // Edit Employee submit
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setEmployees(prev =>
      prev.map(emp =>
        emp.id === selectedEmployee.id
          ? { ...emp, ...formValues }
          : emp
      )
    );
    setIsEditModalOpen(false);
    setToastMessage(`Employee ${formValues.name} updated successfully!`);
    resetForm();
  };

  // Delete Employee submit
  const handleDeleteSubmit = () => {
    setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployee.id));
    setIsDeleteModalOpen(false);
    setToastMessage(`Employee deleted successfully!`);
    setSelectedEmployee(null);
  };

  // Open Edit Modal
  const openEditModal = (emp) => {
    setSelectedEmployee(emp);
    setFormValues({
      name: emp.name,
      category: emp.category,
      contact: emp.contact,
      address: emp.address
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (emp) => {
    setSelectedEmployee(emp);
    setIsDeleteModalOpen(true);
  };

  // Open Camera Modal
  const openCameraModal = (emp) => {
    setSelectedEmployee(emp);
    setIsCameraModalOpen(true);
  };

  // Reset form inputs
  const resetForm = () => {
    setFormValues({
      name: '',
      category: 'Office Employee',
      contact: '',
      address: ''
    });
    setFormErrors({});
    setSelectedEmployee(null);
  };

  // Face scanner capture processing simulation
  const handleCaptureFace = () => {
    setIsProcessingFace(true);
    setProcessingStep('Initializing Face Scanner...');

    setTimeout(() => {
      setProcessingStep('Detecting face coordinates...');
      setTimeout(() => {
        setProcessingStep('Extracting biometrical landmarks...');
        setTimeout(() => {
          setProcessingStep('Securing face template...');
          setTimeout(() => {
            // Update status in employees state
            setEmployees(prev =>
              prev.map(emp =>
                emp.id === selectedEmployee.id
                  ? { ...emp, faceStatus: true }
                  : emp
              )
            );
            setIsCameraModalOpen(false);
            setToastMessage(`Face scan completed! Face registered for ${selectedEmployee.name}`);
            stopCamera();
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  return (
    <div className={styles.container}>
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className={styles.toast}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Page Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <ClipboardList size={24} />
          </div>
          <div>
            <h2 className={styles.headerTitle}>Attendence List</h2>
          </div>
        </div>
      </div>

      {/* Toolbar (Search, Filter and Entries count) */}
      <div className={styles.toolbar}>
        <div className={styles.rowsSelect}>
          <span className={styles.controlLabel}>Show</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>
          <span className={styles.controlLabel}>entries</span>
        </div>
        <div className={styles.rightControls}>
          <div className={styles.categorySelect}>
            <span className={styles.controlLabel}>Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Office Employee">Office Employee</option>
              <option value="Packing Employee">Packing Employee</option>
              <option value="Bidi Roller Employee">Bidi Roller Employee</option>
            </select>
          </div>
          <div className={styles.searchWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className={styles.tableResponsive}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>SR No.</th>
              <th>Emp Code</th>
              <th>Name</th>
              <th>Category</th>
              <th>Contact No.</th>
              <th>Address</th>
              <th>Face Registered</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.length > 0 ? (
              paginatedEmployees.map((emp, index) => {
                const srNo = (currentPage - 1) * rowsPerPage + index + 1;
                return (
                  <tr key={emp.id}>
                    <td className={styles.srCell}>{String(srNo).padStart(2, '0')}</td>
                    <td className={styles.monoCell}>{emp.empCode}</td>
                    <td className={styles.boldCell}>{emp.name}</td>
                    <td>{emp.category}</td>
                    <td>{emp.contact}</td>
                    <td>{emp.address}</td>
                    <td>
                      {emp.faceStatus ? (
                        <span className={styles.badgeRegistered}>
                          <CheckCircle2 size={12} /> Registered
                        </span>
                      ) : (
                        <span className={styles.badgeNotRegistered}>
                          <AlertCircle size={12} /> Not Registered
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={`${styles.actionBtn} ${styles.registerBtn}`}
                          onClick={() => openCameraModal(emp)}
                          title="Register Face Scan"
                        >
                          <Camera size={15} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, marginLeft: '4px' }}>
                            {emp.faceStatus ? 'Re-Scan' : 'Register'}
                          </span>
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.editBtn}`}
                          onClick={() => openEditModal(emp)}
                          title="Edit Details"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={() => openDeleteModal(emp)}
                          title="Delete Employee"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className={styles.emptyTable}>No employee records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className={styles.tableFooter}>
        <div className={styles.infoText}>
          Showing {filteredEmployees.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{' '}
          {Math.min(currentPage * rowsPerPage, filteredEmployees.length)} of {filteredEmployees.length} entries
        </div>
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={currentPage === p ? styles.activePage : ''}
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>



      {/* Modal - Edit Employee */}
      {isEditModalOpen && (
        <div className={styles.overlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Employee Details</h3>
              <button className={styles.closeBtn} onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Emp Code</label>
                  <input
                    type="text"
                    value={selectedEmployee?.empCode || ''}
                    className={styles.formInput}
                    disabled
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formValues.name}
                    onChange={handleInputChange}
                    className={styles.formInput}
                  />
                  {formErrors.name && <span className={styles.errorText}>{formErrors.name}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formValues.category}
                    onChange={handleInputChange}
                    className={styles.formSelect}
                  >
                    <option value="Office Employee">Office Employee</option>
                    <option value="Packing Employee">Packing Employee</option>
                    <option value="Bidi Roller Employee">Bidi Roller Employee</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="contact">Contact No.</label>
                  <input
                    type="text"
                    id="contact"
                    name="contact"
                    value={formValues.contact}
                    onChange={handleInputChange}
                    className={styles.formInput}
                  />
                  {formErrors.contact && <span className={styles.errorText}>{formErrors.contact}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formValues.address}
                    onChange={handleInputChange}
                    className={styles.formTextarea}
                  />
                  {formErrors.address && <span className={styles.errorText}>{formErrors.address}</span>}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Delete Employee Confirmation */}
      {isDeleteModalOpen && (
        <div className={styles.overlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Delete Employee</h3>
              <button className={styles.closeBtn} onClick={() => setIsDeleteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.deleteWarningText}>
                Are you sure you want to delete employee <strong>{selectedEmployee?.name}</strong> ({selectedEmployee?.empCode})?
                This action cannot be undone and will remove all their local attendance references.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondary} onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className={styles.btnDanger} onClick={handleDeleteSubmit}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Face Scanner Camera */}
      {isCameraModalOpen && (
        <div className={styles.overlay}>
          <div className={`${styles.modalContent} ${styles.modalLarge}`}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Face Scan Registration</h3>
              <button className={styles.closeBtn} onClick={() => setIsCameraModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.scannerContainer}>
                {/* Live stream or simulator block */}
                <div className={styles.videoWrapper}>
                  <video
                    ref={videoRef}
                    className={styles.videoFeed}
                    style={{ display: hasCamera ? 'block' : 'none' }}
                    autoPlay
                    playsInline
                    muted
                  />
                  {!hasCamera && (
                    <div className={styles.mockCameraFeed}>
                      <Camera size={48} className={styles.mockCameraIcon} />
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Simulated Video Stream</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7, padding: '0 24px' }}>
                        {cameraError || 'Loading simulated camera stream for verification...'}
                      </div>
                    </div>
                  )}

                  {/* Scanning box structure overlays */}
                  <div className={styles.scannerOverlay}>
                    <div className={styles.scannerTargetBox}>
                      <div className={styles.scannerLine} />
                    </div>
                  </div>

                  {/* Bottom blinking registration state */}
                  <div className={styles.scannerStatusText}>
                    <div className={styles.statusDot} />
                    <span>{isProcessingFace ? 'PROCESSING...' : 'CAMERA ACTIVE'}</span>
                  </div>
                </div>

                <div className={styles.scannerInstructions}>
                  {isProcessingFace ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{processingStep}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Keep face still inside the box</div>
                    </div>
                  ) : (
                    <>
                      Registering face for <strong>{selectedEmployee?.name}</strong> ({selectedEmployee?.empCode}).<br />
                      <span>Position the employee face squarely within the dashed circular frame.</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setIsCameraModalOpen(false)}
                disabled={isProcessingFace}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleCaptureFace}
                disabled={isProcessingFace}
              >
                {isProcessingFace ? 'Scanning...' : hasCamera ? 'Capture & Register' : 'Simulate Capture'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceListPage;
