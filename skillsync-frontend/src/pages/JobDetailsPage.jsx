import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Users,
  Star,
  FileText,
  Award,
  CheckCircle,
  Shield,
  Globe,
  Mail,
  MessageSquare,
  ExternalLink,
  Heart,
  Share2,
  AlertCircle,
  Loader2,
  Zap,
  Target,
  TrendingUp,
  Building,
  UserCheck,
  ThumbsUp,
  Bookmark,
  Eye,
  Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch job details
  useEffect(() => {
    fetchJobDetails();
    fetchSimilarJobs();
    checkIfSaved();
  }, [id]);

  const fetchJobDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/jobs/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Job not found');
          navigate('/find-work');
          return;
        }
        throw new Error(`Failed to fetch job: ${response.status}`);
      }

      const data = await response.json();
      console.log('Job details:', data);
      setJob(data);
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details');
      navigate('/find-work');
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:8000/api/jobs/${id}/similar`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSimilarJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching similar jobs:', error);
    }
  };

  const checkIfSaved = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:8000/api/jobs/${id}/check-saved`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsSaved(data.saved || false);
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleApplyNow = () => {
    navigate(`/jobs/${id}/apply`);
  };

  const handleSaveJob = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to save jobs');
        return;
      }

      const endpoint = isSaved ? 'unsave' : 'save';
      const response = await fetch(`http://localhost:8000/api/jobs/${id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setIsSaved(!isSaved);
        toast.success(isSaved ? 'Removed from saved jobs' : 'Job saved successfully');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error('Failed to save job');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatBudget = (job) => {
    if (!job.budget) return 'Not specified';
    
    if (job.budget_type === 'hourly') {
      return `$${job.budget}/hour`;
    }
    
    return `$${job.budget}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Job Details</h3>
          <p className="text-gray-600">Fetching job information...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
        <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
        <Link to="/find-work" className="btn-primary inline-flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Find Work
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link 
          to="/find-work" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Job Header */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                  {job.is_featured && (
                    <span className="px-3 py-1 bg-primary-50 text-primary-700 text-sm font-medium rounded-full flex items-center">
                      <Zap className="w-4 h-4 mr-1" />
                      Featured
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
                  <div className="flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    <span className="font-medium">{job.client?.company_name || job.client?.full_name || 'Anonymous Client'}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>{job.location || 'Remote'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    <span>Posted {formatDate(job.posted_at || job.created_at)}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {formatBudget(job)}
                    </div>
                    <div className="text-sm text-gray-600">Budget</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {job.duration || 'Not specified'}
                    </div>
                    <div className="text-sm text-gray-600">Duration</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {job.proposals_count || 0}
                    </div>
                    <div className="text-sm text-gray-600">Proposals</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {job.experience_level || 'Any'}
                    </div>
                    <div className="text-sm text-gray-600">Experience</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-4 md:mt-0 md:ml-6">
                <button
                  onClick={handleApplyNow}
                  disabled={applying}
                  className="btn-primary py-3 px-6 flex items-center justify-center text-lg font-medium"
                >
                  {applying ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Apply Now
                    </>
                  )}
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveJob}
                    className={`flex-1 py-3 px-4 border rounded-xl flex items-center justify-center ${
                      isSaved 
                        ? 'border-primary-600 text-primary-600 bg-primary-50' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isSaved ? 'fill-primary-600' : ''}`} />
                  </button>
                  <button className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 flex items-center justify-center">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                {['overview', 'skills', 'client', 'proposals'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h3>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 whitespace-pre-line">
                        {job.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {job.required_skills && job.required_skills.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.required_skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-primary-50 text-primary-700 font-medium rounded-full border border-primary-100"
                          >
                            {typeof skill === 'string' ? skill : skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Required Skills & Expertise</h3>
                    <ul className="space-y-3">
                      {job.required_skills && job.required_skills.map((skill, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{typeof skill === 'string' ? skill : skill.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'client' && job.client && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                      {job.client.company_name ? (
                        <Building className="w-8 h-8 text-gray-500" />
                      ) : (
                        <Users className="w-8 h-8 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {job.client.company_name || job.client.full_name || 'Anonymous Client'}
                      </h3>
                      <p className="text-gray-600">
                        {job.client.description || 'No description available.'}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        {job.client.rating && (
                          <div className="flex items-center">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 mr-1" />
                            <span className="font-medium">{job.client.rating}</span>
                            <span className="text-gray-500 ml-1">({job.client.review_count || 0} reviews)</span>
                          </div>
                        )}
                        {job.client.member_since && (
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-1" />
                            Member since {job.client.member_since}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'proposals' && (
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">View Proposals</h3>
                    <p className="text-gray-600 mb-6">
                      You need to submit a proposal to view other proposals for this job.
                    </p>
                    <button
                      onClick={handleApplyNow}
                      className="btn-primary"
                    >
                      Apply to View Proposals
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Similar Jobs */}
          {similarJobs.length > 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Jobs</h2>
              <div className="space-y-4">
                {similarJobs.slice(0, 3).map((similarJob) => (
                  <div 
                    key={similarJob.id}
                    onClick={() => navigate(`/jobs/${similarJob.id}`)}
                    className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/20 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{similarJob.title}</h4>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <span className="mr-3">{similarJob.client?.company_name || 'Client'}</span>
                          <span className="mr-3">•</span>
                          <span>{similarJob.location || 'Remote'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {similarJob.required_skills?.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {typeof skill === 'string' ? skill : skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatBudget(similarJob)}</div>
                        <div className="text-sm text-gray-500">{similarJob.budget_type} Budget</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Job Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Job Type</span>
                <span className="font-medium">{job.budget_type || 'Fixed Price'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Experience Level</span>
                <span className="font-medium capitalize">{job.experience_level || 'Any'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Estimated Duration</span>
                <span className="font-medium">{job.duration || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Proposals</span>
                <span className="font-medium">{job.proposals_count || 0} submitted</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Client Location</span>
                <span className="font-medium">{job.client?.country || 'International'}</span>
              </div>
            </div>
          </div>

          {/* Why Work on This Job */}
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-6 border border-primary-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Work on This Job?</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Award className="w-5 h-5 text-primary-600 mr-3" />
                <span className="text-gray-700">Client has good payment history</span>
              </li>
              <li className="flex items-center">
                <ThumbsUp className="w-5 h-5 text-primary-600 mr-3" />
                <span className="text-gray-700">Clear project requirements</span>
              </li>
              <li className="flex items-center">
                <UserCheck className="w-5 h-5 text-primary-600 mr-3" />
                <span className="text-gray-700">Client is responsive</span>
              </li>
              <li className="flex items-center">
                <Shield className="w-5 h-5 text-primary-600 mr-3" />
                <span className="text-gray-700">Payment protection</span>
              </li>
            </ul>
          </div>

          {/* Application Tips */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Tips</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Customize your proposal for this specific job</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Highlight relevant experience in your cover letter</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Provide samples of similar work if available</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Be clear about your availability and timeline</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsPage;