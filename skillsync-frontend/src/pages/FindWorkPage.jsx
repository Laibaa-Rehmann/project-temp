import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search,
  Filter,
  DollarSign,
  Calendar,
  MapPin,
  Briefcase,
  Star,
  Users,
  Clock,
  Zap,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Bookmark,
  TrendingUp,
  Award,
  Target,
  CheckCircle,
  Loader2,
  FileText,
  Eye,
  Heart
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const FindWorkPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingJob, setApplyingJob] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    minBudget: '',
    maxBudget: '',
    skills: '',
    category: 'all',
    experienceLevel: 'all',
    jobType: 'all',
    location: 'all',
    page: 1,
    limit: 10
  });
  const [showFilters, setShowFilters] = useState(false);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [totalJobs, setTotalJobs] = useState(0);
  const [categories, setCategories] = useState([]);
  const [experienceLevels] = useState([
    { id: 'entry', name: 'Entry Level', color: 'bg-green-100 text-green-800' },
    { id: 'intermediate', name: 'Intermediate', color: 'bg-blue-100 text-blue-800' },
    { id: 'expert', name: 'Expert', color: 'bg-purple-100 text-purple-800' }
  ]);
  const [jobTypes] = useState([
    { id: 'hourly', name: 'Hourly' },
    { id: 'fixed', name: 'Fixed Price' }
  ]);
  const navigate = useNavigate();
  
  // Fetch jobs from backend
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.minBudget) params.append('min_budget', filters.minBudget);
      if (filters.maxBudget) params.append('max_budget', filters.maxBudget);
      if (filters.skills) params.append('skills', filters.skills);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.experienceLevel !== 'all') params.append('experience_level', filters.experienceLevel);
      if (filters.jobType !== 'all') params.append('job_type', filters.jobType);
      if (filters.location !== 'all') params.append('location', filters.location);
      params.append('page', filters.page);
      params.append('limit', filters.limit);
      
      const response = await fetch(`http://localhost:8000/api/jobs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched jobs:', data);
      setJobs(data.jobs || []);
      setTotalJobs(data.total || 0);
      
      // Initialize saved jobs
      if (data.saved_jobs) {
        setSavedJobs(new Set(data.saved_jobs));
      }
      
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs. Please try again.');
      setJobs([]);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('http://localhost:8000/api/jobs/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  // Fetch saved jobs from backend
  const fetchSavedJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('http://localhost:8000/api/jobs/saved', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const savedJobIds = data.saved_jobs?.map(job => job.id) || [];
        setSavedJobs(new Set(savedJobIds));
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    }
  };
  
  // Handle job application
  const handleApplyToJob = async (jobId) => {
    if (applyingJob === jobId) return;
    
    setApplyingJob(jobId);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }
      
      // First check if user already applied
      const checkResponse = await fetch(`http://localhost:8000/api/jobs/${jobId}/check-application`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.applied) {
          toast.error('You have already applied to this job');
          navigate(`/jobs/${jobId}`);
          return;
        }
      }
      
      // Navigate to application page with job data
      const job = jobs.find(j => j.id === jobId);
      navigate(`/jobs/${jobId}/apply`, { 
        state: { 
          job,
          fromFindWork: true 
        } 
      });
      
    } catch (error) {
      console.error('Error checking application:', error);
      // If check fails, still navigate to job details
      navigate(`/jobs/${jobId}`);
    } finally {
      setApplyingJob(null);
    }
  };
  
  // Toggle save job
  const toggleSaveJob = async (jobId, e) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to save jobs');
        navigate('/login');
        return;
      }
      
      const isCurrentlySaved = savedJobs.has(jobId);
      
      // Optimistic update
      setSavedJobs(prev => {
        const newSet = new Set(prev);
        if (isCurrentlySaved) {
          newSet.delete(jobId);
        } else {
          newSet.add(jobId);
        }
        return newSet;
      });
      
      const endpoint = isCurrentlySaved ? 'unsave' : 'save';
      const response = await fetch(`http://localhost:8000/api/jobs/${jobId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Revert optimistic update on error
        setSavedJobs(prev => {
          const newSet = new Set(prev);
          if (isCurrentlySaved) {
            newSet.add(jobId);
          } else {
            newSet.delete(jobId);
          }
          return newSet;
        });
        throw new Error(`Failed to ${endpoint} job`);
      }
      
      toast.success(isCurrentlySaved ? 'Removed from saved jobs' : 'Job saved successfully');
      
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error(`Failed to ${savedJobs.has(jobId) ? 'remove from saved jobs' : 'save job'}`);
    }
  };
  
  // Fetch all data
  useEffect(() => {
    fetchJobs();
    fetchCategories();
    fetchSavedJobs();
  }, [filters.page]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filters change
    }));
  };
  
  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      minBudget: '',
      maxBudget: '',
      skills: '',
      category: 'all',
      experienceLevel: 'all',
      jobType: 'all',
      location: 'all',
      page: 1,
      limit: 10
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchJobs();
  };
  
  // Format date
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
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Format budget
  const formatBudget = (job) => {
    if (!job.budget) return 'Not specified';
    
    if (job.budget_type === 'hourly') {
      return `$${job.budget}/hr`;
    }
    
    return `$${job.budget}`;
  };
  
  // JobCard component
  const JobCard = ({ job }) => {
    const experienceLevel = experienceLevels.find(level => level.id === job.experience_level) || experienceLevels[1];
    
    return (
      <div 
        className={`bg-white rounded-xl p-6 shadow-sm border ${job.is_featured ? 'border-primary-200 border-2' : 'border-gray-100'} hover:shadow-md transition-all duration-200 cursor-pointer`}
        onClick={() => navigate(`/jobs/${job.id}`)}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate hover:text-primary-600">
                {job.title}
              </h3>
              {job.is_featured && (
                <span className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0">
                  <Zap className="w-3 h-3 inline mr-1" />
                  Featured
                </span>
              )}
            </div>
            
            <div className="flex items-center text-gray-600 text-sm mb-3 flex-wrap gap-2">
              {job.client?.company_name && (
                <div className="flex items-center bg-gray-50 px-2 py-1 rounded">
                  <Briefcase className="w-3 h-3 mr-1 text-gray-500" />
                  <span className="font-medium truncate">{job.client.company_name}</span>
                </div>
              )}
              {job.location && (
                <div className="flex items-center bg-gray-50 px-2 py-1 rounded">
                  <MapPin className="w-3 h-3 mr-1 text-gray-500" />
                  <span className="truncate">{job.location}</span>
                </div>
              )}
              {job.client?.rating && (
                <div className="flex items-center bg-gray-50 px-2 py-1 rounded">
                  <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{job.client.rating}</span>
                  {job.client.total_spent && (
                    <span className="text-gray-500 ml-1 text-xs">(${job.client.total_spent}+)</span>
                  )}
                </div>
              )}
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {job.description || 'No description available'}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {job.required_skills?.slice(0, 4).map((skill, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full border border-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilters(prev => ({ ...prev, skills: skill, page: 1 }));
                  }}
                >
                  {typeof skill === 'string' ? skill : skill.name}
                </span>
              ))}
              {job.required_skills?.length > 4 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm font-medium rounded-full">
                  +{job.required_skills.length - 4} more
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(job.posted_at || job.created_at)}
                </span>
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  {job.proposals_count || 0} proposals
                </span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${experienceLevel.color}`}>
                {experienceLevel.name}
              </span>
            </div>
          </div>
          
          <div 
            className="text-right ml-4 flex-shrink-0 min-w-[140px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xl font-bold text-gray-900 mb-1">
              {formatBudget(job)}
            </div>
            <div className="text-sm text-gray-500 capitalize">
              {job.budget_type || 'fixed'} Budget
            </div>
          </div>
        </div>
        
        <div 
          className="flex gap-3 pt-4 border-t border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => handleApplyToJob(job.id)}
            disabled={applyingJob === job.id}
            className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applyingJob === job.id ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Briefcase className="w-4 h-4 mr-2" />
                Apply Now
              </>
            )}
          </button>
          <button 
            onClick={(e) => toggleSaveJob(job.id, e)}
            className={`px-4 py-2.5 border rounded-lg text-sm flex items-center justify-center ${savedJobs.has(job.id) ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            title={savedJobs.has(job.id) ? 'Remove from saved' : 'Save job'}
          >
            {savedJobs.has(job.id) ? (
              <Heart className="w-4 h-4 fill-primary-600 text-primary-600" />
            ) : (
              <Heart className="w-4 h-4" />
            )}
          </button>
          <button 
            onClick={() => navigate(`/jobs/${job.id}`)}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };
  
  // Pagination
  const totalPages = Math.ceil(totalJobs / filters.limit);
  
  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, filters.page - 2);
      let end = Math.min(totalPages, filters.page + 2);
      
      if (end - start + 1 < maxVisible) {
        if (start === 1) {
          end = maxVisible;
        } else {
          start = totalPages - maxVisible + 1;
        }
      }
      
      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Find Work
        </h1>
        <p className="text-gray-600 mb-6">
          Browse thousands of job opportunities matched to your skills
        </p>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search jobs by title, skills, or description..."
              className="w-full pl-12 pr-32 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-gray-600 hover:text-gray-900 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded"
              >
                <Filter className="w-4 h-4 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <button
                type="submit"
                className="btn-primary py-2 px-6 text-sm"
              >
                Search
              </button>
            </div>
          </div>
        </form>
        
        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{jobs.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalJobs}</span> jobs
          </div>
          
          {totalJobs > 0 && (
            <div className="flex gap-2">
              <select
                value={filters.limit}
                onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <div className="flex gap-2">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center px-3 py-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center px-3 py-1 hover:bg-gray-100 rounded lg:hidden"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Budget Range */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Budget Range ($)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Min</label>
                      <input
                        type="number"
                        name="minBudget"
                        value={filters.minBudget}
                        onChange={handleFilterChange}
                        placeholder="0"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Max</label>
                      <input
                        type="number"
                        name="maxBudget"
                        value={filters.maxBudget}
                        onChange={handleFilterChange}
                        placeholder="10000"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Skills */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Skills</h4>
                  <input
                    type="text"
                    name="skills"
                    value={filters.skills}
                    onChange={handleFilterChange}
                    placeholder="e.g., React, Python, Design"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                {/* Categories */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Categories</h4>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    <label className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          value="all"
                          checked={filters.category === 'all'}
                          onChange={handleFilterChange}
                          className="mr-3"
                        />
                        <span className="text-gray-700">All Categories</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {totalJobs}
                      </span>
                    </label>
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="category"
                            value={category.id}
                            checked={filters.category === category.id}
                            onChange={handleFilterChange}
                            className="mr-3"
                          />
                          <span className="text-gray-700 truncate">{category.name}</span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {category.job_count || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Experience Level */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Experience Level</h4>
                  <div className="space-y-1">
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="experienceLevel"
                        value="all"
                        checked={filters.experienceLevel === 'all'}
                        onChange={handleFilterChange}
                        className="mr-3"
                      />
                      <span className="text-gray-700">All Levels</span>
                    </label>
                    {experienceLevels.map(level => (
                      <label key={level.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="radio"
                          name="experienceLevel"
                          value={level.id}
                          checked={filters.experienceLevel === level.id}
                          onChange={handleFilterChange}
                          className="mr-3"
                        />
                        <span className="text-gray-700">{level.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Job Type */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Job Type</h4>
                  <div className="space-y-1">
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="jobType"
                        value="all"
                        checked={filters.jobType === 'all'}
                        onChange={handleFilterChange}
                        className="mr-3"
                      />
                      <span className="text-gray-700">All Types</span>
                    </label>
                    {jobTypes.map(type => (
                      <label key={type.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="radio"
                          name="jobType"
                          value={type.id}
                          checked={filters.jobType === type.id}
                          onChange={handleFilterChange}
                          className="mr-3"
                        />
                        <span className="text-gray-700">{type.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={applyFilters}
                  className="w-full btn-primary py-3 mt-4"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Jobs List */}
        <div className={`${showFilters ? 'lg:w-3/4' : 'w-full'}`}>
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Jobs</h3>
              <p className="text-gray-600">Fetching job opportunities...</p>
            </div>
          ) : jobs.length > 0 ? (
            <>
              <div className="space-y-6">
                {jobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div>
                      Page <span className="font-semibold">{filters.page}</span> of{' '}
                      <span className="font-semibold">{totalPages}</span>
                    </div>
                    <div>
                      Jobs <span className="font-semibold">{(filters.page - 1) * filters.limit + 1}</span> -{' '}
                      <span className="font-semibold">
                        {Math.min(filters.page * filters.limit, totalJobs)}
                      </span> of <span className="font-semibold">{totalJobs}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <nav className="flex items-center space-x-2">
                      <button 
                        onClick={() => handlePageChange(filters.page - 1)}
                        disabled={filters.page <= 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <ChevronUp className="w-4 h-4 mr-1 transform -rotate-90" />
                        Previous
                      </button>
                      
                      {renderPagination().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 min-w-[40px] border rounded-lg ${filters.page === page ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                          >
                            {page}
                          </button>
                        )
                      ))}
                      
                      <button 
                        onClick={() => handlePageChange(filters.page + 1)}
                        disabled={filters.page >= totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        Next
                        <ChevronUp className="w-4 h-4 ml-1 transform rotate-90" />
                      </button>
                    </nav>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {filters.search || filters.category !== 'all' || filters.experienceLevel !== 'all' 
                  ? "We couldn't find any jobs matching your criteria. Try adjusting your search filters."
                  : "No jobs are currently available. Please check back later or explore other categories."}
              </p>
              {(filters.search || filters.category !== 'all' || filters.experienceLevel !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="btn-secondary px-6"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Why Choose SkillSync Section */}
      <div className="mt-12 bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Choose SkillSync?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Award className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Quality Clients</h3>
            <p className="text-gray-600 text-sm">Work with verified clients who value your expertise</p>
          </div>
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Target className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Matching</h3>
            <p className="text-gray-600 text-sm">Get matched with jobs that fit your skills and preferences</p>
          </div>
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Secure Payments</h3>
            <p className="text-gray-600 text-sm">Get paid on time with our escrow protection system</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindWorkPage;