import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Filter,
  ChevronRight,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProposalsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    interviewing: 0,
    accepted: 0,
    rejected: 0
  });
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [withdrawingId, setWithdrawingId] = useState(null);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/proposals?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch proposals');
      }
      
      const data = await response.json();
      setProposals(data);
      
      // Calculate stats
      const statsData = {
        total: data.length,
        pending: data.filter(p => p.status === 'pending').length,
        interviewing: data.filter(p => p.status === 'interviewing').length,
        accepted: data.filter(p => p.status === 'accepted').length,
        rejected: data.filter(p => p.status === 'rejected').length
      };
      setStats(statsData);
      
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Failed to load proposals');
      
      // Fallback mock data
      setProposals(mockProposals);
      setStats({
        total: 8,
        pending: 3,
        interviewing: 2,
        accepted: 2,
        rejected: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawProposal = async (proposalId) => {
    if (!window.confirm('Are you sure you want to withdraw this proposal?')) return;
    
    setWithdrawingId(proposalId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'withdrawn' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to withdraw proposal');
      }
      
      toast.success('Proposal withdrawn successfully');
      fetchProposals(); // Refresh list
      
    } catch (error) {
      console.error('Error withdrawing proposal:', error);
      toast.error('Failed to withdraw proposal');
    } finally {
      setWithdrawingId(null);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [filter]);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'interviewing': return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'accepted': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'hired': return <TrendingUp className="w-4 h-4 text-purple-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'interviewing': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'hired': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'Under Review';
      case 'interviewing': return 'Interviewing';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Not Selected';
      case 'hired': return 'Hired';
      case 'withdrawn': return 'Withdrawn';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const tabs = [
    { id: 'all', name: 'All', count: stats.total },
    { id: 'pending', name: 'Pending', count: stats.pending },
    { id: 'interviewing', name: 'Interviewing', count: stats.interviewing },
    { id: 'accepted', name: 'Accepted', count: stats.accepted },
    { id: 'rejected', name: 'Rejected', count: stats.rejected }
  ];

  const mockProposals = [
    {
      id: 1,
      job_id: 101,
      job_title: 'Full Stack Developer for E-commerce Platform',
      client_name: 'TechCorp Inc.',
      cover_letter: 'I have 5+ years of experience building e-commerce solutions with React and Node.js...',
      bid_amount: 6000,
      estimated_days: 21,
      status: 'pending',
      submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      last_updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      client_rating: 4.8,
      budget_type: 'fixed',
      budget_amount: '$5,000'
    },
    {
      id: 2,
      job_id: 102,
      job_title: 'UI/UX Designer for Mobile App',
      client_name: 'DesignStudio',
      cover_letter: 'As a senior designer with expertise in mobile app interfaces...',
      bid_amount: 55,
      estimated_days: null,
      status: 'interviewing',
      submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      last_updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      client_rating: 4.9,
      budget_type: 'hourly',
      budget_amount: '$50/hr'
    },
    {
      id: 3,
      job_id: 103,
      job_title: 'Python Data Analyst',
      client_name: 'DataInsights Co.',
      cover_letter: 'I have extensive experience with data analysis using Python and Pandas...',
      bid_amount: 4000,
      estimated_days: 14,
      status: 'accepted',
      submitted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      client_rating: 4.7,
      budget_type: 'fixed',
      budget_amount: '$3,500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Proposals</h1>
            <p className="text-gray-600 mt-2">Track and manage your job applications</p>
          </div>
          <Link to="/find-work">
            <button className="mt-4 sm:mt-0 btn-primary flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Apply to New Jobs
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Interviewing</p>
              <p className="text-2xl font-bold text-blue-600">{stats.interviewing}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Not Selected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
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

      {/* Filters */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Filter className="w-4 h-4 text-gray-400 mr-2" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="interviewing">Interviewing</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
            </select>
          </div>
          <span className="text-sm text-gray-600">
            Showing {proposals.length} proposal{proposals.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          Export Proposals
        </button>
      </div>

      {/* Proposals List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your proposals...</p>
        </div>
      ) : proposals.length > 0 ? (
        <div className="space-y-4">
          {proposals.map(proposal => (
            <div key={proposal.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Left Column - Job Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {proposal.job_title}
                      </h3>
                      <div className="flex items-center text-gray-600 text-sm mb-3">
                        <Users className="w-4 h-4 mr-1" />
                        <span className="mr-4">{proposal.client_name}</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" />
                          <span>{proposal.client_rating}/5</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)} flex items-center`}>
                        {getStatusIcon(proposal.status)}
                        <span className="ml-1">{getStatusText(proposal.status)}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Cover Letter Preview */}
                  <div className="mb-4">
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {proposal.cover_letter}
                    </p>
                  </div>
                  
                  {/* Proposal Details */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span className="font-medium">
                        {proposal.bid_amount} {proposal.budget_type === 'fixed' ? '' : '/hr'}
                      </span>
                      <span className="ml-1 text-gray-500">(Client budget: {proposal.budget_amount})</span>
                    </div>
                    {proposal.estimated_days && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{proposal.estimated_days} days estimated</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Submitted {formatDate(proposal.submitted_at)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Actions */}
                <div className="lg:w-48 flex flex-col space-y-3">
                  <Link to={`/jobs/${proposal.job_id}`}>
                    <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center">
                      <Eye className="w-4 h-4 mr-2" />
                      View Job
                    </button>
                  </Link>
                  
                  <Link to={`/messages/${proposal.client_name}`}>
                    <button className="w-full py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 text-sm flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message Client
                    </button>
                  </Link>
                  
                  {proposal.status === 'pending' && (
                    <button 
                      onClick={() => handleWithdrawProposal(proposal.id)}
                      disabled={withdrawingId === proposal.id}
                      className="w-full py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {withdrawingId === proposal.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No proposals yet</h3>
          <p className="text-gray-600 mb-6">Start applying to jobs to see your proposals here</p>
          <Link to="/find-work">
            <button className="btn-primary">
              Browse Jobs
            </button>
          </Link>
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
          <h3 className="font-bold text-gray-900 mb-3">💡 Improve Your Proposals</h3>
          <ul className="text-gray-700 text-sm space-y-2">
            <li>• Personalize each cover letter for the specific job</li>
            <li>• Highlight relevant experience from your portfolio</li>
            <li>• Include specific examples of past work</li>
            <li>• Ask thoughtful questions about the project</li>
          </ul>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
          <h3 className="font-bold text-gray-900 mb-3">📈 Track Your Progress</h3>
          <ul className="text-gray-700 text-sm space-y-2">
            <li>• Follow up on pending proposals after 3-5 days</li>
            <li>• Prepare for interviews by researching the company</li>
            <li>• Update your portfolio with new projects</li>
            <li>• Ask for feedback on declined proposals</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProposalsPage;