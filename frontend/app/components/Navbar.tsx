'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className = '' }) => {
  const router = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Your Events', path: '/tab1' },
    { name: 'Create Event', path: '/tab2' },
    { name: 'Your Profile', path: '/tab3' },
    { name: 'Logout', path: '/login' },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={`bg-white shadow-md ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-lg font-semibold text-gray-800">Charles Partous</span>
            </div>
          </div>          
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link 
                href={item.path} 
                key={item.name}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full
                  ${router.pathname === item.path
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
        </div>
      </div>
    </nav>
  );
};

export default Navbar;