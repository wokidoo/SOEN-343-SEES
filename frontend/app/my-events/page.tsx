"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import api, { eventService, EventData, User } from "../utils/api";

export default function MyEvents() {
  const router = useRouter();
  
  // Role-based events
  const [organizedEvents, setOrganizedEvents] = useState<EventData[]>([]);
  const [speakingEvents, setSpeakingEvents] = useState<EventData[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<EventData[]>([]);

  // User-related state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("attending");

  // Fetch current user and all users
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current user profile using token
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const profileResponse = await api.get("/api/profile/");
            setCurrentUser(profileResponse.data);
          } catch (profileError) {
            console.error("Error fetching profile:", profileError);
          }
        }

        // Get all users for organizer selection
        const usersResponse = await api.get("/api/users/");
        setUsers(usersResponse.data);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserData();
  }, []);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getEvents();
        setOrganizedEvents(data.organized_events || []);
        setSpeakingEvents(data.speaking_events || []);
        setAttendingEvents(data.attending_events || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Handle viewing event details
  const viewEventDetails = (event: EventData, role: string) => {
    // Navigate to event detail page with role and event ID
    router.push(`/event/${event.id}?role=${role}`);
  };

  // Format event date/time
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

  // Render event card component
  const renderEventCard = (
    event: EventData,
    role: string
  ) => (
    <div
      key={event.id}
      className="rounded-lg shadow-md overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
      style={{
        backgroundColor: "white",
        borderTop: "4px solid #86CD82",
      }}
      onClick={() => viewEventDetails(event, role)}
    >
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-semibold" style={{ color: "#08090A" }}>
            {event.title}
            {event.has_unread_update && (
              <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
            )}
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
                onClick={(e) => e.stopPropagation()}
              >
                Virtual Link
              </a>
            </div>
          )}
          {event.ticket_price && Number(event.ticket_price) > 0 && (
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>${Number(event.ticket_price).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const hasNoEvents =
    !loading &&
    !error &&
    organizedEvents.length === 0 &&
    speakingEvents.length === 0 &&
    attendingEvents.length === 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#EAF6FF" }}>
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

        {/* Tab navigation */}
        {!loading && !error && !hasNoEvents && (
          <div className="mt-5 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("attending")}
                className={`py-4 px-1 ${
                  activeTab === "attending"
                    ? "border-b-2 border-green-500 text-green-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } font-medium`}
              >
                Events I'm Attending {attendingEvents.length > 0 && `(${attendingEvents.length})`}
              </button>
              <button
                onClick={() => setActiveTab("speaking")}
                className={`py-4 px-1 ${
                  activeTab === "speaking"
                    ? "border-b-2 border-green-500 text-green-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } font-medium`}
              >
                Events I'm Speaking At {speakingEvents.length > 0 && `(${speakingEvents.length})`}
              </button>
              <button
                onClick={() => setActiveTab("organizing")}
                className={`py-4 px-1 ${
                  activeTab === "organizing"
                    ? "border-b-2 border-green-500 text-green-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } font-medium`}
              >
                Events I'm Organizing {organizedEvents.length > 0 && `(${organizedEvents.length})`}
              </button>
            </nav>
          </div>
        )}

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
        
        {hasNoEvents && (
          <div className="text-center py-10">
            <p className="text-lg" style={{ color: "#666B6A" }}>
              You don't have any events yet.
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

        {/* Tab content */}
        {!loading && !error && !hasNoEvents && (
          <div className="mt-6">
            {/* Attending events tab */}
            {activeTab === "attending" && (
              <div>
                {attendingEvents.length === 0 ? (
                  <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                    <p style={{ color: "#666B6A" }}>
                      You're not attending any events yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {attendingEvents.map((event) => renderEventCard(event, "attendee"))}
                  </div>
                )}
              </div>
            )}

            {/* Speaking events tab */}
            {activeTab === "speaking" && (
              <div>
                {speakingEvents.length === 0 ? (
                  <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                    <p style={{ color: "#666B6A" }}>
                      You're not speaking at any events yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {speakingEvents.map((event) => renderEventCard(event, "speaker"))}
                  </div>
                )}
              </div>
            )}

            {/* Organizing events tab */}
            {activeTab === "organizing" && (
              <div>
                {organizedEvents.length === 0 ? (
                  <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                    <p style={{ color: "#666B6A" }}>
                      You're not organizing any events yet.
                    </p>
                    <button
                      className="mt-4 px-4 py-2 rounded-md text-white cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: "#86CD82" }}
                      onClick={() => router.push("/create-event")}
                    >
                      Create an Event
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {organizedEvents.map((event) => renderEventCard(event, "organizer"))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}