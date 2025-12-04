import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  FileText, 
  MessageSquare,
  Calendar,
  Award,
  Star,
  Users,
  MapPin,
  ArrowRight,
  Search,
  Zap,
  Target,
  PieChart,
  BarChart3,
  MessageCircle,
  UserCheck,
  Award as Trophy,
  ThumbsUp,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    activeProposals: 0,
    interviews: 0,
    activeContracts: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    profileCompletion: 0,
    responseRate: 0,
    jobSuccessScore: 0,
    avgResponseTime: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Pagination state for jobs
  const [currentJobPage, setCurrentJobPage] = useState(1);
  const [jobViewMode, setJobViewMode] = useState('list'); // 'list' or 'grid'
  const jobsPerPage = 3;

  // Calculate jobs to show
  const indexOfLastJob = currentJobPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = recommendedJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalJobPages = Math.ceil(recommendedJobs.length / jobsPerPage);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || 'null');
      setUser(userData);
      
      if (!token) {
        toast.error('Please login first');
        return;
      }
      
      console.log('Fetching dashboard data...');
      
      // Create headers object
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Fetch all endpoints in parallel
      const [statsResponse, activityResponse, jobsResponse, interviewsResponse] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/dashboard/stats', { headers }).catch(err => {
          console.error('Stats fetch error:', err);
          return { ok: false, status: 500 };
        }),
        fetch('http://127.0.0.1:8000/api/dashboard/activity', { headers }).catch(err => {
          console.error('Activity fetch error:', err);
          return { ok: false, status: 500 };
        }),
        fetch('http://127.0.0.1:8000/api/dashboard/recommended-jobs', { headers }).catch(err => {
          console.error('Jobs fetch error:', err);
          return { ok: false, status: 500 };
        }),
        fetch('http://127.0.0.1:8000/api/dashboard/upcoming-interviews', { headers }).catch(err => {
          console.error('Interviews fetch error:', err);
          return { ok: false, status: 500 };
        })
      ]);
      
      console.log('API Responses:', {
        stats: statsResponse.status,
        activity: activityResponse.status,
        jobs: jobsResponse.status,
        interviews: interviewsResponse.status
      });
      
      // Handle stats response
      let statsData = {
        active_proposals: 0,
        interviews: 0,
        active_contracts: 0,
        total_earnings: 0,
        pending_earnings: 0,
        profile_completion: userData?.profile_completion || 0,
        response_rate: 0,
        job_success_score: 0,
        avg_response_time_hours: 0
      };
      
      if (statsResponse.ok) {
        try {
          statsData = await statsResponse.json();
        } catch (e) {
          console.error('Error parsing stats JSON:', e);
        }
      } else {
        console.warn('Stats endpoint failed:', statsResponse.status);
      }
      
      // Handle activity response
      let activityData = [];
      if (activityResponse.ok) {
        try {
          activityData = await activityResponse.json();
        } catch (e) {
          console.error('Error parsing activity JSON:', e);
        }
      } else {
        console.warn('Activity endpoint failed:', activityResponse.status);
      }
      
      // Handle jobs response
      let jobsData = [];
      if (jobsResponse.ok) {
        try {
          jobsData = await jobsResponse.json();
        } catch (e) {
          console.error('Error parsing jobs JSON:', e);
        }
      } else {
        console.warn('Jobs endpoint failed:', jobsResponse.status);
      }
      
      // Handle interviews response
      let interviewsData = { interviews: [] };
      if (interviewsResponse.ok) {
        try {
          interviewsData = await interviewsResponse.json();
        } catch (e) {
          console.error('Error parsing interviews JSON:', e);
        }
      } else {
        console.warn('Interviews endpoint failed:', interviewsResponse.status);
      }
      
      // Update state with real data
      setStats({
        activeProposals: statsData.active_proposals,
        interviews: statsData.interviews,
        activeContracts: statsData.active_contracts,
        totalEarnings: statsData.total_earnings,
        pendingEarnings: statsData.pending_earnings,
        profileCompletion: statsData.profile_completion,
        responseRate: statsData.response_rate,
        jobSuccessScore: statsData.job_success_score,
        avgResponseTime: statsData.avg_response_time_hours
      });
      
      setRecentActivity(activityData);
      setRecommendedJobs(jobsData);
      setUpcomingInterviews(interviewsData.interviews);
      
      console.log('Dashboard data updated:', {
        stats: statsData,
        activities: activityData.length,
        jobs: jobsData.length,
        interviews: interviewsData.interviews.length
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data. Check console for details.');
      
      // Set fallback data
      setStats({
        activeProposals: 0,
        interviews: 0,
        activeContracts: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        profileCompletion: user?.profile_completion || 0,
        responseRate: 0,
        jobSuccessScore: 0,
        avgResponseTime: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Dashboard mounted');
    console.log('User from localStorage:', user);
    console.log('Current stats:', stats);
    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ icon: Icon, label, value, change, color, prefix = '', suffix = '', onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer ${onClick ? 'hover:border-primary-200' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color} w-12 h-12 flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change !== undefined && (
          <span className="text-sm font-medium text-green-600 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" /> +{change}%
          </span>
        )}
      </div>
      <h3 className="text-3xl font-bold text-gray-900">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </h3>
      <p className="text-gray-600 mt-1">{label}</p>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const getIcon = () => {
      switch(activity.type) {
        case 'proposal': return <FileText className="w-5 h-5" />;
        case 'interview': return <Calendar className="w-5 h-5" />;
        case 'contract': return <Briefcase className="w-5 h-5" />;
        case 'message': return <MessageSquare className="w-5 h-5" />;
        case 'payment': return <DollarSign className="w-5 h-5" />;
        default: return <MessageSquare className="w-5 h-5" />;
      }
    };

    const getStatusColor = () => {
      switch(activity.status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'interviewing': 
        case 'accepted': 
        case 'active': return 'bg-blue-100 text-blue-800';
        case 'hired': 
        case 'completed': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        case 'unread': return 'bg-purple-100 text-purple-800';
        case 'read': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getStatusText = (status) => {
      switch(status) {
        case 'pending': return 'Pending';
        case 'interviewing': return 'Interviewing';
        case 'accepted': return 'Accepted';
        case 'hired': return 'Hired';
        case 'active': return 'Active';
        case 'completed': return 'Completed';
        case 'rejected': return 'Rejected';
        case 'unread': return 'Unread';
        case 'read': return 'Read';
        default: return status;
      }
    };

    const handleActivityClick = () => {
      switch(activity.type) {
        case 'proposal':
          window.location.href = `/proposals`;
          break;
        case 'contract':
          window.location.href = `/contracts`;
          break;
        case 'message':
          window.location.href = `/messages${activity.related_id ? `/${activity.related_id}` : ''}`;
          break;
        default:
          break;
      }
    };

    return (
      <div 
        onClick={handleActivityClick}
        className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group"
      >
        <div className="flex-shrink-0 mr-4">
          <div className={`p-2 rounded-lg ${getStatusColor()} group-hover:scale-110 transition-transform`}>
            {getIcon()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600">
            {activity.title}
          </p>
          <p className="text-sm text-gray-500 truncate">{activity.description}</p>
          <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()} flex-shrink-0`}>
          {getStatusText(activity.status)}
        </span>
      </div>
    );
  };

  const JobCard = ({ job, compact = false }) => {
    const handleApply = () => {
      toast.success('Redirecting to job application...');
      setTimeout(() => {
        window.location.href = `/jobs/${job.id}`;
      }, 1000);
    };

    const handleSave = () => {
      toast.success('Job saved to favorites!');
      // Save job logic here
    };

    if (compact) {
      return (
        <div className={`bg-white rounded-xl p-5 shadow-sm border ${job.is_featured ? 'border-primary-200 border-2' : 'border-gray-100'} hover:shadow-md transition-all duration-200 h-full flex flex-col`}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold text-gray-900 truncate" title={job.title}>
                {job.title}
              </h3>
              {job.is_featured && (
                <span className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0">
                  <Zap className="w-3 h-3 inline mr-1" />
                  Featured
                </span>
              )}
            </div>
            
            <div className="mb-4">
              <div className="text-xl font-bold text-gray-900 mb-1" title={job.budget_display}>
                {job.budget_display}
              </div>
              <div className="text-sm text-gray-500 capitalize mb-3">
                {job.budget_type} budget
              </div>
            </div>
            
            <div className="flex items-center text-gray-600 text-sm mb-3">
              <Users className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
              <span className="truncate">{job.client_name}</span>
            </div>
            
            <div className="flex flex-wrap gap-1.5 mb-4">
              {job.skills_required.slice(0, 3).map((skill, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded border border-gray-200"
                  title={skill}
                >
                  {skill.trim().length > 12 ? skill.trim().substring(0, 12) + '...' : skill.trim()}
                </span>
              ))}
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span className="flex items-center">
                <FileText className="w-3 h-3 mr-1" />
                {job.proposals_count}
              </span>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {job.posted_time}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleApply}
              className="flex-1 btn-primary py-2.5 text-xs flex items-center justify-center"
            >
              <Briefcase className="w-3 h-3 mr-1" />
              Apply
            </button>
            <button 
              onClick={handleSave}
              className="px-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              title="Save job"
            >
              <Star className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`bg-white rounded-xl p-5 shadow-sm border ${job.is_featured ? 'border-primary-200 border-2' : 'border-gray-100'} hover:shadow-md transition-all duration-200`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate" title={job.title}>
                {job.title}
              </h3>
              {job.is_featured && (
                <span className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0">
                  <Zap className="w-3 h-3 inline mr-1" />
                  Featured
                </span>
              )}
            </div>
            
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <Users className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
              <span className="truncate mr-4">{job.client_name}</span>
            </div>
            
            <div className="flex items-center text-gray-600 text-sm mb-4">
              <Target className="w-4 h-4 mr-2 text-gray-400" />
              <span className="capitalize">{job.experience_level || 'Intermediate'}</span>
              <span className="mx-2">•</span>
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              <span className="truncate">{job.location || 'Remote'}</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {job.skills_required.slice(0, 4).map((skill, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-200"
                  title={skill}
                >
                  {skill.trim().length > 15 ? skill.trim().substring(0, 15) + '...' : skill.trim()}
                </span>
              ))}
              {job.skills_required.length > 4 && (
                <span className="px-3 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded-lg border border-gray-200">
                  +{job.skills_required.length - 4} more
                </span>
              )}
            </div>
          </div>
          
          {/* Right side - Price and stats */}
          <div className="text-right flex-shrink-0 min-w-[120px]">
            <div className="text-xl font-bold text-gray-900 mb-1" title={job.budget_display}>
              {job.budget_display}
            </div>
            <div className="text-sm text-gray-500 capitalize mb-3">
              {job.budget_type} budget
            </div>
            
            <div className="flex items-center justify-end text-sm text-gray-500 mb-1">
              <Clock className="w-3 h-3 mr-1" />
              {job.posted_time}
            </div>
            <div className="flex items-center justify-end text-sm text-gray-500">
              <FileText className="w-3 h-3 mr-1" />
              {job.proposals_count} proposals
            </div>
          </div>
        </div>
        
        {/* Description (if available) */}
        {job.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {job.description.length > 120 ? job.description.substring(0, 120) + '...' : job.description}
          </p>
        )}
        
        <div className="flex gap-2">
          <button 
            onClick={handleApply}
            className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center"
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Apply Now
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center"
            title="Save job"
          >
            <Star className="w-4 h-4" />
          </button>
          <button 
            onClick={() => window.location.href = `/jobs/${job.id}`}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center"
            title="View details"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const ProgressRing = ({ percentage, size = 120, strokeWidth = 8 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="fill-none stroke-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="fill-none stroke-primary-600 transition-all duration-1000"
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
        </div>
      </div>
    );
  };

  const InterviewItem = ({ interview }) => (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{interview.job_title}</h4>
          <p className="text-sm text-gray-600">{interview.client_name}</p>
        </div>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
          {interview.meeting_type}
        </span>
      </div>
      <div className="flex items-center text-sm text-gray-700">
        <Calendar className="w-4 h-4 mr-2 text-blue-600" />
        <span className="font-medium">{interview.scheduled_time}</span>
        <span className="mx-2">•</span>
        <Clock className="w-4 h-4 mr-2 text-blue-600" />
        <span>{interview.duration}</span>
      </div>
      <button className="mt-4 w-full py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium transition-colors">
        Join Meeting
      </button>
    </div>
  );

  // Pagination component
  const JobPagination = () => (
    <div className="flex items-center justify-center mt-6">
      <button
        onClick={() => setCurrentJobPage(prev => Math.max(prev - 1, 1))}
        disabled={currentJobPage === 1}
        className="px-3 py-2 mx-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      
      {Array.from({ length: Math.min(totalJobPages, 5) }, (_, i) => {
        let pageNum;
        if (totalJobPages <= 5) {
          pageNum = i + 1;
        } else if (currentJobPage <= 3) {
          pageNum = i + 1;
        } else if (currentJobPage >= totalJobPages - 2) {
          pageNum = totalJobPages - 4 + i;
        } else {
          pageNum = currentJobPage - 2 + i;
        }
        
        return (
          <button
            key={pageNum}
            onClick={() => setCurrentJobPage(pageNum)}
            className={`px-3 py-2 mx-1 text-sm font-medium rounded-lg ${
              currentJobPage === pageNum
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-100'
            }`}
          >
            {pageNum}
          </button>
        );
      })}
      
      <button
        onClick={() => setCurrentJobPage(prev => Math.min(prev + 1, totalJobPages))}
        disabled={currentJobPage === totalJobPages}
        className="px-3 py-2 mx-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Your Dashboard</h3>
          <p className="text-gray-600">Fetching real-time data from the backend...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.full_name || user?.username || 'Freelancer'}!
            </h1>
            <p className="text-gray-600 mt-2">
              Here's your real-time dashboard with live data from the backend.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <Link to="/find-work">
              <button className="btn-primary flex items-center">
                <Search className="w-4 h-4 mr-2" />
                Find New Work
              </button>
            </Link>
            <Link to="/profile">
              <button className="btn-secondary flex items-center">
                <UserCheck className="w-4 h-4 mr-2" />
                Complete Profile
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={FileText}
          label="Active Proposals"
          value={stats.activeProposals}
          color="bg-blue-500"
          onClick={() => window.location.href = '/proposals'}
        />
        <StatCard 
          icon={Calendar}
          label="Upcoming Interviews"
          value={stats.interviews}
          color="bg-purple-500"
          onClick={() => window.location.href = '/proposals?filter=interviewing'}
        />
        <StatCard 
          icon={Briefcase}
          label="Active Contracts"
          value={stats.activeContracts}
          color="bg-green-500"
          onClick={() => window.location.href = '/contracts'}
        />
        <StatCard 
          icon={DollarSign}
          label="Total Earnings"
          value={stats.totalEarnings}
          prefix="$"
          color="bg-yellow-500"
          onClick={() => window.location.href = '/contracts?filter=completed'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile & Metrics */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Completion & Metrics */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Profile & Performance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Profile Completion */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Profile Completion</h3>
                  <span className="text-primary-600 font-bold">{stats.profileCompletion}%</span>
                </div>
                
                <div className="flex justify-center mb-6">
                  <ProgressRing percentage={stats.profileCompletion} />
                </div>
                
                <div className="space-y-3">
                  {[
                    { label: 'Basic Info', completed: user?.full_name && user?.email },
                    { label: 'Profile Title', completed: user?.profile_title },
                    { label: 'Skills & Expertise', completed: user?.skills },
                    { label: 'Hourly Rate', completed: user?.hourly_rate },
                    { label: 'Portfolio', completed: false },
                    { label: 'Verification', completed: user?.verified }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center">
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full mr-3 flex-shrink-0"></div>
                      )}
                      <span className={item.completed ? 'text-gray-700' : 'text-gray-400'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                
                {stats.profileCompletion < 100 && (
                  <Link to="/profile">
                    <button className="mt-6 w-full py-3 border border-primary-600 text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors">
                      Complete Your Profile
                    </button>
                  </Link>
                )}
              </div>

              {/* Performance Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 flex items-center">
                        <ThumbsUp className="w-4 h-4 mr-2 text-green-600" />
                        Response Rate
                      </span>
                      <span className="font-bold text-gray-900">{stats.responseRate}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(stats.responseRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 flex items-center">
                        <Trophy className="w-4 h-4 mr-2 text-yellow-600" />
                        Job Success Score
                      </span>
                      <span className="font-bold text-gray-900">{stats.jobSuccessScore}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(stats.jobSuccessScore, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-blue-600" />
                        Avg Response Time
                      </span>
                      <span className="font-bold text-gray-900">{stats.avgResponseTime}h</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((stats.avgResponseTime / 24) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-purple-600" />
                        Pending Earnings
                      </span>
                      <span className="font-bold text-gray-900">${stats.pendingEarnings.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((stats.pendingEarnings / 10000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              <Link 
                to="/proposals" 
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity yet</p>
                  <p className="text-gray-400 text-sm mt-1">Start by applying to jobs!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Jobs & Interviews */}
        <div className="space-y-8">
          {/* Recommended Jobs with Tabs and Pagination */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recommended Jobs</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {currentJobs.length} of {recommendedJobs.length} jobs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setJobViewMode('list')}
                    className={`p-2 ${jobViewMode === 'list' ? 'bg-gray-100' : 'bg-white'}`}
                    title="List view"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setJobViewMode('grid')}
                    className={`p-2 ${jobViewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
                    title="Grid view"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>
                <Link 
                  to="/find-work" 
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
            
            {/* Job Filters/Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button className="px-4 py-2 text-sm font-medium text-primary-600 border-b-2 border-primary-600">
                Best Matches ({recommendedJobs.length})
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                Saved Jobs
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                Recent
              </button>
            </div>
            
            {/* Job Listings */}
            <div className={jobViewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
              {currentJobs.length > 0 ? (
                currentJobs.map((job) => (
                  <div key={job.id} className={jobViewMode === 'grid' ? 'h-full' : ''}>
                    <JobCard job={job} compact={jobViewMode === 'grid'} />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 col-span-2">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No job recommendations yet</p>
                  <p className="text-gray-400 text-sm mt-1">Complete your profile for better matches</p>
                  <Link to="/profile">
                    <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                      Update Profile
                    </button>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Pagination Controls */}
            {recommendedJobs.length > jobsPerPage && <JobPagination />}
          </div>

          {/* Upcoming Interviews */}
          {upcomingInterviews.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center mb-6">
                <Calendar className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Upcoming Interviews</h2>
              </div>
              
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <InterviewItem key={interview.id} interview={interview} />
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-blue-200">
                <Link to="/proposals">
                  <button className="w-full py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors">
                    View All Interviews
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <Link to="/profile">
                <div className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center cursor-pointer transition-colors">
                  <UserCheck className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-700">Edit Profile</span>
                </div>
              </Link>
              
              <Link to="/find-work">
                <div className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center cursor-pointer transition-colors">
                  <Search className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-700">Find Work</span>
                </div>
              </Link>
              
              <Link to="/proposals">
                <div className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center cursor-pointer transition-colors">
                  <FileText className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-700">My Proposals</span>
                </div>
              </Link>
              
              <Link to="/contracts">
                <div className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center cursor-pointer transition-colors">
                  <Briefcase className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-700">Contracts</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Earnings Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <DollarSign className="w-6 h-6 text-green-600 mr-3" />
            <h3 className="text-lg font-bold text-gray-900">Total Earnings</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">${stats.totalEarnings.toLocaleString()}</p>
          <p className="text-gray-600 text-sm">Lifetime earnings from completed contracts</p>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-6 h-6 text-yellow-600 mr-3" />
            <h3 className="text-lg font-bold text-gray-900">Pending Earnings</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">${stats.pendingEarnings.toLocaleString()}</p>
          <p className="text-gray-600 text-sm">Amount in active contracts</p>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-bold text-gray-900">Avg. Rate</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            ${user?.hourly_rate ? user.hourly_rate.toFixed(2) : '0.00'}/hr
          </p>
          <p className="text-gray-600 text-sm">Your current hourly rate</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;