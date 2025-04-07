"use client";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import api, { eventService } from "../utils/api";
// Import types from API
import type { EventData, User } from "../utils/api";

const MyEvents = () => {
  const router = useRouter();
  // Role-based events
  const [organizedEvents, setOrganizedEvents] = useState<EventData[]>([]);
  const [speakingEvents, setSpeakingEvents] = useState<EventData[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<EventData[]>([]);

  // User-related state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form state for editing
  const [editFormData, setEditFormData] = useState<EventData | null>(null);

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

  // Open edit modal
  const openEditModal = (event: EventData) => {
    setSelectedEvent(event);
    setEditFormData({ ...event });
    setIsEditModalOpen(true);
  };

  // Close modals
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditFormData(null);
    setSelectedEvent(null);
  };

  // Handle edit form changes
  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  // Handle multi-select changes
  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter((option) => option.selected)
      .map((option) => parseInt(option.value));

    setEditFormData((prev) =>
      prev ? { ...prev, [name]: selectedValues } : null
    );
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData || !selectedEvent?.id) return;

    try {
      // Update the event via API
      await eventService.updateEvent(selectedEvent.id, editFormData);

      // Refresh events after update
      const data = await eventService.getEvents();
      setOrganizedEvents(data.organized_events || []);
      setSpeakingEvents(data.speaking_events || []);
      setAttendingEvents(data.attending_events || []);

      closeEditModal();

      // Show success message
      alert("Event updated successfully");
    } catch (err) {
      console.error("Error updating event:", err);
      alert("Failed to update event. Please try again.");
    }
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
    showEditButton: boolean = false
  ) => (
    <div
      key={event.id}
      className="rounded-lg shadow-md overflow-hidden flex flex-col"
      style={{
        backgroundColor: "white",
        borderTop: "4px solid #86CD82",
      }}
    >
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-semibold" style={{ color: "#08090A" }}>
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
          {showEditButton && (
            <button
              className="px-3 py-1 text-sm rounded-md text-white cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#86CD82" }}
              onClick={() => openEditModal(event)}
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Render section with title and events
  const renderEventSection = (
    title: string,
    events: EventData[],
    showEditButtons: boolean = false,
    emptyMessage: string
  ) => (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4" style={{ color: "#08090A" }}>
        {title}
      </h2>
      {events.length === 0 ? (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-center" style={{ color: "#666B6A" }}>
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => renderEventCard(event, showEditButtons))}
        </div>
      )}
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
        {!loading && !error && !hasNoEvents && (
          <>
            {renderEventSection(
              "Events I'm Organizing",
              organizedEvents,
              true,
              "You're not organizing any events yet."
            )}
            {renderEventSection(
              "Events I'm Speaking At",
              speakingEvents,
              false,
              "You're not speaking at any events yet."
            )}
            {renderEventSection(
              "Events I'm Attending",
              attendingEvents,
              false,
              "You're not attending any events yet."
            )}
          </>
        )}
        {/* Edit Event Modal with fixed organizer status */}
        {isEditModalOpen && selectedEvent && editFormData && currentUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h2
                    className="text-2xl font-bold"
                    style={{ color: "#08090A" }}
                  >
                    Edit Event
                  </h2>
                  <button
                    onClick={closeEditModal}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
                  {/* Title */}
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium"
                      style={{ color: "#666B6A" }}
                    >
                      Event Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={editFormData.title}
                      onChange={handleEditChange}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                      style={{ borderColor: "#72A276" }}
                    />
                  </div>
                  {/* Description */}
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium"
                      style={{ color: "#666B6A" }}
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={editFormData.description}
                      onChange={handleEditChange}
                      rows={4}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                      style={{ borderColor: "#72A276" }}
                    />
                  </div>
                  {/* Date */}
                  <div>
                    <label
                      htmlFor="date"
                      className="block text-sm font-medium"
                      style={{ color: "#666B6A" }}
                    >
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      id="date"
                      name="date"
                      value={
                        editFormData.date
                          ? new Date(editFormData.date)
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={handleEditChange}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                      style={{ borderColor: "#72A276" }}
                    />
                  </div>
                  {/* Event Type */}
                  <div>
                    <label
                      htmlFor="event_type"
                      className="block text-sm font-medium"
                      style={{ color: "#666B6A" }}
                    >
                      Event Type
                    </label>
                    <select
                      id="event_type"
                      name="event_type"
                      value={editFormData.event_type}
                      onChange={handleEditChange}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                      style={{ borderColor: "#72A276" }}
                    >
                      <option value="in_person">In-Person</option>
                      <option value="virtual">Virtual</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  {/* Conditional location fields based on event type */}
                  {(editFormData.event_type === "in_person" ||
                    editFormData.event_type === "hybrid") && (
                    <div>
                      <label
                        htmlFor="location"
                        className="block text-sm font-medium"
                        style={{ color: "#666B6A" }}
                      >
                        Physical Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={editFormData.location || ""}
                        onChange={handleEditChange}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                        style={{ borderColor: "#72A276" }}
                      />
                    </div>
                  )}
                  {(editFormData.event_type === "virtual" ||
                    editFormData.event_type === "hybrid") && (
                    <div>
                      <label
                        htmlFor="virtual_location"
                        className="block text-sm font-medium"
                        style={{ color: "#666B6A" }}
                      >
                        Virtual Location (URL)
                      </label>
                      <input
                        type="url"
                        id="virtual_location"
                        name="virtual_location"
                        value={editFormData.virtual_location || ""}
                        onChange={handleEditChange}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                        style={{ borderColor: "#72A276" }}
                        placeholder="https://zoom.us/j/123456789"
                      />
                    </div>
                  )}
                  {/* Organizers - if you want to implement it in the edit modal */}
                  {editFormData.organizers && users.length > 0 && (
                    <div>
                      <label
                        htmlFor="organizers"
                        className="block text-sm font-medium"
                        style={{ color: "#666B6A" }}
                      >
                        Additional Organizers{" "}
                        <span className="text-xs">
                          (you will remain an organizer)
                        </span>
                      </label>
                      <select
                        id="organizers"
                        name="organizers"
                        multiple
                        value={editFormData.organizers
                          .filter((id) => id !== currentUser.id) // Filter out current user
                          .map((id) => id.toString())}
                        onChange={handleMultiSelectChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                        style={{ borderColor: "#72A276", height: "100px" }}
                      >
                        {users
                          .filter((user) => user.id !== currentUser.id) // Don't show current user in the list
                          .map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.first_name} {user.last_name} ({user.email})
                            </option>
                          ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Hold Ctrl (or Cmd on Mac) to select multiple users
                      </p>
                    </div>
                  )}

                  {/* Add speaker selection if desired */}
                  {/* Speakers selection */}
                  {editFormData.speakers && users.length > 0 && (
                    <div>
                      <label
                        htmlFor="speakers"
                        className="block text-sm font-medium"
                        style={{ color: "#666B6A" }}
                      >
                        Speakers
                      </label>
                      <select
                        id="speakers"
                        name="speakers"
                        multiple
                        value={editFormData.speakers.map((id) => id.toString())}
                        onChange={handleMultiSelectChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                        style={{ borderColor: "#72A276", height: "100px" }}
                      >
                        {/* Include current user as a potential speaker */}
                        {currentUser && (
                          <option
                            key={`speaker-${currentUser.id}`}
                            value={currentUser.id}
                          >
                            {currentUser.first_name} {currentUser.last_name}{" "}
                            (you)
                          </option>
                        )}
                        {users
                          .filter((user) => user.id !== currentUser?.id)
                          .map((user) => (
                            <option key={`speaker-${user.id}`} value={user.id}>
                              {user.first_name} {user.last_name} ({user.email})
                            </option>
                          ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Hold Ctrl (or Cmd on Mac) to select multiple speakers
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                      style={{
                        backgroundColor: "white",
                        color: "#666B6A",
                        border: "1px solid #666B6A",
                      }}
                      onClick={closeEditModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-md text-white cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: "#86CD82" }}
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyEvents;
