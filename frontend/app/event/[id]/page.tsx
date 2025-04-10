"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import React from "react";
import Navbar from "../../components/Navbar";
import api, { eventService, EventData } from "../../utils/api";

export default function EventDetails({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unwrappedParams = React.use(params);
  const eventId = unwrappedParams.id;
  const userRole = searchParams.get("role") || "attendee";

  // Event data state
  const [event, setEvent] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [materials, setMaterials] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("information");

  // For organizing events - editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  // Fetch event details
  useEffect(() => {
    const fetchEventDetails = async () => {
      setLoading(true);
      try {
        // Fetch event details using the event service or API
        const response = await api.get(`/api/events/${eventId}/`);
        const eventData = response.data;

        setEvent(eventData);

        // Set quizzes and materials if available
        if (eventData.quizzes) {
          setQuizzes(
            eventData.quizzes.filter(
              (q) => q.visible || userRole === "organizer"
            )
          );
        }

        if (eventData.materials) {
          setMaterials(
            eventData.materials.filter(
              (m) => m.visible || userRole === "organizer"
            )
          );
        }

        // If we're an organizer, prepare the edit data
        if (userRole === "organizer") {
          setEditData({
            title: eventData.title,
            description: eventData.description,
            date: eventData.date ? eventData.date.split("T")[0] : "",
            time: eventData.date
              ? eventData.date.split("T")[1].substring(0, 5)
              : "",
            event_type: eventData.event_type,
            location: eventData.location || "",
            virtual_location: eventData.virtual_location || "",
            organizers: eventData.organizers?.map((org) => org.id) || [],
            speakers: eventData.speakers?.map((speaker) => speaker.id) || [],
            ticket_price: eventData.ticket_price?.toString() || "0.00",
          });
        }
      } catch (err) {
        console.error("Error fetching event details:", err);
        setError("Failed to load event details.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, userRole]);

  // Go back to My Events page
  const goBack = () => {
    router.push("/my-events");
  };

  // Format event date/time
  const formatDate = (dateString) => {
    if (!dateString) return "Date not specified";
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
  const getEventTypeDisplay = (type) => {
    const typeMap = {
      in_person: "In-Person",
      virtual: "Virtual",
      hybrid: "Hybrid",
    };
    return typeMap[type] || type;
  };

  // Toggle edit mode for organizers
  const toggleEditMode = () => {
    setIsEditing(!isEditing);

    // If cancelling edit, reset form data
    if (isEditing) {
      setEditData({
        title: event.title,
        description: event.description,
        date: event.date ? event.date.split("T")[0] : "",
        time: event.date ? event.date.split("T")[1].substring(0, 5) : "",
        event_type: event.event_type,
        location: event.location || "",
        virtual_location: event.virtual_location || "",
        organizers: event.organizers?.map((org) => org.id) || [],
        speakers: event.speakers?.map((speaker) => speaker.id) || [],
        ticket_price: event.ticket_price?.toString() || "0.00",
      });
    }
  };

  // Handle input changes for edit mode
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: value,
    });
  };

  // Handle select changes for multi-select (organizers, speakers) in edit mode
  const handleMultiSelectChange = (e) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter((option) => option.selected)
      .map((option) => option.value);
    setEditData({
      ...editData,
      [name]: selectedValues,
    });
  };

  // Save updated event (for organizers)
  const saveEvent = async () => {
    try {
      setLoading(true);

      // Combine date and time for submission
      const dateTime = editData.date + "T" + (editData.time || "00:00");

      const updatedEventData = {
        ...editData,
        date: dateTime,
        ticket_price: parseFloat(editData.ticket_price),
      };

      // Call API to update the event
      await api.put(`/api/events/${eventId}/`, updatedEventData);

      // Refresh event data
      const response = await api.get(`/api/events/${eventId}/`);
      setEvent(response.data);

      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error("Error updating event:", err);
      setError("Failed to update event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle visibility of quiz or material (for organizers)
  const toggleItemVisibility = async (itemType, itemId) => {
    try {
      if (itemType === "quiz") {
        const quiz = quizzes.find((q) => q.id === itemId);
        if (quiz) {
          await api.patch(`/api/quizzes/${itemId}/`, {
            visible: !quiz.visible,
          });

          // Update local state
          setQuizzes(
            quizzes.map((q) =>
              q.id === itemId ? { ...q, visible: !q.visible } : q
            )
          );
        }
      } else if (itemType === "material") {
        const material = materials.find((m) => m.id === itemId);
        if (material) {
          await api.patch(`/api/materials/${itemId}/`, {
            visible: !material.visible,
          });

          // Update local state
          setMaterials(
            materials.map((m) =>
              m.id === itemId ? { ...m, visible: !m.visible } : m
            )
          );
        }
      }
    } catch (err) {
      console.error(`Error toggling ${itemType} visibility:`, err);
      setError(`Failed to update ${itemType} visibility.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#EAF6FF" }}>
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <p style={{ color: "#666B6A" }}>Loading event details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#EAF6FF" }}>
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <button
              onClick={goBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to My Events
            </button>
            <div
              className="p-4 rounded-md"
              style={{ backgroundColor: "#FFEEEE" }}
            >
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#EAF6FF" }}>
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <button
              onClick={goBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to My Events
            </button>
            <div className="text-center py-6">
              <p style={{ color: "#666B6A" }}>Event not found.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#EAF6FF" }}>
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div
          className="rounded-lg shadow-lg overflow-hidden"
          style={{ backgroundColor: "white", borderTop: "4px solid #86CD82" }}
        >
          {/* Header with back button */}
          <div className="p-6 flex justify-between items-center border-b border-gray-200">
            <button
              onClick={goBack}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to My Events
            </button>

            {userRole === "organizer" && !isEditing && (
              <button
                className="px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: "#86CD82" }}
                onClick={toggleEditMode}
              >
                Edit Event
              </button>
            )}

            {userRole === "organizer" && isEditing && (
              <div className="flex space-x-2">
                <button
                  className="px-4 py-2 rounded-md border border-gray-300"
                  style={{ color: "#666B6A" }}
                  onClick={toggleEditMode}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-md text-white"
                  style={{ backgroundColor: "#86CD82" }}
                  onClick={saveEvent}
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Event title */}
          <div className="px-6 pt-4 pb-2">
            <h1 className="text-2xl font-bold" style={{ color: "#08090A" }}>
              {event.title}
            </h1>
            <div className="flex items-center mt-2">
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
              <span className="text-sm ml-4" style={{ color: "#666B6A" }}>
                You are{" "}
                {userRole === "organizer"
                  ? "organizing"
                  : userRole === "speaker"
                  ? "speaking at"
                  : "attending"}{" "}
                this event
              </span>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="px-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("information")}
                className={`py-4 px-1 ${
                  activeTab === "information"
                    ? "border-b-2 border-green-500 text-green-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } font-medium`}
              >
                Information
              </button>
              <button
                onClick={() => setActiveTab("quizzes")}
                className={`py-4 px-1 ${
                  activeTab === "quizzes"
                    ? "border-b-2 border-green-500 text-green-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } font-medium`}
              >
                Quizzes
              </button>
              <button
                onClick={() => setActiveTab("materials")}
                className={`py-4 px-1 ${
                  activeTab === "materials"
                    ? "border-b-2 border-green-500 text-green-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } font-medium`}
              >
                Materials
              </button>
            </nav>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {/* Information Tab */}
            {activeTab === "information" && (
              <>
                {!isEditing ? (
                  <div className="space-y-6">
                    <div>
                      <h3
                        className="text-lg font-medium mb-2"
                        style={{ color: "#08090A" }}
                      >
                        Description
                      </h3>
                      <p className="text-gray-700">{event.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3
                          className="text-lg font-medium mb-2"
                          style={{ color: "#08090A" }}
                        >
                          Date and Time
                        </h3>
                        <p className="text-gray-700">
                          {formatDate(event.date)}
                        </p>
                      </div>

                      <div>
                        <h3
                          className="text-lg font-medium mb-2"
                          style={{ color: "#08090A" }}
                        >
                          Ticket Price
                        </h3>
                        <p className="text-gray-700">
                          {parseFloat(event.ticket_price) === 0
                            ? "Free"
                            : `$${parseFloat(event.ticket_price).toFixed(2)}`}
                        </p>
                      </div>
                    </div>

                    {(event.location || event.virtual_location) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {event.location && (
                          <div>
                            <h3
                              className="text-lg font-medium mb-2"
                              style={{ color: "#08090A" }}
                            >
                              Location
                            </h3>
                            <p className="text-gray-700">{event.location}</p>
                          </div>
                        )}

                        {event.virtual_location && (
                          <div>
                            <h3
                              className="text-lg font-medium mb-2"
                              style={{ color: "#08090A" }}
                            >
                              Virtual Location
                            </h3>
                            <a
                              href={event.virtual_location}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {event.virtual_location}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Update the speakers section */}
                    {event.speakers && event.speakers.length > 0 && (
                      <div>
                        <h3
                          className="text-lg font-medium mb-2"
                          style={{ color: "#08090A" }}
                        >
                          Speakers
                        </h3>
                        <ul className="list-disc list-inside">
                          {event.speakers.map((speaker, index) => (
                            <li
                              key={speaker.id || `speaker-${index}`}
                              className="text-gray-700"
                            >
                              {speaker.name || speaker.first_name
                                ? `${speaker.first_name || ""} ${
                                    speaker.last_name || ""
                                  }`
                                : `Speaker ${index + 1}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Update the organizers section */}
                    {userRole === "organizer" &&
                      event.organizers &&
                      event.organizers.length > 0 && (
                        <div>
                          <h3
                            className="text-lg font-medium mb-2"
                            style={{ color: "#08090A" }}
                          >
                            Organizers
                          </h3>
                          <ul className="list-disc list-inside">
                            {event.organizers.map((organizer, index) => (
                              <li
                                key={organizer.id || `organizer-${index}`}
                                className="text-gray-700"
                              >
                                {organizer.name || organizer.first_name
                                  ? `${organizer.first_name || ""} ${
                                      organizer.last_name || ""
                                    }`
                                  : `Organizer ${index + 1}`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Edit form similar to create event form */}
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium"
                        style={{ color: "#666B6A" }}
                      >
                        Event Title *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="title"
                          id="title"
                          required
                          className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
                          style={{
                            backgroundColor: "white",
                            borderColor: "#72A276",
                            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                          }}
                          value={editData.title}
                          onChange={handleEditChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium"
                        style={{ color: "#666B6A" }}
                      >
                        Event Description *
                      </label>
                      <div className="mt-1">
                        <textarea
                          name="description"
                          id="description"
                          rows={4}
                          required
                          className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
                          style={{
                            backgroundColor: "white",
                            borderColor: "#72A276",
                            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                          }}
                          value={editData.description}
                          onChange={handleEditChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label
                          htmlFor="date"
                          className="block text-sm font-medium"
                          style={{ color: "#666B6A" }}
                        >
                          Event Date *
                        </label>
                        <div className="mt-1">
                          <input
                            type="date"
                            name="date"
                            id="date"
                            required
                            className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
                            style={{
                              backgroundColor: "white",
                              borderColor: "#72A276",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                            }}
                            value={editData.date}
                            onChange={handleEditChange}
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <label
                          htmlFor="time"
                          className="block text-sm font-medium"
                          style={{ color: "#666B6A" }}
                        >
                          Event Time
                        </label>
                        <div className="mt-1">
                          <input
                            type="time"
                            name="time"
                            id="time"
                            className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
                            style={{
                              backgroundColor: "white",
                              borderColor: "#72A276",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                            }}
                            value={editData.time}
                            onChange={handleEditChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="event_type"
                        className="block text-sm font-medium"
                        style={{ color: "#666B6A" }}
                      >
                        Event Type *
                      </label>
                      <div className="mt-1">
                        <select
                          id="event_type"
                          name="event_type"
                          required
                          className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
                          style={{
                            backgroundColor: "white",
                            borderColor: "#72A276",
                            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                          }}
                          value={editData.event_type}
                          onChange={handleEditChange}
                        >
                          <option value="in_person">In-Person</option>
                          <option value="virtual">Virtual</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="ticket_price"
                        className="block text-sm font-medium"
                        style={{ color: "#666B6A" }}
                      >
                        Ticket Price *
                      </label>
                      <div className="mt-1">
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            name="ticket_price"
                            id="ticket_price"
                            min="0"
                            step="0.01"
                            className="block w-full pl-7 sm:text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
                            style={{
                              backgroundColor: "white",
                              borderColor: "#72A276",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                            }}
                            value={editData.ticket_price}
                            onChange={handleEditChange}
                          />
                        </div>
                      </div>
                    </div>

                    {(editData.event_type === "in_person" ||
                      editData.event_type === "hybrid") && (
                      <div>
                        <label
                          htmlFor="location"
                          className="block text-sm font-medium"
                          style={{ color: "#666B6A" }}
                        >
                          Physical Location *
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="location"
                            id="location"
                            required
                            className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
                            style={{
                              backgroundColor: "white",
                              borderColor: "#72A276",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                            }}
                            value={editData.location}
                            onChange={handleEditChange}
                          />
                        </div>
                      </div>
                    )}

                    {(editData.event_type === "virtual" ||
                      editData.event_type === "hybrid") && (
                      <div>
                        <label
                          htmlFor="virtual_location"
                          className="block text-sm font-medium"
                          style={{ color: "#666B6A" }}
                        >
                          Virtual Location *
                        </label>
                        <div className="mt-1">
                          <input
                            type="url"
                            name="virtual_location"
                            id="virtual_location"
                            required
                            className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
                            style={{
                              backgroundColor: "white",
                              borderColor: "#72A276",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                            }}
                            value={editData.virtual_location}
                            onChange={handleEditChange}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Quizzes Tab */}
            {activeTab === "quizzes" && (
              <div>
                {quizzes.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">
                      {userRole === "organizer"
                        ? "No quizzes have been created yet."
                        : "No quizzes have been released yet."}
                    </p>
                    {userRole === "organizer" && (
                      <button
                        className="mt-4 px-4 py-2 rounded-md text-white"
                        style={{ backgroundColor: "#86CD82" }}
                        onClick={() => {
                          // Navigate to quiz creation or management
                          router.push(`/manage-quizzes?event=${eventId}`);
                        }}
                      >
                        Manage Quizzes
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userRole === "organizer" && (
                      <div className="flex justify-between items-center mb-4">
                        <h3
                          className="text-lg font-medium"
                          style={{ color: "#08090A" }}
                        >
                          Event Quizzes
                        </h3>
                        <button
                          className="px-4 py-2 rounded-md text-white"
                          style={{ backgroundColor: "#86CD82" }}
                          onClick={() => {
                            // Navigate to quiz management page
                            router.push(`/manage-quizzes?event=${eventId}`);
                          }}
                        >
                          Manage Quizzes
                        </button>
                      </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                      {quizzes
                        .filter((q) => q.visible || userRole === "organizer")
                        .map((quiz, index) => (
                          <div
                            key={quiz.id || `quiz-${index}`}
                            className="border border-gray-200 rounded-md overflow-hidden shadow-sm"
                          >
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                              <h4 className="font-medium">{quiz.title}</h4>
                              {userRole === "organizer" && (
                                <label className="flex items-center text-sm">
                                  <input
                                    type="checkbox"
                                    checked={quiz.visible}
                                    onChange={() =>
                                      toggleItemVisibility("quiz", quiz.id)
                                    }
                                    className="mr-2 h-4 w-4 text-green-600"
                                  />
                                  Visible
                                </label>
                              )}
                            </div>
                            <div className="p-4">
                              <p className="text-sm text-gray-500 mb-3">
                                {quiz.questions?.length || 0} question
                                {quiz.questions?.length !== 1 ? "s" : ""}
                              </p>
                              <button
                                className="px-3 py-1 text-sm rounded-md text-white bg-blue-500 hover:bg-blue-600"
                                onClick={() =>
                                  router.push(
                                    `/quiz/${quiz.id}?event=${eventId}&role=${userRole}`
                                  )
                                }
                              >
                                {userRole === "organizer"
                                  ? "Preview Quiz"
                                  : "Take Quiz"}
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Materials Tab */}
            {activeTab === "materials" && (
              <div>
                {materials.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">
                      {userRole === "organizer"
                        ? "No materials have been uploaded yet."
                        : "No materials have been released yet."}
                    </p>
                    {userRole === "organizer" && (
                      <button
                        className="mt-4 px-4 py-2 rounded-md text-white"
                        style={{ backgroundColor: "#86CD82" }}
                        onClick={() => {
                          // Navigate to materials management
                          router.push(`/manage-materials?event=${eventId}`);
                        }}
                      >
                        Manage Materials
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userRole === "organizer" && (
                      <div className="flex justify-between items-center mb-4">
                        <h3
                          className="text-lg font-medium"
                          style={{ color: "#08090A" }}
                        >
                          Event Materials
                        </h3>
                        <button
                          className="px-4 py-2 rounded-md text-white"
                          style={{ backgroundColor: "#86CD82" }}
                          onClick={() => {
                            // Navigate to materials management page
                            router.push(`/manage-materials?event=${eventId}`);
                          }}
                        >
                          Manage Materials
                        </button>
                      </div>
                    )}

                    <div className="grid gap-4">
                      {materials
                        .filter((m) => m.visible || userRole === "organizer")
                        .map((material, index) => (
                          <div
                            key={material.id || `material-${index}`}
                            className="flex justify-between items-center p-4 border border-gray-200 rounded-md"
                          >
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-3 text-gray-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <div>
                                <h4 className="font-medium">{material.name}</h4>
                                {material.description && (
                                  <p className="text-sm text-gray-500">
                                    {material.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              {userRole === "organizer" && (
                                <label className="flex items-center text-sm mr-4">
                                  <input
                                    type="checkbox"
                                    checked={material.visible}
                                    onChange={() =>
                                      toggleItemVisibility(
                                        "material",
                                        material.id
                                      )
                                    }
                                    className="mr-2 h-4 w-4 text-green-600"
                                  />
                                  Visible
                                </label>
                              )}
                              <a
                                href={`/api/materials/${material.id}/download`}
                                className="px-3 py-1 text-sm rounded-md text-white bg-blue-500 hover:bg-blue-600"
                                download
                              >
                                Download
                              </a>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
