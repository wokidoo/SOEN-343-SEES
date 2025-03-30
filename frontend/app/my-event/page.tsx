"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { eventService } from "../utils/api";
import type { EventData } from "../utils/api";

const MyEvents = () => {
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<EventData | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getEvents(); // flat list
        setEvents(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchEvents();
  }, []);

  const openEditModal = async (event: EventData) => {
    try {
      await eventService.markEventAsViewed(event.id);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, has_unread_update: false } : e
        )
      );
    } catch (err) {
      console.error("Failed to mark event as viewed", err);
    }

    setSelectedEvent(event);
    setEditFormData({ ...event });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditFormData(null);
    setSelectedEvent(null);
  };

  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData || !selectedEvent?.id) return;

    try {
      setEvents(
        events.map((event) =>
          event.id === selectedEvent.id ? { ...event, ...editFormData } : event
        )
      );
      closeEditModal();
      alert("Event updated successfully (frontend only)");
    } catch (err) {
      console.error("Error updating event:", err);
      alert("Failed to update event. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      in_person: "In-Person",
      virtual: "Virtual",
      hybrid: "Hybrid",
    };
    return typeMap[type] || type;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#EAF6FF" }}>
      <Head>
        <title>My Events | SEES</title>
        <meta name="description" content="List of your events" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="pb-5 border-b border-gray-200">
          <h1 className="text-2xl font-bold" style={{ color: "#08090A" }}>
            My Events
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#666B6A" }}>
            View and manage your educational events
          </p>
        </div>

        {loading && (
          <div className="text-center py-10">
            <p style={{ color: "#666B6A" }}>Loading events...</p>
          </div>
        )}

        {error && (
          <div
            className="mt-4 p-4 rounded-md"
            style={{ backgroundColor: "#FFEEEE" }}
          >
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="text-center py-10">
            <p className="text-lg" style={{ color: "#666B6A" }}>
              No events found.
            </p>
            <button
              className="mt-4 px-4 py-2 rounded-md text-white cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#86CD82" }}
              onClick={() => router.push("/create-event")}
            >
              Create an Event
            </button>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="relative rounded-lg shadow-md overflow-hidden"
                style={{
                  backgroundColor: "white",
                  borderTop: "4px solid #86CD82",
                }}
              >
                {event.has_unread_update && (
                  <span className="absolute top-2 right-2 h-3 w-3 bg-red-500 rounded-full" />
                )}

                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <h2
                      className="text-xl font-semibold"
                      style={{ color: "#08090A" }}
                    >
                      {event.title}
                    </h2>
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor:
                          event.event_type === "virtual"
                            ? "#EAF6FF"
                            : event.event_type === "hybrid"
                            ? "#F0F0FF"
                            : "#F0FFF0",
                        color:
                          event.event_type === "virtual"
                            ? "#0066CC"
                            : event.event_type === "hybrid"
                            ? "#6666CC"
                            : "#008800",
                      }}
                    >
                      {getEventTypeDisplay(event.event_type)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm" style={{ color: "#666B6A" }}>
                    {event.description && event.description.length > 120
                      ? `${event.description.substring(0, 120)}...`
                      : event.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div
                      className="flex items-center text-sm"
                      style={{ color: "#666B6A" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{event.date && formatDate(event.date)}</span>
                    </div>

                    {event.location && (
                      <div
                        className="flex items-center mt-2 text-sm"
                        style={{ color: "#666B6A" }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>{event.location}</span>
                      </div>
                    )}

                    {event.virtual_location && (
                      <div
                        className="flex items-center mt-2 text-sm"
                        style={{ color: "#666B6A" }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <a
                          href={event.virtual_location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          style={{ color: "#72A276" }}
                        >
                          Virtual Link
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      className="px-3 py-1 text-sm rounded-md text-white cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: "#86CD82" }}
                      onClick={() => openEditModal(event)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyEvents;
