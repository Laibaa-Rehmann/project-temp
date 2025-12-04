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
  Loader2
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
  const navigate = useNavigate();
  
  // Fetch jobs from backend
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
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
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      setJobs(data.jobs || []);
      setTotalJobs(data.total || 0);
      
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
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
  
  // Handle job application
  const handleApplyToJob = async (jobId) => {
    setApplyingJob(jobId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cover_letter: "I'm interested in this position and would like to apply.",
          proposed_rate: null, // You can add rate input later
          estimated_hours: null // You can add hours input later
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to apply');
      }
      
      const data = await response.json();
      toast.success('Successfully applied!');
      
      // Navigate to job details or proposals page
      navigate(`/jobs/${jobId}`, { state: { applied: true } });
      
    } catch (error) {
      console.error('Error applying to job:', error);
      toast.error('Failed to apply. Please try again.');
    } finally {
      setApplyingJob(null);
    }
  };
  
  // Fetch job details (for when user clicks "Apply Now")
  const fetchJobDetails = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load job details');
      }
      
      const data = await response.json();
      return data.job;
      
    } catch (error) {
      console.error('Error fetching job details:', error);
      throw error;
    }
  };
  
  // Enhanced apply handler that fetches details first
  const handleApplyWithDetails = async (jobId) => {
    setApplyingJob(jobId);
    try {
      // First fetch job details
      const jobDetails = await fetchJobDetails(jobId);
      
      // Show job details in a modal or navigate to details page
      // For now, we'll navigate to job details page
      navigate(`/jobs/${jobId}`, { 
        state: { 
          job: jobDetails,
          fromApply: true 
        } 
      });
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load job details');
      
      // If details fail, try direct application
      try {
        await handleApplyToJob(jobId);
      } catch (applyError) {
        // Already handled in handleApplyToJob
      }
    } finally {
      setApplyingJob(null);
    }
  };
  
  useEffect(() => {
    fetchJobs();
    fetchCategories();
  }, [filters.page]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filters change
    }));
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
  };
  
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
  
  const toggleSaveJob = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (savedJobs.has(jobId)) {
        // Remove from saved
        await fetch(`http://localhost:8000/api/jobs/${jobId}/unsave`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setSavedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        toast.success('Removed from saved jobs');
      } else {
        // Add to saved
        await fetch(`http://localhost:8000/api/jobs/${jobId}/save`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setSavedJobs(prev => new Set(prev).add(jobId));
        toast.success('Job saved successfully');
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to update saved jobs');
    }
  };
  
  const JobCard = ({ job }) => (
    <div className={`bg-white rounded-xl p-6 shadow-sm border ${job.featured ? 'border-primary-200 border-2' : 'border-gray-100'} hover:shadow-md transition-all duration-200`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate hover:text-primary-600 cursor-pointer"
                onClick={() => navigate(`/jobs/${job.id}`)}>
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
            <div className="flex items-center">
              <Briefcase className="w-4 h-4 mr-1" />
              <span className="font-medium">{job.client?.company_name || 'Company'}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{job.location || 'Remote'}</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span className="text-green-600 font-medium">{job.client?.rating || '4.5'}/5</span>
              <span className="text-gray-400 ml-1">(${job.client?.total_spent || '0'}+)</span>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {job.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {job.required_skills?.slice(0, 4).map((skill, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full"
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
                {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Recently'}
              </span>
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {job.proposals_count || 0} proposals
              </span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.experience_level === 'expert' ? 'bg-purple-100 text-purple-800' : job.experience_level === 'intermediate' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
              {job.experience_level?.charAt(0).toUpperCase() + job.experience_level?.slice(1) || 'Intermediate'}
            </span>
          </div>
        </div>
        
        <div className="text-right ml-4 flex-shrink-0 min-w-[140px]">
          <div className="text-xl font-bold text-gray-900 mb-1">
            {job.budget_type === 'hourly' 
              ? `$${job.budget}/hr` 
              : `$${job.budget}`}
          </div>
          <div className="text-sm text-gray-500 capitalize">
            {job.budget_type || 'fixed'} Budget
          </div>
        </div>
      </div>
      
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button 
          onClick={() => handleApplyWithDetails(job.id)}
          disabled={applyingJob === job.id}
          className="btn-primary py-2 px-6 text-sm flex items-center justify-center whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
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
          onClick={() => toggleSaveJob(job.id)}
          className={`px-4 py-2 border rounded-lg text-sm flex items-center flex-shrink-0 ${savedJobs.has(job.id) ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          <Bookmark className={`w-4 h-4 ${savedJobs.has(job.id) ? 'fill-primary-600' : ''}`} />
        </button>
        <button 
          onClick={() => navigate(`/jobs/${job.id}`)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center"
        >
          View Details
        </button>
      </div>
    </div>
  );
  
  // Pagination
  const totalPages = Math.ceil(totalJobs / filters.limit);
  
  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 btn-primary py-2 px-6"
            >
              Search
            </button>
          </div>
        </form>
        
        {/* Filter Toggle */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-gray-700 hover:text-gray-900"
          >
            <Filter className="w-5 h-5 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {showFilters ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </button>
          
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{jobs.length}</span> of <span className="font-semibold">{totalJobs}</span> jobs
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </button>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    placeholder="Enter skills (comma separated)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                {/* Categories */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Categories</h4>
                  <div className="space-y-2">
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
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
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
                          <span className="text-gray-700">{category.name}</span>
                        </div>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {category.job_count}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Experience Level */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Experience Level</h4>
                  <div className="space-y-2">
                    {[
                      { id: 'all', name: 'All Levels' },
                      { id: 'entry', name: 'Entry Level' },
                      { id: 'intermediate', name: 'Intermediate' },
                      { id: 'expert', name: 'Expert' }
                    ].map(level => (
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
                  <div className="space-y-2">
                    {[
                      { id: 'all', name: 'All Types' },
                      { id: 'hourly', name: 'Hourly' },
                      { id: 'fixed', name: 'Fixed Price' }
                    ].map(type => (
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
                  onClick={fetchJobs}
                  className="w-full btn-primary py-3"
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
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading jobs...</p>
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-6">
              {jobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search filters or check back later</p>
              <button
                onClick={clearFilters}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          )}
          
          {/* Pagination */}
          {jobs.length > 0 && totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center space-x-2">
                <button 
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page <= 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  if (totalPages <= 5) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 border rounded-lg ${filters.page === pageNum ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
                
                {totalPages > 5 && (
                  <>
                    <span className="px-2 text-gray-500">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className={`px-3 py-2 border rounded-lg ${filters.page === totalPages ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                
                <button 
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
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
            <p className="text-gray-600">Work with verified clients who value your expertise</p>
          </div>
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Target className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Matching</h3>
            <p className="text-gray-600">Get matched with jobs that fit your skills and preferences</p>
          </div>
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Secure Payments</h3>
            <p className="text-gray-600">Get paid on time with our escrow protection system</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindWorkPage;