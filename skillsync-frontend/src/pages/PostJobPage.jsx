import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Clock, Tag, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { API } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const PostJobPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    budget: '',
    budget_type: 'fixed',
    duration: '',
    skills: '',
    location: '',
    category: 'web'
  });

  const categories = [
    { value: 'web', label: 'Web Development' },
    { value: 'mobile', label: 'Mobile Development' },
    { value: 'design', label: 'Design' },
    { value: 'writing', label: 'Writing' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'data', label: 'Data Science' },
    { value: 'other', label: 'Other' }
  ];

  const durations = [
    { value: '1-2 weeks', label: '1-2 weeks' },
    { value: '1 month', label: '1 month' },
    { value: '1-3 months', label: '1-3 months' },
    { value: '3-6 months', label: '3-6 months' },
    { value: '6+ months', label: '6+ months' },
    { value: 'ongoing', label: 'Ongoing' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJobData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!jobData.title.trim()) newErrors.title = 'Title is required';
    if (!jobData.description.trim()) newErrors.description = 'Description is required';
    if (!jobData.budget || Number(jobData.budget) <= 0) newErrors.budget = 'Valid budget is required';
    if (!jobData.duration) newErrors.duration = 'Duration is required';
    if (!jobData.skills.trim()) newErrors.skills = 'At least one skill is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (user?.user_type !== 'client') {
      toast.error('Only clients can post jobs');
      navigate('/dashboard');
      return;
    }

    setLoading(true);

    try {
      const formattedData = {
        ...jobData,
        budget: Number(jobData.budget),
        skills: jobData.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
        status: 'open'
      };

      await API.jobs.create(formattedData);
      
      toast.success('Job posted successfully!');
      navigate('/my-jobs');
    } catch (error) {
      console.error('Failed to post job:', error);
      toast.error(error.response?.data?.detail || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Post a New Job</h1>
        <p className="text-gray-600 mt-2">Fill out the details below to find the perfect freelancer</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={jobData.title}
                onChange={handleChange}
                className={`input-field ${errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="e.g., React Developer for E-commerce Website"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={jobData.description}
                onChange={handleChange}
                rows={6}
                className={`input-field ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Describe the project in detail..."
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={jobData.category}
                  onChange={handleChange}
                  className="input-field"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Optional)
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={jobData.location}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Remote, New York, etc."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Budget & Duration */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Budget & Duration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="budget_type"
                    value="fixed"
                    checked={jobData.budget_type === 'fixed'}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Fixed Price</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="budget_type"
                    value="hourly"
                    checked={jobData.budget_type === 'hourly'}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Hourly</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                Budget ($) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="budget"
                  name="budget"
                  type="number"
                  min="1"
                  value={jobData.budget}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.budget ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="e.g., 1000"
                />
              </div>
              {errors.budget && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.budget}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Expected Duration *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  id="duration"
                  name="duration"
                  value={jobData.duration}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.duration ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                >
                  <option value="">Select duration</option>
                  {durations.map((duration) => (
                    <option key={duration.value} value={duration.value}>
                      {duration.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.duration && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.duration}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Skills Required */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Skills Required</h2>
          
          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
              Required Skills (comma separated) *
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="skills"
                name="skills"
                type="text"
                value={jobData.skills}
                onChange={handleChange}
                className={`input-field pl-10 ${errors.skills ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="e.g., React, Node.js, MongoDB, TypeScript"
              />
            </div>
            {errors.skills && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.skills}
              </p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Separate skills with commas. These help freelancers find your job.
            </p>
          </div>
        </div>

        {/* Submit Section */}
        <div className="card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Ready to post your job?</h3>
              <p className="text-gray-600 text-sm">
                Review your job details before posting. You can edit it later if needed.
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-secondary px-8"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-8 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Post Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PostJobPage;