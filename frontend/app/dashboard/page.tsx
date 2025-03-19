// pages/index.tsx
import type { NextPage } from 'next';
import Head from 'next/head';
import Navbar from '../components/Navbar';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Dashboard</title>
        <meta name="description" content="Your dashboard application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard Content</h1>
            <p className="mt-2 text-gray-600">The dashboard content can go here.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;