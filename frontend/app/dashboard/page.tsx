"use client";
import { NextPage } from "next";
import Head from "next/head";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api, { eventService, User, EventData } from "../utils/api";

const Dashboard: NextPage = () => {
  // State for events and search
  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Fetch events and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all events
        const eventsResponse = await api.get("/api/events/");
        const allEvents = eventsResponse.data.organized_events || [];

        // Also include events where user is speaking or attending in the list
        if (eventsResponse.data.speaking_events) {
          allEvents.push(...eventsResponse.data.speaking_events);
        }
        if (eventsResponse.data.attending_events) {
          allEvents.push(...eventsResponse.data.attending_events);
        }

        // Remove duplicates by creating a Map keyed by event id
        const uniqueEvents = Array.from(
          new Map(allEvents.map((event) => [event.id, event])).values()
        );

        setEvents(uniqueEvents);
        setFilteredEvents(uniqueEvents);

        // Fetch current user profile
        try {
          const profileResponse = await api.get("/api/profile/");
          setCurrentUser(profileResponse.data);
        } catch (profileError) {
          console.error("Error fetching user profile:", profileError);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === "") {
      setFilteredEvents(events);
    } else {
      const lowercasedValue = value.toLowerCase();
      const filtered = events.filter(
        (event) =>
          event.title.toLowerCase().includes(lowercasedValue) ||
          event.description.toLowerCase().includes(lowercasedValue) ||
          (event.location &&
            event.location.toLowerCase().includes(lowercasedValue))
      );
      setFilteredEvents(filtered);
    }
  };

  // Handle attending an event
  const handleAttendEvent = async (event: EventData) => {
    if (!currentUser) {
      alert("You need to be logged in to attend events");
      return;
    }

    try {
      // Check if user is already attending
      const isAttending = event.attendees?.includes(currentUser.id);

      if (isAttending) {
        // Remove user from attendees
        const updatedEvent = {
          ...event,
          attendees: event.attendees?.filter((id) => id !== currentUser.id),
        };

        await eventService.updateEvent(event.id!, updatedEvent);

        // Update UI
        setEvents((prevEvents) =>
          prevEvents.map((e) =>
            e.id === event.id ? { ...e, attendees: updatedEvent.attendees } : e
          )
        );
        setFilteredEvents((prevFiltered) =>
          prevFiltered.map((e) =>
            e.id === event.id ? { ...e, attendees: updatedEvent.attendees } : e
          )
        );
      } else {
        // Add user to attendees
        const updatedEvent = {
          ...event,
          attendees: [...(event.attendees || []), currentUser.id],
        };

        await eventService.updateEvent(event.id!, updatedEvent);

        // Update UI
        setEvents((prevEvents) =>
          prevEvents.map((e) =>
            e.id === event.id ? { ...e, attendees: updatedEvent.attendees } : e
          )
        );
        setFilteredEvents((prevFiltered) =>
          prevFiltered.map((e) =>
            e.id === event.id ? { ...e, attendees: updatedEvent.attendees } : e
          )
        );
      }
    } catch (err) {
      console.error("Error updating event attendance:", err);
      alert("Failed to update attendance. Please try again.");
    }
  };

  // Format date for display
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

  // Get event type display name
  const getEventTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      in_person: "In-Person",
      virtual: "Virtual",
      hybrid: "Hybrid",
    };
    return typeMap[type] || type;
  };

  // Check if user is attending an event
  const isUserAttending = (event: EventData) => {
    return currentUser && event.attendees?.includes(currentUser.id);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#EAF6FF" }}>
      <Head>
        <title>Dashboard | SEES</title>
        <meta name="description" content="Educational events dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="pb-5 border-b border-gray-200">
          <h1 className="text-2xl font-bold" style={{ color: "#08090A" }}>
            Upcoming Events
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#666B6A" }}>
            Discover and attend educational events
          </p>
        </div>

        {/* Search bar */}
        <div className="mt-6 mb-8">
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              name="search"
              id="search"
              value={searchTerm}
              onChange={handleSearchChange}
              className="focus:ring-green-500 focus:border-green-500 block w-full px-4 py-3 sm:text-sm border-gray-300 rounded-md bg-white"
              placeholder="Search events by title, description, or location"
              style={{ borderColor: "#72A276" }}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5"
                style={{ color: "#666B6A" }}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading and error states */}
        {loading && (
          <div className="text-center py-10">
            <p style={{ color: "#666B6A" }}>Loading events...</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-md bg-red-50">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* No events found */}
        {!loading && !error && filteredEvents.length === 0 && (
          <div className="text-center py-10">
            <p className="text-lg" style={{ color: "#666B6A" }}>
              {searchTerm
                ? "No events match your search criteria."
                : "No events available at this time."}
            </p>
          </div>
        )}

        {/* Events grid */}
        {!loading && !error && filteredEvents.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col relative"
                style={{ borderTop: "4px solid #86CD82" }}
              >
                <div
                  className="absolute right-4 overflow-hidden"
                  style={{
                    height: "24px",
                    top: isUserAttending(event) ? "0" : "-24px",
                    transition: "top 0.3s ease-in-out",
                    transform: "translateY(-5px)",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="#72A276"
                    className="w-6 h-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="p-5 flex flex-col h-full">
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

                  <div className="mt-4 pt-4 border-t border-gray-100 flex-grow">
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

                    {/* Location information */}
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

                    {/* Virtual location link */}
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

                    {/* Organizers */}
                    {event.organizers_details &&
                      event.organizers_details.length > 0 && (
                        <div className="mt-4">
                          <h3
                            className="text-xs font-semibold uppercase tracking-wider"
                            style={{ color: "#666B6A" }}
                          >
                            Organizer
                            {event.organizers_details.length > 1 ? "s" : ""}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {event.organizers_details.map((organizer) => (
                              <span
                                key={`org-${event.id}-${organizer.id}`}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: "#F0FFF0",
                                  color: "#008800",
                                }}
                              >
                                {organizer.first_name} {organizer.last_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Speakers */}
                    {event.speakers_details &&
                      event.speakers_details.length > 0 && (
                        <div className="mt-2">
                          <h3
                            className="text-xs font-semibold uppercase tracking-wider"
                            style={{ color: "#666B6A" }}
                          >
                            Speaker
                            {event.speakers_details.length > 1 ? "s" : ""}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {event.speakers_details.map((speaker) => (
                              <span
                                key={`spk-${event.id}-${speaker.id}`}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: "#EAF6FF",
                                  color: "#0066CC",
                                }}
                              >
                                {speaker.first_name} {speaker.last_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Attend button */}
                  <div className="mt-4 flex justify-end">
                    <button
                      className="px-3 py-1 text-sm rounded-md text-white cursor-pointer hover:opacity-90 transition-opacity"
                      style={{
                        backgroundColor: isUserAttending(event)
                          ? "#72A276"
                          : "#86CD82",
                      }}
                      onClick={() => handleAttendEvent(event)}
                    >
                      {isUserAttending(event) ? "Attending ✓" : "Attend"}
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

export default Dashboard;
