import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Briefcase, 
  Users, 
  MessageSquare, 
  Home,
  FileText,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  PlusCircle,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const clientNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Post a Job', href: '/post-job', icon: PlusCircle },
    { name: 'Find Freelancers', href: '/freelancers', icon: Users },
    { name: 'My Jobs', href: '/my-jobs', icon: Briefcase },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
  ];

  const freelancerNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Find Work', href: '/find-work', icon: Search },
    { name: 'My Proposals', href: '/proposals', icon: FileText },
    { name: 'My Contracts', href: '/contracts', icon: Briefcase },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
  ];

  const navigation = user?.user_type === 'client' ? clientNavigation : freelancerNavigation;

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
  };

  if (!user) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/dashboard" className="flex items-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    SkillSync
                  </div>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:ml-10 md:flex md:space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        isActive(item.href)
                          ? 'bg-primary-50 text-primary-600 border border-primary-100'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              {user?.user_type === 'freelancer' && (
                <div className="hidden md:block relative">
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              )}

              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Messages */}
              <Link
                to="/messages"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              >
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
              </Link>

              {/* Balance for freelancers */}
              {user?.user_type === 'freelancer' && (
                <div className="hidden md:flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">$0.00</span>
                </div>
              )}

              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center space-x-3 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{user?.user_type}</div>
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                  <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                  <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-600" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-base font-medium ${
                      isActive(item.href)
                        ? 'bg-primary-50 text-primary-600 border border-primary-100'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
                SkillSync
              </div>
              <p className="text-gray-600 text-sm">
                Connecting businesses with top freelance talent worldwide.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">For Freelancers</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/find-work" className="hover:text-primary-600">Find Work</Link></li>
                <li><Link to="/profile" className="hover:text-primary-600">Profile</Link></li>
                <li><Link to="/portfolio" className="hover:text-primary-600">Portfolio</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">For Clients</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/freelancers" className="hover:text-primary-600">Find Talent</Link></li>
                <li><Link to="/post-job" className="hover:text-primary-600">Post a Job</Link></li>
                <li><Link to="/pricing" className="hover:text-primary-600">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/about" className="hover:text-primary-600">About</Link></li>
                <li><Link to="/contact" className="hover:text-primary-600">Contact</Link></li>
                <li><Link to="/privacy" className="hover:text-primary-600">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-600">
            © {new Date().getFullYear()} SkillSync. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;