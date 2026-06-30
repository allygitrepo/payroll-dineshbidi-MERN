import React, { useState, useEffect } from 'react';
import styles from './LoanPage.module.css';
import { getLoanTransactions } from '../services/loanService';
import { useToast } from '../../../shared/components';

const LoanTable = ({ loanId }) => {
  const addToast = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await getLoanTransactions(loanId);
        setTransactions(data);
      } catch (err) {
        console.error('Error fetching loan transactions:', err);
        addToast({ type: 'error', message: 'Failed to load transaction history.' });
      } finally {
        setLoading(false);
      }
    };
    if (loanId) {
      fetchTransactions();
    }
  }, [loanId, addToast]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
        Loading repayment history...
      </div>
    );
  }

  return (
    <div style={{ marginTop: '12px' }}>
      <div className={styles.transactionsHeader}>
        <h4 className={styles.transactionsTitle}>Repayment History Log</h4>
      </div>
      <div className={styles.tableContainer} style={{ marginTop: '10px' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction Type</th>
              <th>Source</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.noDataText}>
                  No repayment transactions recorded yet for this loan.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    {tx.transactionDate ? new Date(tx.transactionDate).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </td>
                  <td>
                    <span style={{
                      fontWeight: '600',
                      color: tx.type === 'Auto_Deduction' ? 'var(--primary)' : '#4f8cff'
                    }}>
                      {tx.type === 'Auto_Deduction' ? 'AUTO DEDUCTION' : 'MANUAL PAYMENT'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      backgroundColor: '#f1f5f9',
                      color: '#475569'
                    }}>
                      {tx.paymentSource ? tx.paymentSource.toUpperCase() : '-'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>
                    ₹{parseFloat(tx.amount).toFixed(2)}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {tx.description || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoanTable;
