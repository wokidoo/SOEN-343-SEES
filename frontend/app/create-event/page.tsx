import type { NextPage } from 'next';
import Head from 'next/head';
import Navbar from '../components/Navbar';

const CreateEvent : NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Dashboard</title>
        <meta name="description" content="Your dashboard application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create Event</h1>
        <p className="mt-2 text-gray-600">Fill in the form below to create a new event.</p>
        
        {/* Event form will go here */}
      </main>
    </div>
  );
};

export default CreateEvent;