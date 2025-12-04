import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Briefcase, Users, ArrowRight } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex flex-col">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            SkillSync
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Welcome Message */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Join SkillSync Today
                </h1>
                <p className="text-lg text-gray-600">
                  Connect with top talent or find your next opportunity on the world's work marketplace.
                </p>
              </div>

              <div className="space-y-6">
                <div className="card p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-100 text-primary-600 rounded-lg">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">For Clients</h3>
                      <p className="text-gray-600 mb-4">
                        Hire proven professionals for any job, any size.
                      </p>
                      <Link 
                        to="/register?type=client" 
                        className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Hire Talent
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="card p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-secondary-100 text-secondary-600 rounded-lg">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">For Freelancers</h3>
                      <p className="text-gray-600 mb-4">
                        Grow your business and get paid on time.
                      </p>
                      <Link 
                        to="/register?type=freelancer" 
                        className="inline-flex items-center text-secondary-600 hover:text-secondary-700 font-medium"
                      >
                        Find Work
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6 bg-gradient-to-r from-primary-50 to-secondary-50">
                <h3 className="font-bold text-gray-900 mb-3">Why Join SkillSync?</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span>Access to thousands of quality projects</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span>Secure payments with escrow protection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span>24/7 customer support</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Side - Auth Forms */}
            <div className="bg-white card p-8 shadow-xl">
              <Outlet />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} SkillSync. All rights reserved.</p>
          <div className="mt-2 space-x-6">
            <Link to="/privacy" className="hover:text-primary-600">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary-600">Terms of Service</Link>
            <Link to="/contact" className="hover:text-primary-600">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;