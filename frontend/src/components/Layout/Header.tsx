import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, ShoppingCart, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { cart } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  if (!currentUser) return null;

  return (
    <header className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 transition-colors">
            <Leaf className="h-8 w-8" />
            <span className="text-xl font-bold">EcoFinds</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') ? 'text-emerald-600 bg-emerald-50' : 'text-gray-700 hover:text-emerald-600'
              }`}
            >
              Browse
            </Link>
            <Link
              to="/my-listings"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/my-listings') ? 'text-emerald-600 bg-emerald-50' : 'text-gray-700 hover:text-emerald-600'
              }`}
            >
              My Listings
            </Link>
            <Link
              to="/purchases"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/purchases') ? 'text-emerald-600 bg-emerald-50' : 'text-gray-700 hover:text-emerald-600'
              }`}
            >
              Purchases
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <Link
              to="/cart"
              className="relative p-2 text-gray-700 hover:text-emerald-600 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Link>
            <Link
              to="/dashboard"
              className="p-2 text-gray-700 hover:text-emerald-600 transition-colors"
            >
              <User className="h-6 w-6" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-700 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-4 py-2 space-x-4 flex">
          <Link
            to="/"
            className={`flex-1 text-center py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/') ? 'text-emerald-600 bg-emerald-50' : 'text-gray-700'
            }`}
          >
            Browse
          </Link>
          <Link
            to="/my-listings"
            className={`flex-1 text-center py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/my-listings') ? 'text-emerald-600 bg-emerald-50' : 'text-gray-700'
            }`}
          >
            Listings
          </Link>
          <Link
            to="/purchases"
            className={`flex-1 text-center py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/purchases') ? 'text-emerald-600 bg-emerald-50' : 'text-gray-700'
            }`}
          >
            Purchases
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;