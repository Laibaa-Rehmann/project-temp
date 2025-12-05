import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  AlertCircle,
  FileText,
  Download,
  MessageSquare,
  MoreVertical,
  Filter,
  BarChart3,
  Loader2,
  Users,
  Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ContractsPage = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    totalEarnings: 0,
    pendingEarnings: 0
  });
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/contracts?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }
      
      const data = await response.json();
      setContracts(data);
      
      // Calculate stats from real data
      const activeContracts = data.filter(c => c.status === 'active' || c.status === 'ongoing');
      const completedContracts = data.filter(c => c.status === 'completed' || c.status === 'finished');
      
      const totalEarnings = data.reduce((sum, contract) => {
        // Ensure we have valid numbers
        const paid = contract.paid_amount || contract.paid || contract.amount_paid || 0;
        return sum + parseFloat(paid);
      }, 0);
      
      const pendingEarnings = data.reduce((sum, contract) => {
        // Calculate pending if contract is still active
        if (contract.status === 'active' || contract.status === 'ongoing') {
          const total = contract.total_amount || contract.amount || contract.value || 0;
          const paid = contract.paid_amount || contract.paid || contract.amount_paid || 0;
          return sum + (parseFloat(total) - parseFloat(paid));
        }
        return sum;
      }, 0);
      
      setStats({
        total: data.length,
        active: activeContracts.length,
        completed: completedContracts.length,
        totalEarnings: totalEarnings,
        pendingEarnings: pendingEarnings
      });
      
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to load contracts');
      
      // Set empty state instead of mock data
      setContracts([]);
      setStats({
        total: 0,
        active: 0,
        completed: 0,
        totalEarnings: 0,
        pendingEarnings: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [filter]);

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch(statusLower) {
      case 'active':
      case 'ongoing': 
        return 'bg-green-100 text-green-800';
      case 'completed':
      case 'finished':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
      case 'terminated':
        return 'bg-red-100 text-red-800';
      case 'disputed':
      case 'under_review':
        return 'bg-orange-100 text-orange-800';
      case 'pending':
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    switch(statusLower) {
      case 'active':
      case 'ongoing': 
        return <TrendingUp className="w-4 h-4" />;
      case 'completed':
      case 'finished':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
      case 'terminated':
        return <AlertCircle className="w-4 h-4" />;
      case 'disputed':
      case 'under_review':
        return <AlertCircle className="w-4 h-4" />;
      default: 
        return <Briefcase className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') return 'Ongoing';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Ongoing';
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      return 'Ongoing';
    }
  };

  const calculateProgress = (contract) => {
    const total = parseFloat(contract.total_amount || contract.amount || contract.value || 1);
    const paid = parseFloat(contract.paid_amount || contract.paid || contract.amount_paid || 0);
    if (total <= 0) return 0;
    return Math.min(100, Math.round((paid / total) * 100));
  };

  const getContractTitle = (contract) => {
    return contract.title || 
           contract.project_name || 
           contract.name || 
           `Contract #${contract.id || contract.contract_id || 'N/A'}`;
  };

  const getClientName = (contract) => {
    return contract.client_name || 
           contract.client || 
           contract.company_name || 
           'Unknown Client';
  };

  const getJobTitle = (contract) => {
    return contract.job_title || 
           contract.role || 
           contract.position || 
           'Contractor';
  };

  const getTotalAmount = (contract) => {
    return contract.total_amount || contract.amount || contract.value || 0;
  };

  const getPaidAmount = (contract) => {
    return contract.paid_amount || contract.paid || contract.amount_paid || 0;
  };

  const getPendingAmount = (contract) => {
    const total = parseFloat(getTotalAmount(contract));
    const paid = parseFloat(getPaidAmount(contract));
    return Math.max(0, total - paid);
  };

  const tabs = [
    { id: 'all', name: 'All Contracts', count: stats.total },
    { id: 'active', name: 'Active', count: stats.active },
    { id: 'completed', name: 'Completed', count: stats.completed }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Contracts</h1>
            <p className="text-gray-600 mt-2">Manage and track your active and completed contracts</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link to="/proposals">
              <button className="btn-secondary mr-3">
                View Proposals
              </button>
            </Link>
            <Link to="/find-work">
              <button className="btn-primary">
                Find New Work
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Total Contracts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Briefcase className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pendingEarnings)}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setFilter(tab.id === 'all' ? 'all' : tab.id);
                }}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.name}
                <span className={`
                  ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                  ${activeTab === tab.id 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contracts List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your contracts...</p>
        </div>
      ) : contracts.length > 0 ? (
        <div className="space-y-6">
          {contracts.map(contract => {
            const progress = calculateProgress(contract);
            const isActive = contract.status === 'active' || contract.status === 'ongoing';
            const totalAmount = getTotalAmount(contract);
            const paidAmount = getPaidAmount(contract);
            const pendingAmount = getPendingAmount(contract);
            
            return (
              <div key={contract.id || contract.contract_id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Contract Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {getContractTitle(contract)}
                        </h3>
                        <div className="flex items-center text-gray-600 text-sm mb-2">
                          <Users className="w-4 h-4 mr-1" />
                          <span className="mr-4">{getClientName(contract)}</span>
                          <Target className="w-4 h-4 mr-1" />
                          <span>{getJobTitle(contract)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)} flex items-center`}>
                          {getStatusIcon(contract.status)}
                          <span className="ml-1 capitalize">{contract.status || 'unknown'}</span>
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {isActive && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-700">Payment Progress</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-600 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Paid: {formatCurrency(paidAmount)}</span>
                          <span>Pending: {formatCurrency(pendingAmount)}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Contract Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Total Value</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Paid</p>
                        <p className="font-semibold text-green-600">{formatCurrency(paidAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Started</p>
                        <p className="font-semibold text-gray-900">{formatDate(contract.start_date || contract.created_at || contract.start_date)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{isActive ? 'End Date' : 'Completed'}</p>
                        <p className="font-semibold text-gray-900">{formatDate(contract.end_date || contract.completed_at || contract.due_date)}</p>
                      </div>
                    </div>
                    
                    {/* Hourly Rate Info */}
                    {contract.hourly_rate && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Hourly Rate:</span> ${contract.hourly_rate}/hr
                          {contract.hours_per_week && (
                            <span className="ml-4">
                              <span className="font-medium">Weekly Hours:</span> {contract.hours_per_week} hrs/week
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    
                    {/* Payment Schedule */}
                    {isActive && contract.next_payment_date && (
                      <div className="mt-4 flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          Next payment: {formatDate(contract.next_payment_date)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="lg:w-48 flex flex-col space-y-3">
                    {/* View Details Button - UPDATED */}
                    <Link 
                      to={`/contracts/${contract.id || contract.contract_id}`}
                      className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center transition-colors duration-200"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Details
                    </Link>
                    
                    <Link to={`/messages/${getClientName(contract).replace(/\s+/g, '-').toLowerCase()}`}>
                      <button className="w-full py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 text-sm flex items-center justify-center transition-colors duration-200">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message Client
                      </button>
                    </Link>
                    
                    {isActive && pendingAmount > 0 && (
                      <button className="w-full btn-primary py-2 text-sm">
                        Request Payment
                      </button>
                    )}
                    
                    <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center transition-colors duration-200">
                      <Download className="w-4 h-4 mr-2" />
                      Download Invoice
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No contracts found</h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? "You don't have any contracts yet. Start by applying to jobs!" 
              : `No ${filter} contracts found.`}
          </p>
          <Link to="/find-work">
            <button className="btn-primary">
              Browse Jobs
            </button>
          </Link>
        </div>
      )}

      {/* Contract Tips */}
      <div className="mt-8 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">📋 Contract Management Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Clear Milestones</h3>
            <p className="text-sm text-gray-600">Define clear deliverables and payment milestones in your contracts</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Regular Updates</h3>
            <p className="text-sm text-gray-600">Provide regular progress updates to maintain client trust</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Document Everything</h3>
            <p className="text-sm text-gray-600">Keep records of all communications and deliverables</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractsPage;