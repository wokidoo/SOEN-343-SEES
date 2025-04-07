'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import api from '../utils/api';

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className = '' }) => {
  const router = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{first_name: string, last_name: string} | null>(null);
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Your Events', path: '/my-event' },
    { name: 'Create Event', path: '/create-event' },
    { name: 'Your Profile', path: '/profile-page' },
    { name: 'Logout', path: '/login' },
  ];

  // Fetch current user data when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.get('/api/profile/');
          setCurrentUser(response.data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Generate display name based on user data
  const displayName = currentUser 
    ? `${currentUser.first_name} ${currentUser.last_name}` 
    : 'Loading...';

  return (
    <nav className={`bg-white shadow-md ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-lg font-semibold" style={{ color: '#08090A' }}>
                {displayName}
              </span>
            </div>
          </div>          
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link 
                href={item.path} 
                key={item.name}
                className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium h-full transition-colors duration-200
                  ${router === item.path
                    ? 'font-semibold'
                    : 'border-transparent hover:text-opacity-80'
                  }`}
                style={{ 
                  color: router === item.path ? '#72A276' : '#666B6A',
                  borderColor: router === item.path ? '#86CD82' : 'transparent'
                }}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md"
              style={{ color: '#666B6A' }}
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg 
                className="block h-6 w-6" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  router === item.path ? 'font-semibold' : ''
                }`}
                style={{ 
                  backgroundColor: router === item.path ? '#EAF6FF' : 'transparent',
                  color: router === item.path ? '#72A276' : '#666B6A' 
                }}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;