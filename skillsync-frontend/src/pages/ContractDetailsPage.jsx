// ContractDetailsPage.jsx - Updated UI
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

const API_BASE_URL = 'http://localhost:8000';

const ContractDetailsPage = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

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
      fetchContractDetails();
    } catch (err) {
      alert('Failed to send payment request');
      console.error('Error requesting payment:', err);
    }
  };

  const handleDownloadInvoice = () => {
    // Simplify invoice download - just show a message
    alert('Invoice download functionality would be implemented here');
  };

  const handleSendMessage = () => {
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
      <Container maxWidth="md" sx={{ mt: 4 }}>
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
      <Container maxWidth="md" sx={{ mt: 4 }}>
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Button component={RouterLink} to="/contracts" startIcon={<ArrowBack />}>
          Contracts
        </Button>
        <Typography color="text.primary">Contract Details</Typography>
      </Breadcrumbs>

      {/* Main Grid Layout */}
      <Grid container spacing={3}>
        {/* Left Column - Main Content */}
        <Grid item xs={12} md={7}>
          {/* Contract Title and Status */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 1 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {contract.title}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                label={contract.status.toUpperCase()}
                color={getStatusColor(contract.status)}
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                Contract ID: #{contract.id}
              </Typography>
            </Stack>
          </Paper>

          {/* Payment Progress Card - Match reference image */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}>
            <CardHeader 
              title={
                <Typography variant="h6" fontWeight="bold">
                  Database Optimization
                </Typography>
              }
              subheader={
                <Typography variant="body2" color="text.secondary">
                  Track payments and milestones
                </Typography>
              }
            />
            <CardContent>
              {/* Progress Bar Section */}
              <Box sx={{ mb: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
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
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4caf50'
                    }
                  }}
                />
                
                {/* Payment Amount Display - Match reference */}
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="#2196f3" gutterBottom>
                    ${contract.paid_amount?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Paid Amount
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Status and Dates */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Status
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        backgroundColor: contract.status === 'active' ? '#4caf50' : '#ff9800' 
                      }} />
                      <Typography variant="body2" fontWeight="medium">
                        {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                      </Typography>
                    </Stack>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary" display="block">
                      End Date
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {endDate ? format(endDate, 'MMM dd, yyyy') : 'Not set'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Contract Details - Compact version */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}>
            <CardHeader 
              title="Contract Details"
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Hourly Rate
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      ${contract.hourly_rate || '0'}/hr
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Weekly Hours
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {contract.hours_per_week || '0'} hrs
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Duration
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {contract.end_date ? 
                        `${Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} days` : 
                        'Ongoing'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Job
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {contract.job?.title || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Client Information - Simplified */}
          <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
            <CardHeader 
              title="Client Information"
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 48, height: 48, bgcolor: '#1976d2' }}>
                  {contract.client?.full_name?.charAt(0) || 'C'}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="body1" fontWeight="medium">
                    {contract.client?.full_name || 'Unknown Client'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {contract.client?.email || 'No email provided'}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Email />}
                  onClick={() => window.location.href = `mailto:${contract.client?.email}`}
                  disabled={!contract.client?.email}
                >
                  SEND EMAIL
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Actions & Timeline */}
        <Grid item xs={12} md={5}>
          {/* Quick Actions - Match reference styling */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}>
            <CardHeader 
              title="Quick Actions"
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Payment />}
                  onClick={handleRequestPayment}
                  disabled={contract.status !== 'active'}
                  sx={{ 
                    justifyContent: 'flex-start',
                    py: 1.5,
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}
                >
                  Request Payment
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Message />}
                  onClick={handleSendMessage}
                  sx={{ 
                    justifyContent: 'flex-start',
                    py: 1.5,
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}
                >
                  Message Client
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Download />}
                  onClick={handleDownloadInvoice}
                  sx={{ 
                    justifyContent: 'flex-start',
                    py: 1.5,
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}
                >
                  Download Invoice
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Print />}
                  onClick={() => window.print()}
                  sx={{ 
                    justifyContent: 'flex-start',
                    py: 1.5,
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}
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
                  sx={{ 
                    justifyContent: 'flex-start',
                    py: 1.5,
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}
                >
                  Share Contract
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Payment History - Simplified */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}>
            <CardHeader 
              title="Payment History"
              subheader="1 of 1 payments"
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 0 }}>
              {/* Initial Payment */}
              <Box sx={{ 
                p: 2, 
                mb: 2, 
                bgcolor: '#e8f5e9', 
                borderRadius: 1,
                borderLeft: '4px solid #4caf50'
              }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Initial Payment
                </Typography>
                <Typography variant="h6" color="#2e7d32">
                  ${contract.paid_amount?.toFixed(2) || '0.00'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  paid {startDate ? format(startDate, 'MMM dd, yyyy') : 'Recently'}
                </Typography>
              </Box>

              {/* Next Payment */}
              <Box sx={{ 
                p: 2, 
                bgcolor: '#fff3e0', 
                borderRadius: 1,
                borderLeft: '4px solid #ff9800'
              }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Next Payment Due
                </Typography>
                <Typography variant="h5" color="#f57c00" fontWeight="bold">
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

          {/* Contract Timeline - Simplified */}
          <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
            <CardHeader 
              title="Contract Timeline"
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Stack spacing={2}>
                {/* Timeline item 1 */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    bgcolor: '#4caf50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle sx={{ fontSize: 16, color: 'white' }} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight="medium">
                      Contract Created
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {contract.created_at ? format(new Date(contract.created_at), 'MMM dd, yyyy') : 'N/A'}
                    </Typography>
                  </Box>
                </Stack>

                {/* Timeline item 2 */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    bgcolor: contract.paid_amount > 0 ? '#4caf50' : '#bdbdbd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {contract.paid_amount > 0 ? (
                      <CheckCircle sx={{ fontSize: 16, color: 'white' }} />
                    ) : (
                      <PendingActions sx={{ fontSize: 16, color: 'white' }} />
                    )}
                  </Box>
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight="medium">
                      Initial Payment
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {contract.paid_amount > 0 ? `Paid $${contract.paid_amount}` : 'Pending'}
                    </Typography>
                  </Box>
                </Stack>

                {/* Timeline item 3 */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    bgcolor: contract.status === 'completed' ? '#4caf50' : '#bdbdbd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {contract.status === 'completed' ? (
                      <CheckCircle sx={{ fontSize: 16, color: 'white' }} />
                    ) : (
                      <PendingActions sx={{ fontSize: 16, color: 'white' }} />
                    )}
                  </Box>
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight="medium">
                      Project Completion
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {contract.status === 'completed' ? 'Completed' : 'In Progress'}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
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
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
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
    </Container>
  );
};

export default ContractDetailsPage;