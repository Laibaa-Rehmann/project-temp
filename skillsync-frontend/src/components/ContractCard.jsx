import React, { useState } from 'react';
import axios from 'axios';
import './ContractCard.css';

const ContractCard = ({ contractId = "contract_001" }) => {
  const [contract, setContract] = useState({
    projectName: "Database Optimization",
    clientName: "Unknown Client",
    contractorName: "Contractor",
    totalValue: 5500,
    paidAmount: 2000,
    startDate: "Nov 30, 2025",
    endDate: "Jan 1, 2026",
    status: "Active"
  });
  
  const [loading, setLoading] = useState({
    requestPayment: false,
    downloadInvoice: false,
    viewContract: false
  });
  
  const [messages, setMessages] = useState({
    requestPayment: '',
    downloadInvoice: '',
    viewContract: ''
  });

  // API base URL
  const API_BASE_URL = 'http://localhost:8000';

  // Request Payment Function
  const handleRequestPayment = async () => {
    setLoading({ ...loading, requestPayment: true });
    setMessages({ ...messages, requestPayment: '' });
    
    try {
      const response = await axios.post(`${API_BASE_URL}/request-payment`, {
        contract_id: contractId,
        requested_amount: contract.totalValue - contract.paidAmount,
        reason: "Payment for completed work"
      });
      
      if (response.data.success) {
        setMessages({
          ...messages,
          requestPayment: `✅ ${response.data.message}`
        });
        
        // Show success alert
        alert(`Payment request submitted!\nRequest ID: ${response.data.request_id}`);
      }
    } catch (error) {
      setMessages({
        ...messages,
        requestPayment: `❌ Failed to request payment: ${error.response?.data?.detail || error.message}`
      });
      console.error('Payment request error:', error);
    } finally {
      setLoading({ ...loading, requestPayment: false });
    }
  };

  // Download Invoice Function
  const handleDownloadInvoice = async () => {
    setLoading({ ...loading, downloadInvoice: true });
    setMessages({ ...messages, downloadInvoice: '' });
    
    try {
      // First generate the invoice
      const invoiceResponse = await axios.get(`${API_BASE_URL}/download-invoice/${contractId}`);
      
      if (invoiceResponse.data.success) {
        // Then download the file
        const downloadUrl = `${API_BASE_URL}${invoiceResponse.data.invoice_url}`;
        
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `invoice_${contractId}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setMessages({
          ...messages,
          downloadInvoice: `✅ Invoice downloaded successfully`
        });
        
        // Show invoice details
        alert(`Invoice generated!\nInvoice ID: ${invoiceResponse.data.data.invoice_id}\nDue Amount: $${invoiceResponse.data.data.due_amount}`);
      }
    } catch (error) {
      setMessages({
        ...messages,
        downloadInvoice: `❌ Failed to download invoice: ${error.response?.data?.detail || error.message}`
      });
      console.error('Invoice download error:', error);
    } finally {
      setLoading({ ...loading, downloadInvoice: false });
    }
  };

  // View Contract Function
  const handleViewContract = async () => {
    setLoading({ ...loading, viewContract: true });
    setMessages({ ...messages, viewContract: '' });
    
    try {
      const response = await axios.get(`${API_BASE_URL}/view-contract/${contractId}`);
      
      // In a real app, you might open a modal or new page
      // Here we'll show an alert with contract details
      const contractDetails = response.data.contract;
      
      alert(`
        📄 Contract Details:
        
        Project: ${contractDetails.project_name}
        Client: ${contractDetails.client_name}
        Contractor: ${contractDetails.contractor_name}
        
        Total Value: $${contractDetails.total_value}
        Paid: $${contractDetails.paid_amount}
        Remaining: $${contractDetails.total_value - contractDetails.paid_amount}
        
        Start Date: ${contractDetails.start_date}
        End Date: ${contractDetails.end_date}
        Status: ${contractDetails.status}
      `);
      
      setMessages({
        ...messages,
        viewContract: '✅ Contract details loaded'
      });
      
    } catch (error) {
      setMessages({
        ...messages,
        viewContract: `❌ Failed to load contract: ${error.response?.data?.detail || error.message}`
      });
      console.error('View contract error:', error);
    } finally {
      setLoading({ ...loading, viewContract: false });
    }
  };

  // Calculate progress
  const progressPercentage = (contract.paidAmount / contract.totalValue) * 100;
  const remainingAmount = contract.totalValue - contract.paidAmount;

  return (
    <div className="contract-card">
      <div className="contract-header">
        <h2>{contract.projectName}</h2>
        <div className="client-info">
          <span className="client-label">Client:</span>
          <span className="client-name">{contract.clientName}</span>
          <span className="contractor-label">Contractor:</span>
          <span className="contractor-name">{contract.contractorName}</span>
        </div>
      </div>

      <div className="payment-section">
        <h3>Payment Progress</h3>
        <div className="payment-display">
          <div className="paid-amount">
            <span className="amount-label">Paid:</span>
            <span className="amount-value">${contract.paidAmount.toLocaleString()}</span>
          </div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          <div className="amount-details">
            <div className="amount-row">
              <span>Total Value</span>
              <span>${contract.totalValue.toLocaleString()}</span>
            </div>
            <div className="amount-row">
              <span>Paid</span>
              <span>${contract.paidAmount.toLocaleString()}</span>
            </div>
            <div className="amount-row remaining">
              <span>Remaining</span>
              <span>${remainingAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="timeline-section">
        <div className="timeline-item">
          <span className="timeline-label">Started</span>
          <span className="timeline-date">{contract.startDate}</span>
        </div>
        <div className="timeline-item">
          <span className="timeline-label">End Date</span>
          <span className="timeline-date">{contract.endDate}</span>
        </div>
        <div className="status-badge active">
          {contract.status}
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="actions-section">
        <h3>Contract Actions</h3>
        
        <div className="action-buttons">
          {/* View Contract Button */}
          <button 
            className="action-btn view-contract-btn"
            onClick={handleViewContract}
            disabled={loading.viewContract}
          >
            {loading.viewContract ? (
              <span className="loading-spinner"></span>
            ) : (
              '📄 View Contract'
            )}
          </button>
          
          {/* Request Payment Button */}
          <button 
            className="action-btn request-payment-btn"
            onClick={handleRequestPayment}
            disabled={loading.requestPayment}
          >
            {loading.requestPayment ? (
              <span className="loading-spinner"></span>
            ) : (
              '💳 Request Payment'
            )}
          </button>
          
          {/* Download Invoice Button */}
          <button 
            className="action-btn download-invoice-btn"
            onClick={handleDownloadInvoice}
            disabled={loading.downloadInvoice}
          >
            {loading.downloadInvoice ? (
              <span className="loading-spinner"></span>
            ) : (
              '📥 Download Invoice'
            )}
          </button>
        </div>
        
        {/* Status Messages */}
        <div className="status-messages">
          {messages.viewContract && (
            <div className="message view-contract-message">{messages.viewContract}</div>
          )}
          {messages.requestPayment && (
            <div className="message request-payment-message">{messages.requestPayment}</div>
          )}
          {messages.downloadInvoice && (
            <div className="message download-invoice-message">{messages.downloadInvoice}</div>
          )}
        </div>
      </div>

      {/* Additional Actions */}
      <div className="additional-actions">
        <button className="secondary-btn message-client-btn">
          ✉️ Message Client
        </button>
        <button className="secondary-btn download-docs-btn">
          📁 Download Documents
        </button>
      </div>
    </div>
  );
};

export default ContractCard;