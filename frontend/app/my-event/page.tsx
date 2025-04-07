"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { eventService } from "../utils/api";
import type { EventData, User } from "../utils/api";
import api from "../utils/api";

const MyEvents = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<EventData | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const [organizedEvents, setOrganizedEvents] = useState<EventData[]>([]);
  const [speakingEvents, setSpeakingEvents] = useState<EventData[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<EventData[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getEvents();
        const addedEventIds = new Set<number>();
        const organized: EventData[] = [];
        const speaking: EventData[] = [];
        const attending: EventData[] = [];

        data.organized?.forEach((event: EventData) => {
          if (!addedEventIds.has(event.id!)) {
            organized.push(event);
            addedEventIds.add(event.id!);
          }
        });

        data.speaking?.forEach((event: EventData) => {
          if (!addedEventIds.has(event.id!)) {
            speaking.push(event);
            addedEventIds.add(event.id!);
          }
        });

        data.attending?.forEach((event: EventData) => {
          if (!addedEventIds.has(event.id!)) {
            attending.push(event);
            addedEventIds.add(event.id!);
          }
        });

        setOrganizedEvents(organized);
        setSpeakingEvents(speaking);
        setAttendingEvents(attending);
      } catch (err) {
        console.error(err);
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await api.get("/api/users/");
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to load users", err);
      }
    };

    fetchEvents();
    fetchUsers();
  }, []);

  const openEditModal = async (event: EventData) => {
    setSelectedEvent(event);
    setEditFormData({ ...event });
    setIsEditModalOpen(true);
  
    if (event.has_unread_update) {
      try {
        await eventService.markEventAsViewed(event.id);
        const updateViewedStatus = (events: EventData[]) =>
          events.map((e) =>
            e.id === event.id ? { ...e, has_unread_update: false } : e
          );
  
        setOrganizedEvents((prev) => updateViewedStatus(prev));
        setSpeakingEvents((prev) => updateViewedStatus(prev));
        setAttendingEvents((prev) => updateViewedStatus(prev));
      } catch (err) {
        console.error("Failed to mark event as viewed", err);
      }
    }
  };

  const openViewModal = async (event: EventData) => {
    setSelectedEvent(event);
    setIsViewModalOpen(true);

    try {
      await eventService.markEventAsViewed(event.id);
      const updateViewedStatus = (events: EventData[]) =>
        events.map((e) =>
          e.id === event.id ? { ...e, has_unread_update: false } : e
        );

      setOrganizedEvents((prev) => updateViewedStatus(prev));
      setSpeakingEvents((prev) => updateViewedStatus(prev));
      setAttendingEvents((prev) => updateViewedStatus(prev));
    } catch (err) {
      console.error("Failed to mark event as viewed", err);
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditFormData(null);
    setSelectedEvent(null);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedEvent(null);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter((opt) => opt.selected)
      .map((opt) => parseInt(opt.value));

    setEditFormData((prev) => (prev ? { ...prev, [name]: selectedValues } : null));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData || !selectedEvent?.id) return;

    try {
      await eventService.updateEvent(selectedEvent.id, editFormData);

      const updated = { ...selectedEvent, ...editFormData, has_unread_update: true };

      const updateEventInList = (events: EventData[]) =>
        events.map((event) =>
          event.id === updated.id ? { ...event, has_unread_update: true, ...editFormData } : event
        );

      setOrganizedEvents((prev) => updateEventInList(prev));
      setSpeakingEvents((prev) => updateEventInList(prev));
      setAttendingEvents((prev) => updateEventInList(prev));

      closeEditModal();
    } catch (err) {
      console.error("Error updating event:", err);
      alert("Failed to update event. Please try again.");
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const renderSection = (title: string, events: EventData[], canEdit: boolean) => (
    <section className="mt-10">
      <h2 className="text-xl font-bold mb-4" style={{ color: "#08090A" }}>{title}</h2>
      {events.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event.id} className="relative p-4 bg-white rounded shadow">
              {event.has_unread_update && (
                <span className="absolute top-2 right-2 h-3 w-3 bg-red-500 rounded-full" />
              )}
              <h3 className="text-lg font-semibold mb-2" style={{ color: "#08090A" }}>{event.title}</h3>
              <p className="text-sm mb-1" style={{ color: "#333" }}>{formatDateTime(event.date)}</p>
              <p className="text-sm mb-1" style={{ color: "#333" }}>{event.description}</p>
              {canEdit ? (
                <button
                  className="mt-2 px-3 py-1 text-sm rounded-md text-white bg-green-500 hover:bg-green-600"
                  onClick={() => openEditModal(event)}
                >
                  Edit
                </button>
              ) : (
                <button
                  className="mt-2 px-3 py-1 text-sm rounded-md text-white bg-blue-500 hover:bg-blue-600"
                  onClick={() => openViewModal(event)}
                >
                  View
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "#444" }}>No events found in this category.</p>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-[#EAF6FF]">
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
          <p className="mt-2 text-sm" style={{ color: "#444" }}>
            View and manage your educational events
          </p>
        </div>

        {loading && <p className="mt-6 text-center text-sm" style={{ color: "#444" }}>Loading events...</p>}
        {error && <p className="mt-6 text-center text-red-500 text-sm">{error}</p>}

        {!loading && !error && (
          <>
            {renderSection("Organizing", organizedEvents, true)}
            {renderSection("Speaking", speakingEvents, false)}
            {renderSection("Attending", attendingEvents, false)}
          </>
        )}

        {isEditModalOpen && selectedEvent && editFormData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold" style={{ color: "#08090A" }}>
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
                <form onSubmit={handleEditSubmit} className="mt-4 space-y-4 text-[#08090A]">
                  <input
                    type="text"
                    name="title"
                    value={editFormData.title}
                    onChange={handleEditChange}
                    className="w-full p-2 border rounded"
                    placeholder="Event Title"
                  />
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditChange}
                    className="w-full p-2 border rounded"
                    placeholder="Description"
                  />
                  <input
                    type="datetime-local"
                    name="date"
                    value={editFormData.date ? new Date(editFormData.date).toISOString().slice(0, 16) : ""}
                    onChange={handleEditChange}
                    className="w-full p-2 border rounded"
                  />
                  <select
                    name="event_type"
                    value={editFormData.event_type}
                    onChange={handleEditChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="in_person">In-Person</option>
                    <option value="virtual">Virtual</option>
                    <option value="hybrid">Hybrid</option>
                  </select>

                  {(editFormData.event_type === "in_person" || editFormData.event_type === "hybrid") && (
                    <input
                      type="text"
                      name="location"
                      value={editFormData.location || ""}
                      onChange={handleEditChange}
                      className="w-full p-2 border rounded"
                      placeholder="Physical Location"
                    />
                  )}

                  {(editFormData.event_type === "virtual" || editFormData.event_type === "hybrid") && (
                    <input
                      type="url"
                      name="virtual_location"
                      value={editFormData.virtual_location || ""}
                      onChange={handleEditChange}
                      className="w-full p-2 border rounded"
                      placeholder="Virtual Link"
                    />
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">Organizers</label>
                    <select
                      multiple
                      name="organizers"
                      value={editFormData.organizers as number[]}
                      onChange={handleMultiSelectChange}
                      className="w-full p-2 border rounded h-32"
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Speakers</label>
                    <select
                      multiple
                      name="speakers"
                      value={editFormData.speakers as number[]}
                      onChange={handleMultiSelectChange}
                      className="w-full p-2 border rounded h-32"
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="px-4 py-2 border rounded text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-500 text-white rounded text-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {isViewModalOpen && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 text-[#08090A]">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold">Event Details</h2>
                  <button
                    onClick={closeViewModal}
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

                <div className="mt-4 space-y-3">
                  <div><strong>Title:</strong> {selectedEvent.title}</div>
                  <div><strong>Description:</strong> {selectedEvent.description}</div>
                  <div><strong>Date:</strong> {formatDateTime(selectedEvent.date)}</div>
                  <div><strong>Type:</strong> {selectedEvent.event_type}</div>
                  {selectedEvent.location && (
                    <div><strong>Location:</strong> {selectedEvent.location}</div>
                  )}
                  {selectedEvent.virtual_location && (
                    <div><strong>Virtual Link:</strong> <a href={selectedEvent.virtual_location} target="_blank" className="text-blue-500 underline">{selectedEvent.virtual_location}</a></div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeViewModal}
                    className="px-4 py-2 border rounded text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyEvents;
