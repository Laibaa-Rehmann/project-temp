// ContractDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ContractDashboard.css';

const ContractDashboard = () => {
  const [contractData, setContractData] = useState({
    clientName: 'Unknown Client',
    role: 'Contractor',
    paidAmount: 2000,
    totalValue: 5500,
    hourlyRate: 55,
    weeklyHours: 15,
    startDate: '2025-11-30',
    endDate: '2026-01-01',
    progress: 36,
    pendingAmount: 3500,
    contractId: null,
    invoiceId: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // FastAPI backend base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Fetch contract data from backend
  useEffect(() => {
    fetchContractData();
  }, []);

  const fetchContractData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/contracts/current`);
      setContractData(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching contract data:', err);
      setError('Failed to load contract data');
    } finally {
      setLoading(false);
    }
  };

  // Function to view contract
  const handleViewContract = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Request contract from backend
      const response = await axios.get(`${API_BASE_URL}/api/contracts/view`, {
        responseType: 'blob',
        params: { contract_id: contractData.contractId }
      });
      
      // Create a blob URL and open in new tab
      const fileBlob = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(fileBlob);
      window.open(fileURL, '_blank');
      
      setSuccess('Contract opened successfully');
      
      // Clean up URL object after use
      setTimeout(() => URL.revokeObjectURL(fileURL), 100);
    } catch (err) {
      console.error('Error viewing contract:', err);
      setError('Failed to view contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to download invoice
  const handleDownloadInvoice = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Request invoice from backend
      const response = await axios.get(`${API_BASE_URL}/api/invoices/download`, {
        responseType: 'blob',
        params: { invoice_id: contractData.invoiceId }
      });
      
      // Extract filename from headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'invoice.pdf';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      // Create download link
      const fileBlob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/pdf' 
      });
      const fileURL = URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(fileURL);
      setSuccess('Invoice downloaded successfully');
    } catch (err) {
      console.error('Error downloading invoice:', err);
      setError('Failed to download invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to request payment
  const handleRequestPayment = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/payments/request`, {
        contract_id: contractData.contractId,
        amount: contractData.pendingAmount
      });
      
      setSuccess(response.data.message || 'Payment request sent successfully');
      // Refresh contract data
      fetchContractData();
    } catch (err) {
      console.error('Error requesting payment:', err);
      setError('Failed to send payment request');
    } finally {
      setLoading(false);
    }
  };

  // Function to message client
  const handleMessageClient = () => {
    // This could open a messaging modal or redirect to a messaging page
    setSuccess('Opening messaging interface...');
    // In a real implementation, you would integrate with your messaging system
  };

  // Calculate remaining hours
  const calculateRemainingHours = () => {
    const totalHours = contractData.totalValue / contractData.hourlyRate;
    const completedHours = totalHours * (contractData.progress / 100);
    return Math.round(totalHours - completedHours);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading contract data...</p>
      </div>
    );
  }

  return (
    <div className="contract-dashboard">
      <header className="dashboard-header">
        <h1><i className="fas fa-database"></i> Database Optimization</h1>
        <div className="client-info">
          <span className="client-name">
            <i className="fas fa-user"></i> {contractData.clientName}
          </span>
          <span className="contractor-badge">
            <i className="fas fa-briefcase"></i> {contractData.role}
          </span>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <main className="dashboard-content">
        <section className="payment-section">
          <h2>Payment Progress</h2>
          <div className="payment-amount">
            <div className="paid-amount">
              <h3>Paid: ${contractData.paidAmount.toLocaleString()}</h3>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(contractData.paidAmount / contractData.totalValue) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Total Value</th>
                  <th>Paid</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="total-value">${contractData.totalValue.toLocaleString()}</td>
                  <td className="paid-value">${contractData.paidAmount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rate-info">
            <div className="rate-item">
              <i className="fas fa-clock"></i>
              <span>Hourly Rate: <strong>${contractData.hourlyRate}/hr</strong></span>
            </div>
            <div className="rate-item">
              <i className="fas fa-calendar-week"></i>
              <span>Weekly Hours: <strong>{contractData.weeklyHours} hrs/week</strong></span>
            </div>
          </div>
        </section>

        <div className="divider">
          <hr />
          <div className="start-date">
            <i className="fas fa-play-circle"></i>
            Started {new Date(contractData.startDate).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        </div>

        <section className="actions-section">
          <div className="status-grid">
            <div className="status-item active-status">
              <div className="status-label">Active</div>
              <div className="status-value">{contractData.progress}%</div>
            </div>
            
            <div className="status-item pending-amount">
              <div className="status-label">Pending</div>
              <div className="status-value">${contractData.pendingAmount.toLocaleString()}</div>
            </div>
            
            <div className="status-item end-date">
              <div className="status-label">End Date</div>
              <div className="status-value">
                {new Date(contractData.endDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="btn btn-contract" 
              onClick={handleViewContract}
              disabled={!contractData.contractId}
            >
              <i className="fas fa-file-contract"></i> View Contract
            </button>
            
            <button 
              className="btn btn-message" 
              onClick={handleMessageClient}
            >
              <i className="fas fa-comment"></i> Message Client
            </button>
            
            <button 
              className="btn btn-payment" 
              onClick={handleRequestPayment}
              disabled={contractData.pendingAmount <= 0}
            >
              <i className="fas fa-money-check"></i> Request Payment
            </button>
            
            <button 
              className="btn btn-invoice" 
              onClick={handleDownloadInvoice}
              disabled={!contractData.invoiceId}
            >
              <i className="fas fa-file-invoice"></i> Download Invoice
            </button>
          </div>

          <div className="additional-info">
            <div className="info-card">
              <h4><i className="fas fa-calculator"></i> Project Summary</h4>
              <ul>
                <li>Total Hours: {Math.round(contractData.totalValue / contractData.hourlyRate)} hours</li>
                <li>Remaining Hours: {calculateRemainingHours()} hours</li>
                <li>Weekly Earnings: ${contractData.hourlyRate * contractData.weeklyHours}</li>
                <li>Completion Date: {new Date(contractData.endDate).toLocaleDateString()}</li>
              </ul>
            </div>
            
            <div className="info-card">
              <h4><i className="fas fa-info-circle"></i> Quick Actions</h4>
              <div className="quick-actions">
                <button className="quick-btn">
                  <i className="fas fa-history"></i> View History
                </button>
                <button className="quick-btn">
                  <i className="fas fa-edit"></i> Update Hours
                </button>
                <button className="quick-btn">
                  <i className="fas fa-share"></i> Share Report
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="dashboard-footer">
        <p>Database Optimization Contract Dashboard • Updated in real-time</p>
        <div className="footer-links">
          <a href="#help"><i className="fas fa-question-circle"></i> Help</a>
          <a href="#support"><i className="fas fa-headset"></i> Support</a>
          <a href="#settings"><i className="fas fa-cog"></i> Settings</a>
        </div>
      </footer>
    </div>
  );
};

export default ContractDashboard;