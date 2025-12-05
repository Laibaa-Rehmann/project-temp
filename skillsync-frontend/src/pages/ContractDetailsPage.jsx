// ContractDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  useParams, 
  useNavigate,
  Link as RouterLink 
} from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Divider,
  Stack,
  LinearProgress,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Breadcrumbs,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  Download,
  Email,
  Message,
  Payment,
  CalendarToday,
  AttachMoney,
  AccessTime,
  CheckCircle,
  PendingActions,
  Description,
  Person,
  Business,
  Receipt,
  PictureAsPdf,
  Print,
  Share,
  MoreVert,
  Timeline,
  TrendingUp,
  History,
  Assignment,
  ContactSupport
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

const API_BASE_URL = 'http://localhost:8000';

const ContractDetailsPage = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: 'INV-' + Date.now(),
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Thank you for your business!'
  });

  useEffect(() => {
    fetchContractDetails();
  }, [contractId]);

  const fetchContractDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/contracts/${contractId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContract(response.data);
    } catch (err) {
      setError('Failed to load contract details');
      console.error('Error fetching contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (!contract) return 0;
    return Math.round((contract.paid_amount / contract.total_amount) * 100);
  };

  const calculateRemainingAmount = () => {
    if (!contract) return 0;
    return contract.total_amount - contract.paid_amount;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      case 'disputed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle color="success" />;
      case 'pending': return <PendingActions color="warning" />;
      case 'completed': return <CheckCircle color="info" />;
      default: return <PendingActions />;
    }
  };

  const handleRequestPayment = () => {
    setPaymentDialogOpen(true);
    setPaymentAmount(calculateRemainingAmount().toString());
  };

  const handleSendPaymentRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/contracts/${contractId}/request-payment`, {
        amount: parseFloat(paymentAmount),
        description: `Payment request for contract: ${contract.title}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Payment request sent successfully!');
      setPaymentDialogOpen(false);
      fetchContractDetails(); // Refresh contract data
    } catch (err) {
      alert('Failed to send payment request');
      console.error('Error requesting payment:', err);
    }
  };

  const handleDownloadInvoice = () => {
    setInvoiceDialogOpen(true);
  };

  const generatePDFInvoice = () => {
    const doc = new jsPDF();
    
    // Add logo/header
    doc.setFontSize(20);
    doc.setTextColor(40, 53, 147);
    doc.text('SKILLLINK INVOICE', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 20, 40);
    doc.text(`Issue Date: ${format(new Date(invoiceData.issueDate), 'MMM dd, yyyy')}`, 20, 45);
    doc.text(`Due Date: ${format(new Date(invoiceData.dueDate), 'MMM dd, yyyy')}`, 20, 50);
    
    // From/To sections
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('From:', 20, 70);
    doc.setFontSize(10);
    doc.text(contract?.freelancer?.full_name || 'Freelancer Name', 20, 76);
    doc.text(contract?.freelancer?.email || 'email@example.com', 20, 81);
    
    doc.setFontSize(12);
    doc.text('To:', 120, 70);
    doc.setFontSize(10);
    doc.text(contract?.client?.full_name || 'Client Name', 120, 76);
    doc.text(contract?.client?.email || 'client@example.com', 120, 81);
    if (contract?.client?.company_name) {
      doc.text(contract.client.company_name, 120, 86);
    }
    
    // Contract Details
    doc.setFontSize(14);
    doc.text('Contract Details', 20, 105);
    doc.setFontSize(10);
    
    const contractDetails = [
      ['Contract Title', contract?.title || 'N/A'],
      ['Contract ID', contract?.id || 'N/A'],
      ['Start Date', contract?.start_date ? format(new Date(contract.start_date), 'MMM dd, yyyy') : 'N/A'],
      ['End Date', contract?.end_date ? format(new Date(contract.end_date), 'MMM dd, yyyy') : 'N/A'],
      ['Status', contract?.status?.toUpperCase() || 'N/A'],
      ['Hourly Rate', contract?.hourly_rate ? `$${contract.hourly_rate}/hr` : 'N/A'],
      ['Weekly Hours', contract?.hours_per_week ? `${contract.hours_per_week} hrs/week` : 'N/A']
    ];
    
    doc.autoTable({
      startY: 110,
      head: [['Description', 'Value']],
      body: contractDetails,
      theme: 'grid',
      headStyles: { fillColor: [40, 53, 147] },
      margin: { left: 20, right: 20 }
    });
    
    // Payment Summary
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Payment Summary', 20, finalY);
    
    const paymentSummary = [
      ['Description', 'Amount'],
      ['Total Contract Value', `$${contract?.total_amount?.toFixed(2) || '0.00'}`],
      ['Amount Paid', `$${contract?.paid_amount?.toFixed(2) || '0.00'}`],
      ['Balance Due', `$${calculateRemainingAmount().toFixed(2)}`]
    ];
    
    doc.autoTable({
      startY: finalY + 5,
      head: [paymentSummary[0]],
      body: paymentSummary.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [40, 53, 147] },
      margin: { left: 20, right: 20 },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.row.index === 2) { // Balance Due row
          doc.setTextColor(255, 0, 0);
          doc.setFont('helvetica', 'bold');
        }
      }
    });
    
    // Payment Progress
    const progressY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Payment Progress:', 20, progressY);
    
    const progress = calculateProgress();
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(200, 200, 200);
    doc.rect(20, progressY + 5, 170, 8, 'F');
    
    doc.setFillColor(76, 175, 80);
    doc.rect(20, progressY + 5, 170 * (progress / 100), 8, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`${progress}% Complete`, 105, progressY + 11, { align: 'center' });
    
    // Notes
    const notesY = progressY + 25;
    doc.setFontSize(12);
    doc.text('Notes:', 20, notesY);
    doc.setFontSize(10);
    doc.text(invoiceData.notes, 20, notesY + 6, { maxWidth: 170 });
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('This is an automatically generated invoice from SkillLink Platform.', 105, pageHeight - 20, { align: 'center' });
    doc.text('For any questions, please contact support@skilllink.com', 105, pageHeight - 15, { align: 'center' });
    
    // Save the PDF
    doc.save(`invoice-${invoiceData.invoiceNumber}.pdf`);
    setInvoiceDialogOpen(false);
  };

  const generateHTMLInvoice = () => {
    const invoiceElement = document.getElementById('invoice-template');
    
    html2canvas(invoiceElement).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${invoiceData.invoiceNumber}.pdf`);
      setInvoiceDialogOpen(false);
    });
  };

  const handleSendMessage = () => {
    // Implement message functionality
    navigate(`/messages?user=${contract?.client_id}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/contracts')}>
          Back to Contracts
        </Button>
      </Container>
    );
  }

  if (!contract) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">Contract not found</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/contracts')}>
          Back to Contracts
        </Button>
      </Container>
    );
  }

  const progress = calculateProgress();
  const remainingAmount = calculateRemainingAmount();
  const startDate = contract.start_date ? new Date(contract.start_date) : null;
  const endDate = contract.end_date ? new Date(contract.end_date) : null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Button component={RouterLink} to="/contracts" startIcon={<ArrowBack />}>
          Contracts
        </Button>
        <Typography color="text.primary">Contract Details</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" fontWeight="bold">
              {contract.title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <Chip
                icon={getStatusIcon(contract.status)}
                label={contract.status.toUpperCase()}
                color={getStatusColor(contract.status)}
                variant="outlined"
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                Contract ID: #{contract.id}
              </Typography>
            </Stack>
          </Grid>
          <Grid item>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownloadInvoice}
              >
                Invoice
              </Button>
              <Button
                variant="contained"
                startIcon={<Message />}
                onClick={handleSendMessage}
              >
                Message Client
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column - Main Contract Info */}
        <Grid item xs={12} md={8}>
          {/* Payment Progress Card */}
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title="Payment Progress" 
              subheader="Track payments and milestones"
            />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {progress}%
                  </Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      ${contract.paid_amount?.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Paid Amount
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="h5" fontWeight="bold" color="primary.main">
                      ${contract.total_amount?.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Value
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Started
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {startDate ? format(startDate, 'MMM dd, yyyy') : 'Not set'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    End Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {endDate ? format(endDate, 'MMM dd, yyyy') : 'Not set'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Contract Details */}
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Contract Details" />
            <CardContent>
              <List disablePadding>
                <ListItem>
                  <ListItemIcon>
                    <AttachMoney />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Hourly Rate" 
                    secondary={`$${contract.hourly_rate || '0'}/hr`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AccessTime />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Weekly Hours" 
                    secondary={`${contract.hours_per_week || '0'} hrs/week`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Duration" 
                    secondary={contract.end_date ? 
                      `${Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} days` : 
                      'Ongoing'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Assignment />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Job" 
                    secondary={
                      contract.job ? (
                        <Button 
                          component={RouterLink} 
                          to={`/jobs/${contract.job_id}`}
                          size="small"
                        >
                          {contract.job.title}
                        </Button>
                      ) : 'N/A'
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader title="Client Information" />
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56 }}>
                  {contract.client?.full_name?.charAt(0) || 'C'}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {contract.client?.full_name || 'Unknown Client'}
                  </Typography>
                  {contract.client?.company_name && (
                    <Typography variant="body2" color="text.secondary">
                      {contract.client.company_name}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    {contract.client?.email || 'No email provided'}
                  </Typography>
                </Box>
              </Stack>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Email />}
                onClick={() => window.location.href = `mailto:${contract.client?.email}`}
              >
                Send Email
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Actions & Timeline */}
        <Grid item xs={12} md={4}>
          {/* Quick Actions */}
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Quick Actions" />
            <CardContent>
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Payment />}
                  onClick={handleRequestPayment}
                  disabled={contract.status !== 'active'}
                >
                  Request Payment
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Message />}
                  onClick={handleSendMessage}
                >
                  Message Client
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Download />}
                  onClick={handleDownloadInvoice}
                >
                  Download Invoice
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Print />}
                  onClick={() => window.print()}
                >
                  Print Contract
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Share />}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Contract link copied to clipboard!');
                  }}
                >
                  Share Contract
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader 
              title="Payment History"
              subheader={`${contract.paid_amount ? '1' : '0'} of 1 payments`}
            />
            <CardContent>
              {contract.paid_amount > 0 ? (
                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Initial Payment
                  </Typography>
                  <Typography variant="body2">
                    ${contract.paid_amount.toFixed(2)} paid
                  </Typography>
                  <Typography variant="caption">
                    {contract.start_date ? format(new Date(contract.start_date), 'MMM dd, yyyy') : 'Recently'}
                  </Typography>
                </Paper>
              ) : (
                <Alert severity="info">
                  No payments received yet. Use the "Request Payment" button to send a payment request.
                </Alert>
              )}
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Next Payment Due
                </Typography>
                <Typography variant="h6" color="error.main" fontWeight="bold">
                  ${remainingAmount.toFixed(2)}
                </Typography>
                {endDate && (
                  <Typography variant="caption" color="text.secondary">
                    Due by {format(endDate, 'MMM dd, yyyy')}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Contract Timeline */}
          <Card sx={{ mt: 3 }}>
            <CardHeader title="Contract Timeline" />
            <CardContent>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Contract Created" 
                    secondary={contract.created_at ? format(new Date(contract.created_at), 'MMM dd, yyyy') : 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {contract.paid_amount > 0 ? (
                      <CheckCircle color="success" />
                    ) : (
                      <PendingActions color="action" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Initial Payment" 
                    secondary={contract.paid_amount > 0 ? `Paid $${contract.paid_amount}` : 'Pending'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {contract.status === 'completed' ? (
                      <CheckCircle color="success" />
                    ) : (
                      <PendingActions color="action" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Project Completion" 
                    secondary={contract.status === 'completed' ? 'Completed' : 'In Progress'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Request Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
        <DialogTitle>Request Payment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            InputProps={{
              startAdornment: <Typography>$</Typography>
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Balance due: ${remainingAmount.toFixed(2)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSendPaymentRequest} 
            variant="contained"
            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
          >
            Send Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog 
        open={invoiceDialogOpen} 
        onClose={() => setInvoiceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Download Invoice</DialogTitle>
        <DialogContent>
          <div id="invoice-template" style={{ display: 'none' }}>
            {/* Hidden HTML invoice template for PDF generation */}
            <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
              <h1 style={{ color: '#283593', textAlign: 'center' }}>SKILLLINK INVOICE</h1>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                <div>
                  <p><strong>Invoice #:</strong> {invoiceData.invoiceNumber}</p>
                  <p><strong>Issue Date:</strong> {format(new Date(invoiceData.issueDate), 'MMM dd, yyyy')}</p>
                  <p><strong>Due Date:</strong> {format(new Date(invoiceData.dueDate), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p><strong>Contract ID:</strong> #{contract.id}</p>
                  <p><strong>Status:</strong> {contract.status.toUpperCase()}</p>
                </div>
              </div>
              
              <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3>From:</h3>
                  <p>{contract.freelancer?.full_name || 'Freelancer Name'}</p>
                  <p>{contract.freelancer?.email || 'email@example.com'}</p>
                </div>
                <div>
                  <h3>To:</h3>
                  <p>{contract.client?.full_name || 'Client Name'}</p>
                  <p>{contract.client?.email || 'client@example.com'}</p>
                  {contract.client?.company_name && <p>{contract.client.company_name}</p>}
                </div>
              </div>
              
              <div style={{ marginTop: '30px' }}>
                <h3>Payment Details</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#283593', color: 'white' }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Description</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Total Contract Value</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                        ${contract.total_amount?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Amount Paid</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                        ${contract.paid_amount?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                    <tr style={{ fontWeight: 'bold' }}>
                      <td style={{ padding: '10px' }}>Balance Due</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#f44336' }}>
                        ${remainingAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div style={{ marginTop: '30px' }}>
                <h3>Payment Progress</h3>
                <div style={{ 
                  width: '100%', 
                  backgroundColor: '#e0e0e0', 
                  borderRadius: '5px',
                  marginTop: '10px'
                }}>
                  <div style={{
                    width: `${progress}%`,
                    backgroundColor: '#4caf50',
                    height: '20px',
                    borderRadius: '5px',
                    textAlign: 'center',
                    lineHeight: '20px',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {progress}%
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '30px' }}>
                <h3>Notes</h3>
                <p>{invoiceData.notes}</p>
              </div>
              
              <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                <p>This is an automatically generated invoice from SkillLink Platform.</p>
                <p>For any questions, please contact support@skilllink.com</p>
              </div>
            </div>
          </div>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity="info">
                Select an invoice format to download
              </Alert>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<PictureAsPdf />}
                onClick={generatePDFInvoice}
                sx={{ height: '100px' }}
              >
                <div>
                  <Typography variant="h6">PDF Invoice</Typography>
                  <Typography variant="caption">Standard PDF format</Typography>
                </div>
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Description />}
                onClick={generateHTMLInvoice}
                sx={{ height: '100px' }}
              >
                <div>
                  <Typography variant="h6">HTML Invoice</Typography>
                  <Typography variant="caption">Formatted HTML to PDF</Typography>
                </div>
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ContractDetailsPage;