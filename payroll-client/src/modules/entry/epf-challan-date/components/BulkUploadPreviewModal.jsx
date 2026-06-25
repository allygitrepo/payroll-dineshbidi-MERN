import React from 'react';
import styles from './BulkUploadPreviewModal.module.css';

const BulkUploadPreviewModal = ({ isOpen, data, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Bulk Upload Preview</h2>
          <button className={styles.closeBtn} onClick={onCancel}>&times;</button>
        </div>
        
        <div className={styles.content}>
          <p className={styles.infoText}>
            You are about to upload {data.length} EPF Challan records. Please review the data below before confirming.
          </p>
          
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>SR No.</th>
                  <th>TRRN</th>
                  <th>CRN No</th>
                  <th>Wage Month</th>
                  <th>Due Date</th>
                  <th>Challan Date</th>
                  <th>A/C 1 (EE)</th>
                  <th>A/C 1 (ER)</th>
                  <th>A/C 2</th>
                  <th>A/C 10</th>
                  <th>A/C 21</th>
                  <th>A/C 22</th>
                  <th>Total Amount</th>
                  <th>Return Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.trrn || '-'}</td>
                    <td>{item.crnNo || '-'}</td>
                    <td>{item.wageMonth || '-'}</td>
                    <td>{item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-GB') : '-'}</td>
                    <td>{item.challanDate ? new Date(item.challanDate).toLocaleDateString('en-GB') : '-'}</td>
                    <td>{item.ac1EE || 0}</td>
                    <td>{item.ac1ER || 0}</td>
                    <td>{item.ac2 || 0}</td>
                    <td>{item.ac10 || 0}</td>
                    <td>{item.ac21 || 0}</td>
                    <td>{item.ac22 || 0}</td>
                    <td>{item.totalAmount || 0}</td>
                    <td>{item.returnDate ? new Date(item.returnDate).toLocaleDateString('en-GB') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button className={styles.confirmBtn} onClick={onConfirm}>Confirm Upload</button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadPreviewModal;
