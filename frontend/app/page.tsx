'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#EAF6FF]">
      <h1 className="text-4xl font-bold mb-8 text-[#08090A]">Welcome to Our App</h1>
      <div className="space-y-4 w-full max-w-xs">
        <Link 
          href="/login" 
          className="block bg-[#86CD82] hover:bg-[#72A276] text-[#08090A] font-bold py-2 px-4 rounded text-center w-full"
        >
          Sign In
        </Link>
        <Link 
          href="/register" 
          className="block bg-[#666B6A] hover:bg-[#72A276] text-white font-bold py-2 px-4 rounded text-center w-full"
        >
          Register
        </Link>
      </div>
    </div>
  );
}