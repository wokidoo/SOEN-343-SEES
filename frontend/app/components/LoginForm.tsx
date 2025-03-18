'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { userService } from '../utils/api';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await userService.login({ email, password });
      setSuccess(true);
      setUserData(response);
      // Clear form
      setEmail('');
      setPassword('');
      
      // Redirect after a delay if needed
      // setTimeout(() => {
      //   router.push('/dashboard');
      // }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#86CD82] border border-[#72A276] text-[#08090A] px-4 py-3 rounded">
        <h3 className="font-bold mb-2">Login Successful!</h3>
        <p>Welcome, {userData?.first_name} {userData?.last_name}!</p>
        <p className="text-sm mt-2">You are now logged in.</p>
        {/* You can add navigation buttons here */}
        <div className="mt-4 flex space-x-4">
          <Link href="/dashboard" className="bg-[#72A276] text-white px-4 py-2 rounded hover:bg-[#666B6A]">
            Go to Dashboard
          </Link>
          <button 
            className="text-sm text-[#08090A] underline"
            onClick={() => setSuccess(false)}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl mb-6 text-center font-bold text-[#08090A]">Sign In</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-[#666B6A] text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-[#08090A] leading-tight focus:outline-none focus:shadow-outline focus:border-[#86CD82]"
            id="email"
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-[#666B6A] text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-[#08090A] leading-tight focus:outline-none focus:shadow-outline focus:border-[#86CD82]"
            id="password"
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <button
            className="bg-[#86CD82] hover:bg-[#72A276] text-[#08090A] font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
        
        <div className="text-center text-sm">
          <span className="text-[#666B6A]">Don't have an account? </span>
          <Link href="/register" className="text-[#86CD82] hover:text-[#72A276]">
            Register
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;