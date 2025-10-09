import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaReddit, FaSearch, FaPlus, FaBell, FaUserCircle } from 'react-icons/fa';
import { useAppSelector, useAppDispatch } from '../hooks/reduxHooks';
import { logout } from '../features/auth/authSlice';

const Navbar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setShowDropdown(false);
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <FaReddit className="text-reddit-orange text-3xl mr-2" />
            <span className="font-bold text-xl hidden sm:inline">reddis</span>
          </Link>

          {/* Search Bar */}
          <form 
            onSubmit={handleSearch}
            className="flex-1 max-w-2xl mx-4 hidden md:block"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search Reddis"
                className="w-full bg-reddit-gray border border-gray-300 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-reddit-blue focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-3 text-gray-500" />
            </div>
          </form>

          {/* Auth Buttons / User Menu */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <button 
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                  onClick={() => navigate('/submit')}
                >
                  <FaPlus />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative">
                  <FaBell />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="relative">
                  <button 
                    className="flex items-center space-x-1 p-1 rounded hover:bg-gray-100"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <FaUserCircle className="text-2xl text-gray-500" />
                    <span className="hidden md:inline text-sm font-medium">
                      {user.username}
                    </span>
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        to={`/u/${user.username}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-1 text-sm font-medium text-blue-500 border border-blue-500 rounded-full hover:bg-blue-50"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1 text-sm font-medium text-white bg-blue-500 rounded-full hover:bg-blue-600"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
