import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Briefcase, 
  Users, 
  TrendingUp, 
  Star, 
  CheckCircle,
  DollarSign,
  MessageSquare,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  const stats = [
    { icon: Users, label: "Active Freelancers", value: "250K+" },
    { icon: Briefcase, label: "Projects Posted", value: "1M+" },
    { icon: DollarSign, label: "Paid to Freelancers", value: "$2B+" },
    { icon: Star, label: "Client Satisfaction", value: "98%" }
  ];

  const features = [
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Escrow protection ensures you only pay for work you approve",
      color: "bg-emerald-100 text-emerald-600"
    },
    {
      icon: CheckCircle,
      title: "Verified Talent",
      description: "All freelancers undergo rigorous verification and skill testing",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Zap,
      title: "Fast Results",
      description: "Get matched with qualified talent within hours, not weeks",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: MessageSquare,
      title: "24/7 Support",
      description: "Round-the-clock customer support for all your needs",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: TrendingUp,
      title: "Growth Tools",
      description: "Analytics and insights to help grow your business",
      color: "bg-amber-100 text-amber-600"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Access talent from around the world",
      color: "bg-cyan-100 text-cyan-600"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Hire the best.<br />
              Work with the best.
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto">
              SkillSync connects businesses with freelance talent across the globe.
              Get your work done faster, smarter, and better.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {isAuthenticated ? (
                user?.user_type === 'client' ? (
                  <Link
                    to="/post-job"
                    className="group bg-white text-primary-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                  >
                    <Briefcase className="w-5 h-5" />
                    Post a Job
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <Link
                    to="/find-work"
                    className="group bg-white text-primary-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                  >
                    <Search className="w-5 h-5" />
                    Find Work
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )
              ) : (
                <>
                  <Link
                    to="/register?type=client"
                    className="group bg-white text-primary-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                  >
                    <Briefcase className="w-5 h-5" />
                    Hire Talent
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/register?type=freelancer"
                    className="group bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                  >
                    <Users className="w-5 h-5" />
                    Find Work
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="card p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="inline-flex p-3 rounded-xl bg-primary-100 text-primary-600 mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900">
          Why Choose SkillSync?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="card p-8 hover:shadow-xl transition-all hover:-translate-y-2">
                <div className={`inline-flex p-4 rounded-2xl ${feature.color} mb-6`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl mx-4 sm:mx-6 lg:mx-8 p-8 md:p-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to get started?
        </h2>
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Join thousands of businesses and freelancers already working on SkillSync
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            user?.user_type === 'client' ? (
              <Link
                to="/post-job"
                className="bg-white text-primary-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all"
              >
                Post Your First Job
              </Link>
            ) : (
              <Link
                to="/find-work"
                className="bg-white text-primary-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all"
              >
                Browse Jobs
              </Link>
            )
          ) : (
            <>
              <Link
                to="/register?type=client"
                className="bg-white text-primary-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all"
              >
                Start Hiring
              </Link>
              <Link
                to="/register?type=freelancer"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transform hover:scale-105 transition-all"
              >
                Start Freelancing
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;