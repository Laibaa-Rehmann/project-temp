import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, MapPin, DollarSign, CheckCircle, Filter, Users } from 'lucide-react';
import { API } from '../utils/api';

const FreelancersPage = () => {
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    minRate: '',
    maxRate: '',
    skills: ''
  });

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const fetchFreelancers = async () => {
    try {
      setLoading(true);
      const data = await API.freelancers.getAll();
      setFreelancers(data || []);
    } catch (error) {
      console.error('Failed to fetch freelancers:', error);
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await API.freelancers.getAll(filters);
      setFreelancers(data || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find Top Freelancers</h1>
          <p className="text-gray-600">Browse talented professionals for your projects</p>
        </div>
        <Link to="/post-job" className="btn-primary">
          Post a Job
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search freelancers by name, skills, or expertise..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <button type="submit" className="btn-primary">
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="number"
              placeholder="Min Hourly Rate ($)"
              value={filters.minRate}
              onChange={(e) => handleFilterChange('minRate', e.target.value)}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Max Hourly Rate ($)"
              value={filters.maxRate}
              onChange={(e) => handleFilterChange('maxRate', e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Skills (comma separated)"
              value={filters.skills}
              onChange={(e) => handleFilterChange('skills', e.target.value)}
              className="input-field"
            />
          </div>
        </form>
      </div>

      {/* Freelancers Grid */}
      {freelancers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freelancers.map((freelancer) => (
            <div key={freelancer.id} className="card p-6 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {freelancer.user?.name?.charAt(0) || 'F'}
                </div>
                <div className="flex-1">
                  <Link to={`/freelancers/${freelancer.id}`} className="text-lg font-bold text-gray-900 hover:text-primary-600">
                    {freelancer.user?.name}
                  </Link>
                  <p className="text-gray-600 text-sm mt-1">{freelancer.title || 'Freelancer'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{freelancer.rating || '5.0'}</span>
                    </div>
                    {freelancer.verified && (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{freelancer.location || 'Remote'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-bold text-gray-900">${freelancer.hourly_rate || 50}</span>
                  <span>/hr</span>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {freelancer.skills?.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs">
                      {skill}
                    </span>
                  ))}
                  {freelancer.skills?.length > 3 && (
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                      +{freelancer.skills.length - 3}
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Link
                    to={`/freelancers/${freelancer.id}`}
                    className="w-full btn-secondary text-center"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No freelancers found</h3>
          <p className="text-gray-600">Try adjusting your search filters</p>
        </div>
      )}
    </div>
  );
};

export default FreelancersPage;