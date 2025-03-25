'use client';

import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import axios from 'axios';

const MyEvents: NextPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get('http://127.0.0.1:8000/api/events/')
      .then((response) => {
        setEvents(response.data);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load events.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>My Events</title>
        <meta name="description" content="List of events" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">My Events</h1>
        {loading && <p>Loading events...</p>}
        {error && <p className="mt-2 text-red-500">{error}</p>}
        {!loading && !error && events.length === 0 && (
          <p className="mt-2 text-gray-600">No events found.</p>
        )}
        {!loading && !error && events.length > 0 && (
          <ul className="mt-4 space-y-4">
            {events.map((event) => (
              <li key={event.id} className="border-b pb-2">
                <h2 className="text-xl font-bold">{event.title}</h2>
                <p>{event.description}</p>
                <p>Date: {event.date}</p>
                <p>Type: {event.event_type}</p>
                {event.location && <p>Location: {event.location}</p>}
                {event.virtual_location && <p>Virtual Location: {event.virtual_location}</p>}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

export default MyEvents;
