'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, BarChart3, LogOut } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      // Fetch user info
      fetchUserInfo(token);
    }
  }, []);

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserName(data.user.name);
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserName('');
    router.push('/');
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            ReviewInsight
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6 text-sm">
            <Link 
              href="/" 
              className={`hover:text-blue-600 transition-colors ${
                isActive('/') ? 'text-blue-600 font-medium' : 'text-gray-600'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/features" 
              className={`hover:text-blue-600 transition-colors ${
                isActive('/features') ? 'text-blue-600 font-medium' : 'text-gray-600'
              }`}
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className={`hover:text-blue-600 transition-colors ${
                isActive('/pricing') ? 'text-blue-600 font-medium' : 'text-gray-600'
              }`}
            >
              Pricing
            </Link>
            <Link 
              href="/browse" 
              className={`hover:text-blue-600 transition-colors ${
                isActive('/browse') ? 'text-blue-600 font-medium' : 'text-gray-600'
              }`}
            >
              Browse Apps
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Hi, {userName || 'User'}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-600 hover:text-gray-900"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 space-y-3">
            <Link
              href="/"
              className={`block py-2 ${
                isActive('/') ? 'text-blue-600 font-medium' : 'text-gray-600'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/features"
              className={`block py-2 ${
                isActive('/features') ? 'text-blue-600 font-medium' : 'text-gray-600'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className={`block py-2 ${
                isActive('/pricing') ? 'text-blue-600 font-medium' : 'text-gray-600'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/browse"
              className={`block py-2 ${
                isActive('/browse') ? 'text-blue-600 font-medium' : 'text-gray-600'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Browse Apps
            </Link>
            
            <div className="pt-3 border-t space-y-3">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block py-2 text-gray-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <div className="py-2 text-gray-700">
                    Hi, {userName || 'User'}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 py-2 text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block py-3 bg-blue-600 text-white text-center rounded-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

