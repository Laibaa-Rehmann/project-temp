import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DollarSign, Clock, Calendar, MapPin, Tag, User, MessageSquare, ArrowLeft, Briefcase } from 'lucide-react';
import { API } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proposalData, setProposalData] = useState({
    cover_letter: '',
    bid_amount: '',
    estimated_time: ''
  });
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const data = await API.jobs.get(id);
      setJob(data);
    } catch (error) {
      console.error('Failed to fetch job:', error);
      toast.error('Failed to load job details');
      navigate('/find-work');
    } finally {
      setLoading(false);
    }
  };

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to submit a proposal');
      navigate('/login');
      return;
    }

    if (user.user_type !== 'freelancer') {
      toast.error('Only freelancers can submit proposals');
      return;
    }

    setSubmitting(true);
    try {
      await API.proposals.create({
        job_id: id,
        ...proposalData,
        bid_amount: Number(proposalData.bid_amount)
      });
      
      toast.success('Proposal submitted successfully!');
      setShowProposalForm(false);
      setProposalData({
        cover_letter: '',
        bid_amount: '',
        estimated_time: ''
      });
    } catch (error) {
      console.error('Failed to submit proposal:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Job not found</h2>
        <button onClick={() => navigate('/find-work')} className="btn-primary mt-4">
          Browse Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Job Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{job.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-bold text-gray-900">${job.budget}</span>
                <span>{job.budget_type === 'hourly' ? '/hr' : 'fixed price'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{job.duration || 'Flexible'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Posted {formatDate(job.created_at)}</span>
              </div>
              {job.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                </div>
              )}
            </div>

            {/* Client Info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                {job.client?.name?.charAt(0) || 'C'}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{job.client?.name || 'Client'}</div>
                <div className="text-sm text-gray-600">Posted this job</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {user?.user_type === 'freelancer' ? (
              !showProposalForm ? (
                <button
                  onClick={() => setShowProposalForm(true)}
                  className="btn-primary"
                >
                  Submit Proposal
                </button>
              ) : (
                <button
                  onClick={() => setShowProposalForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )
            ) : user?.user_type === 'client' && user?.id === job.client_id ? (
              <div className="space-y-3">
                <button className="btn-primary w-full">
                  View Proposals ({job.proposals_count || 0})
                </button>
                <button className="btn-secondary w-full">
                  Edit Job
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Job Description */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
            </div>
          </div>

          {/* Skills Required */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Skills Required</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills?.map((skill, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-4 py-2 rounded-full">
                  <Tag className="w-4 h-4" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Proposal Form */}
          {showProposalForm && user?.user_type === 'freelancer' && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Proposal</h2>
              <form onSubmit={handleProposalSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter *
                  </label>
                  <textarea
                    value={proposalData.cover_letter}
                    onChange={(e) => setProposalData(prev => ({ ...prev, cover_letter: e.target.value }))}
                    rows={6}
                    className="input-field"
                    placeholder="Explain why you're the best fit for this job..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Bid ($) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={proposalData.bid_amount}
                        onChange={(e) => setProposalData(prev => ({ ...prev, bid_amount: e.target.value }))}
                        className="input-field pl-10"
                        placeholder="Enter your bid amount"
                        required
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Time *
                    </label>
                    <input
                      type="text"
                      value={proposalData.estimated_time}
                      onChange={(e) => setProposalData(prev => ({ ...prev, estimated_time: e.target.value }))}
                      className="input-field"
                      placeholder="e.g., 2 weeks, 1 month"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowProposalForm(false)}
                    className="btn-secondary flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Proposal'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Overview */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-4">Job Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Budget</div>
                <div className="font-bold text-gray-900">${job.budget} {job.budget_type === 'hourly' ? '/hr' : 'fixed'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Posted</div>
                <div className="font-bold text-gray-900">{formatDate(job.created_at)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Proposals</div>
                <div className="font-bold text-gray-900">{job.proposals_count || 0} proposals</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${job.status === 'open' ? 'bg-green-100 text-green-700' :
                    job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                  }`}>
                  {job.status || 'Open'}
                </div>
              </div>
            </div>
          </div>

          {/* About the Client */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-4">About the Client</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                  {job.client?.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{job.client?.name || 'Client'}</div>
                  <div className="text-sm text-gray-600">Member since {job.client?.created_at ? formatDate(job.client.created_at) : 'Recently'}</div>
                </div>
              </div>
              <button className="w-full btn-secondary flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Contact Client
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsPage;