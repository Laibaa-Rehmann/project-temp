import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-9xl font-bold text-primary-100 mb-4">404</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-primary flex items-center justify-center">
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>
          <Link to="/find-work" className="btn-secondary flex items-center justify-center">
            <Search className="w-5 h-5 mr-2" />
            Browse Jobs
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;