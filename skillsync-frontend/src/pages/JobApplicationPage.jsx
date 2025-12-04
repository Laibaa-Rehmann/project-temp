import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Briefcase,
  DollarSign,
  Clock,
  FileText,
  Upload,
  X,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  Star,
  Users,
  Target,
  Zap,
  Eye,
  Trash2,
  Link as LinkIcon,
  Paperclip
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const JobApplicationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const job = location.state?.job;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [formData, setFormData] = useState({
    cover_letter: '',
    bid_amount: '',
    estimated_days: '',
    files: [],
    links: ['']
  });
  const [errors, setErrors] = useState({});
  const [jobDetails, setJobDetails] = useState(null);

  useEffect(() => {
    fetchJobDetails();
    checkIfApplied();
  }, [id]);

  const fetchJobDetails = async () => {
    if (job) {
      setJobDetails(job);
      setFormData(prev => ({
        ...prev,
        bid_amount: job.budget_type === 'fixed' ? job.budget_min : '',
      }));
      setLoading(false);
      return;
    }

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
        navigate(`/jobs/${id}`);
        return;
      }

      const data = await response.json();
      setJobDetails(data);
      setFormData(prev => ({
        ...prev,
        bid_amount: data.budget_type === 'fixed' ? data.budget_min : '',
      }));
    } catch (error) {
      console.error('Error fetching job:', error);
      navigate(`/jobs/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:8000/api/jobs/${id}/check-application`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.applied) {
          setHasApplied(true);
          toast.error('You have already applied to this job');
          navigate(`/jobs/${id}`);
        }
      }
    } catch (error) {
      console.error('Error checking application:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (formData.files.length + files.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Only PDF, JPG, PNG, DOC files are allowed`);
        return false;
      }
      
      if (file.size > maxSize) {
        toast.error(`${file.name}: File size must be less than 5MB`);
        return false;
      }
      
      return true;
    });

    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...validFiles]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleLinkChange = (index, value) => {
    const newLinks = [...formData.links];
    newLinks[index] = value;
    setFormData(prev => ({
      ...prev,
      links: newLinks
    }));
  };

  const addLink = () => {
    if (formData.links.length < 5) {
      setFormData(prev => ({
        ...prev,
        links: [...prev.links, '']
      }));
    }
  };

  const removeLink = (index) => {
    if (formData.links.length > 1) {
      setFormData(prev => ({
        ...prev,
        links: prev.links.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cover_letter.trim()) {
      newErrors.cover_letter = 'Cover letter is required';
    } else if (formData.cover_letter.length < 100) {
      newErrors.cover_letter = 'Cover letter should be at least 100 characters';
    }
    
    if (!formData.bid_amount) {
      newErrors.bid_amount = 'Bid amount is required';
    } else if (parseFloat(formData.bid_amount) <= 0) {
      newErrors.bid_amount = 'Bid amount must be greater than 0';
    }
    
    if (!formData.estimated_days) {
      newErrors.estimated_days = 'Estimated timeline is required';
    } else if (parseInt(formData.estimated_days) <= 0) {
      newErrors.estimated_days = 'Timeline must be at least 1 day';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      const applicationData = {
        cover_letter: formData.cover_letter,
        bid_amount: parseFloat(formData.bid_amount),
        estimated_days: parseInt(formData.estimated_days),
        links: formData.links.filter(link => link.trim() !== ''),
        // Files would be handled differently in a real app (upload to S3 first)
      };

      const response = await fetch(`http://localhost:8000/api/jobs/${id}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to submit application');
      }

      const result = await response.json();
      
      toast.success('Application submitted successfully!');
      navigate(`/jobs/${id}`, {
        state: { applicationSubmitted: true }
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatBudget = (job) => {
    if (!job?.budget) return 'Not specified';
    
    if (job.budget_type === 'hourly') {
      return `$${job.budget}/hour`;
    }
    
    return `$${job.budget}`;
  };

  if (loading || hasApplied) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Application</h3>
          <p className="text-gray-600">Preparing application form...</p>
        </div>
      </div>
    );
  }

  if (!jobDetails) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
        <p className="text-gray-600 mb-6">Unable to load job details for application.</p>
        <Link to="/find-work" className="btn-primary inline-flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Find Work
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-8">
        <Link 
          to={`/jobs/${id}`} 
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Job Details
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Application Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Apply for Job</h1>
              <p className="text-gray-600">
                Submit your proposal for: <span className="font-semibold text-gray-900">{jobDetails.title}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Cover Letter */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-lg font-semibold text-gray-900">
                    Cover Letter
                  </label>
                  <span className="text-sm text-gray-500">
                    {formData.cover_letter.length}/1000 characters
                  </span>
                </div>
                <textarea
                  name="cover_letter"
                  value={formData.cover_letter}
                  onChange={handleInputChange}
                  placeholder="Introduce yourself and explain why you're the perfect fit for this job. Highlight your relevant experience and skills..."
                  className={`w-full min-h-[200px] p-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.cover_letter ? 'border-red-300' : 'border-gray-300'
                  }`}
                  maxLength={1000}
                />
                {errors.cover_letter && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.cover_letter}
                  </p>
                )}
                <div className="mt-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
                  Tip: Address the client by name if possible, reference specific requirements from the job description
                </div>
              </div>

              {/* Bid Amount & Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-4">
                    Your Bid
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="bid_amount"
                      value={formData.bid_amount}
                      onChange={handleInputChange}
                      placeholder={jobDetails.budget_type === 'fixed' ? 'Enter your bid amount' : 'Enter hourly rate'}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.bid_amount ? 'border-red-300' : 'border-gray-300'
                      }`}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {errors.bid_amount && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.bid_amount}
                    </p>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    Job budget: <span className="font-semibold">{formatBudget(jobDetails)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-4">
                    Estimated Timeline
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <Clock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="estimated_days"
                      value={formData.estimated_days}
                      onChange={handleInputChange}
                      placeholder="Enter days to complete"
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.estimated_days ? 'border-red-300' : 'border-gray-300'
                      }`}
                      min="1"
                    />
                  </div>
                  {errors.estimated_days && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.estimated_days}
                    </p>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
                    Be realistic about your timeline
                  </div>
                </div>
              </div>

              {/* File Attachments */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Attachments (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Upload portfolio samples, resume, or other relevant files
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Max 5 files, 5MB each. PDF, JPG, PNG, DOC supported.
                  </p>
                  <label className="btn-secondary cursor-pointer">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    Select Files
                  </label>
                </div>
                
                {/* File List */}
                {formData.files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <Paperclip className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Portfolio Links */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Portfolio Links (Optional)
                </label>
                <div className="space-y-3">
                  {formData.links.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                          <LinkIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => handleLinkChange(index, e.target.value)}
                          placeholder="https://example.com/portfolio"
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      {formData.links.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          className="px-4 py-3 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {formData.links.length < 5 && (
                    <button
                      type="button"
                      onClick={addLink}
                      className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
                    >
                      + Add another link
                    </button>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
                  Include links to your portfolio, GitHub, LinkedIn, or previous work
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary py-4 text-lg font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting Proposal...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Proposal
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-sm text-gray-500">
                  By submitting, you agree to our Terms of Service and confirm this proposal doesn't violate any agreements
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Job Summary & Tips */}
        <div className="space-y-6">
          {/* Job Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Briefcase className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Title</div>
                  <div className="font-medium">{jobDetails.title}</div>
                </div>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Budget</div>
                  <div className="font-medium">{formatBudget(jobDetails)}</div>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Experience Level</div>
                  <div className="font-medium capitalize">{jobDetails.experience_level || 'Any'}</div>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Posted</div>
                  <div className="font-medium">
                    {new Date(jobDetails.posted_at || jobDetails.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Proposals</div>
                  <div className="font-medium">{jobDetails.proposals_count || 0} submitted</div>
                </div>
              </div>
            </div>
          </div>

          {/* Application Tips */}
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-6 border border-primary-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips for Success</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Target className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Address specific requirements from the job description</span>
              </li>
              <li className="flex items-start">
                <Star className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Showcase relevant experience with examples</span>
              </li>
              <li className="flex items-start">
                <Zap className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Be clear about your availability and timeline</span>
              </li>
              <li className="flex items-start">
                <Eye className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Proofread your proposal before submitting</span>
              </li>
            </ul>
          </div>

          {/* Why Clients Choose You */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Clients Choose You</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Clear communication and professionalism</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Relevant skills and experience</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Realistic timeline and budget</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Strong portfolio and references</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationPage;