"use client";
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import api, { eventService, User } from "../utils/api";
import Navbar from "../components/Navbar";
// Color palette
// Pistachio: #86CD82
// Asparagus: #72A276
// Dim Gray: #666B6A
// Black: #08090A
// Alice Blue: #EAF6FF
const CreateEvent = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    event_type: "in_person",
    location: "",
    virtual_location: "",
    organizers: [],
    speakers: [],
  });

  // Load users and identify current user
  useEffect(() => {
    const fetchUsersAndCurrentUser = async () => {
      try {
        // First, try to get the current user's profile
        const token = localStorage.getItem("token");

        if (token) {
          try {
            // Attempt to fetch current user profile
            // This is a placeholder - replace with your actual profile endpoint
            const profileResponse = await api.get("/api/profile/");
            const profileData = profileResponse.data;

            // Now fetch all users
            const usersResponse = await api.get("/api/users/");
            const allUsers = usersResponse.data;

            // Set current user from profile data
            setCurrentUser(profileData);
            console.log("Current user:", profileData);

            // Filter out current user from users list
            setUsers(allUsers.filter((u) => u.id !== profileData.id));
          } catch (profileError) {
            console.error("Error fetching profile:", profileError);

            // Fallback: fetch all users and handle user selection manually
            const usersResponse = await api.get("/api/users/");
            setUsers(usersResponse.data);
          }
        } else {
          // No token, just fetch all users
          const usersResponse = await api.get("/api/users/");
          setUsers(usersResponse.data);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsersAndCurrentUser();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  // Handle select changes for multi-select (organizers, speakers)
  const handleMultiSelectChange = (e) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter((option) => option.selected)
      .map((option) => option.value);
    setFormData({
      ...formData,
      [name]: selectedValues,
    });
  };
  // Form validation
  const validateForm = () => {
    // Required fields
    if (!formData.title || !formData.description || !formData.date) {
      setError("Please fill in all required fields.");
      return false;
    }
    // Validate based on event type
    if (formData.event_type === "in_person" && !formData.location) {
      setError("An in-person event must have a physical location.");
      return false;
    }
    if (formData.event_type === "virtual" && !formData.virtual_location) {
      setError(
        "A virtual event must have a virtual location (e.g., Zoom link)."
      );
      return false;
    }
    if (
      formData.event_type === "hybrid" &&
      (!formData.location || !formData.virtual_location)
    ) {
      setError(
        "A hybrid event must have both a physical and virtual location."
      );
      return false;
    }
    setError("");
    return true;
  };
  // Handle navigation
  const navigateToEvents = () => {
    router.push("/my-event");
  };
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      // Combine date and time
      const dateTime = formData.date + "T" + (formData.time || "00:00");

      // Submit to API using our event service
      // Note: The backend will automatically add the current user as an organizer
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: dateTime,
        event_type: formData.event_type,
        location: formData.location,
        virtual_location: formData.virtual_location,
        organizers: formData.organizers,
        speakers: formData.speakers,
      };

      await eventService.createEvent(eventData);
      setSuccess(true);
      // Redirect to events list after successful creation
      setTimeout(() => {
        navigateToEvents();
      }, 2000);
    } catch (err) {
      console.error("Error creating event:", err);
      setError("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#EAF6FF" }}>
      <Head>
        <title>Create Event | SEES</title>
        <meta name="description" content="Create a new educational event" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div
            className="rounded-lg p-6 shadow-lg"
            style={{ backgroundColor: "white", borderTop: "4px solid #86CD82" }}
          >
            <div className="pb-5 border-b border-gray-200">
              <h1 className="text-2xl font-bold" style={{ color: "#08090A" }}>
                Create Event
              </h1>
              <p className="mt-2 text-sm" style={{ color: "#666B6A" }}>
                Fill in the details below to create a new educational event.
              </p>
            </div>
            {error && (
              <div
                className="mt-4 p-4 rounded-md"
                style={{ backgroundColor: "#FFEEEE" }}
              >
                <div className="flex">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              </div>
            )}
            {success && (
              <div
                className="mt-4 p-4 rounded-md"
                style={{ backgroundColor: "#EEFFEE" }}
              >
                <div className="flex">
                  <div className="text-sm" style={{ color: "#72A276" }}>
                    Event created successfully! Redirecting...
                  </div>
                </div>
              </div>
            )}
            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              {/* Basic Event Information */}
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
                      ":focus": { borderColor: "#86CD82" },
                    }}
                    value={formData.title}
                    onChange={handleChange}
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
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
                <p className="mt-2 text-sm" style={{ color: "#666B6A" }}>
                  Describe what attendees can expect from this event
                </p>
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
                      value={formData.date}
                      onChange={handleChange}
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
                      value={formData.time}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              {/* Event Type & Location */}
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
                    value={formData.event_type}
                    onChange={handleChange}
                  >
                    <option value="in_person">In-Person</option>
                    <option value="virtual">Virtual</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              {(formData.event_type === "in_person" ||
                formData.event_type === "hybrid") && (
                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium"
                    style={{ color: "#666B6A" }}
                  >
                    Physical Location{" "}
                    {formData.event_type === "in_person" ||
                    formData.event_type === "hybrid"
                      ? "*"
                      : ""}
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="location"
                      id="location"
                      required={
                        formData.event_type === "in_person" ||
                        formData.event_type === "hybrid"
                      }
                      className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
                      style={{
                        backgroundColor: "white",
                        borderColor: "#72A276",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      }}
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="E.g., Concordia University, Room H-123"
                    />
                  </div>
                </div>
              )}
              {(formData.event_type === "virtual" ||
                formData.event_type === "hybrid") && (
                <div>
                  <label
                    htmlFor="virtual_location"
                    className="block text-sm font-medium"
                    style={{ color: "#666B6A" }}
                  >
                    Virtual Location{" "}
                    {formData.event_type === "virtual" ||
                    formData.event_type === "hybrid"
                      ? "*"
                      : ""}
                  </label>
                  <div className="mt-1">
                    <input
                      type="url"
                      name="virtual_location"
                      id="virtual_location"
                      required={
                        formData.event_type === "virtual" ||
                        formData.event_type === "hybrid"
                      }
                      className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
                      style={{
                        backgroundColor: "white",
                        borderColor: "#72A276",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      }}
                      value={formData.virtual_location}
                      onChange={handleChange}
                      placeholder="E.g., https://zoom.us/j/123456789"
                    />
                  </div>
                </div>
              )}
              {/* Organizers & Speakers */}
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="organizers"
                    className="block text-sm font-medium"
                    style={{ color: "#666B6A" }}
                  >
                    Additional Organizers{" "}
                    <span style={{ fontSize: "0.75rem" }}>
                      (you will be added automatically)
                    </span>
                  </label>
                  <div className="mt-1">
                    <select
                      id="organizers"
                      name="organizers"
                      multiple
                      className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none h-32"
                      style={{
                        backgroundColor: "white",
                        borderColor: "#72A276",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      }}
                      value={formData.organizers}
                      onChange={handleMultiSelectChange}
                    >
                      {users.map((user) => (
                        <option key={`organizer-${user.id}`} value={user.id}>
                          {user.first_name} {user.last_name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-2 text-xs" style={{ color: "#666B6A" }}>
                    Hold Ctrl (or Cmd) to select multiple organizers
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="speakers"
                    className="block text-sm font-medium"
                    style={{ color: "#666B6A" }}
                  >
                    Speakers
                  </label>
                  <div className="mt-1">
                    <select
                      id="speakers"
                      name="speakers"
                      multiple
                      className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none h-32"
                      style={{
                        backgroundColor: "white",
                        borderColor: "#72A276",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      }}
                      value={formData.speakers}
                      onChange={handleMultiSelectChange}
                    >
                      {/* Include current user in speakers options if identified */}
                      {currentUser && (
                        <option
                          key={`speaker-${currentUser.id}`}
                          value={currentUser.id}
                        >
                          {currentUser.first_name} {currentUser.last_name} (you)
                        </option>
                      )}
                      {users.map((user) => (
                        <option key={`speaker-${user.id}`} value={user.id}>
                          {user.first_name} {user.last_name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-2 text-xs" style={{ color: "#666B6A" }}>
                    Hold Ctrl (or Cmd) to select multiple speakers
                  </p>
                </div>
              </div>
              {/* Submit */}
              <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading || success}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white cursor-pointer"
                  style={{
                    backgroundColor: loading || success ? "#72A276" : "#86CD82",
                    borderColor: "#72A276",
                    color: "white",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    if (!loading && !success) {
                      e.currentTarget.style.opacity = "0.9";
                      e.currentTarget.style.boxShadow =
                        "0 1px 3px rgba(0,0,0,0.12)";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {loading ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
export default CreateEvent;
