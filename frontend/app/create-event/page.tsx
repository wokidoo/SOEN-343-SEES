'use client';

import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function CreateEventPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [eventType, setEventType] = useState('in_person');
  const [location, setLocation] = useState('');
  const [virtualLocation, setVirtualLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/events/', {
        title,
        description,
        date,
        event_type: eventType,
        location,
        virtual_location: virtualLocation
      });
      console.log('Created event:', response.data);
      setSuccess(true);
      // Clear the form
      setTitle('');
      setDescription('');
      setDate('');
      setEventType('in_person');
      setLocation('');
      setVirtualLocation('');
    } catch (err: any) {
      console.error(err);
      setError('Failed to create event. Check your form fields.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Create Event</h1>
        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">Event created successfully!</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold">Title</label>
            <input
              className="border rounded w-full p-2"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold">Description</label>
            <textarea
              className="border rounded w-full p-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold">Date</label>
            <input
              className="border rounded w-full p-2"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold">Event Type</label>
            <select
              className="border rounded w-full p-2"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="in_person">In-Person</option>
              <option value="virtual">Virtual</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold">Location (Physical)</label>
            <input
              className="border rounded w-full p-2"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold">Virtual Location (Link)</label>
            <input
              className="border rounded w-full p-2"
              type="url"
              value={virtualLocation}
              onChange={(e) => setVirtualLocation(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Create Event
          </button>
        </form>
      </div>
    </div>
  );
}
