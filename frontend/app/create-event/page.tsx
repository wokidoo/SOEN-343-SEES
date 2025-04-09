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
  
  // Tab state
  const [activeTab, setActiveTab] = useState("basic");
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [activeQuizTab, setActiveQuizTab] = useState("list");
  
  // New state for quizzes and materials
  const [quizzes, setQuizzes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [newQuiz, setNewQuiz] = useState({ title: "", questions: [] });
  const [currentQuestion, setCurrentQuestion] = useState({ 
    question: "", 
    type: "multiple_choice", 
    options: ["", "", "", ""], 
    correctAnswer: 0 
  });

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

  //Speaker and organizer state
  const [organizerSearch, setOrganizerSearch] = useState("");
  const [speakerSearch, setSpeakerSearch] = useState("");
  const [filteredOrganizers, setFilteredOrganizers] = useState([]);
  const [filteredSpeakers, setFilteredSpeakers] = useState([]);

  // Load users and identify current user
  useEffect(() => {
    const fetchUsersAndCurrentUser = async () => {
      try {
        // First, try to get the current user's profile
        const token = localStorage.getItem("token");

        if (token) {
          try {
            // Attempt to fetch current user profile
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

  // Navigation handlers
  const navigateToNextTab = () => {
    if (activeTab === "basic") {
      if (validateForm()) {
        setActiveTab("quizzes");
      }
    } else if (activeTab === "quizzes") {
      setActiveTab("materials");
    }
  };

  const navigateToEvents = () => {
    router.push("/my-event");
  };

  //Handles searching of organizers
  const handleOrganizerSearch = (e) => {
    const searchTerm = e.target.value;
    setOrganizerSearch(searchTerm);
    
    if (searchTerm.trim() === "") {
      setFilteredOrganizers(users);
    } else {
      const filtered = users.filter(
        (user) => 
          user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrganizers(filtered);
    }
  };

  const handleSpeakerSearch = (e) => {
    const searchTerm = e.target.value;
    setSpeakerSearch(searchTerm);
    
    if (searchTerm.trim() === "") {
      setFilteredSpeakers(users);
    } else {
      const filtered = users.filter(
        (user) => 
          user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSpeakers(filtered);
    }
  };

  // Initialize filtered users when users are loaded
  useEffect(() => {
    setFilteredOrganizers(users);
    setFilteredSpeakers(users);
  }, [users]);

  // Quiz handlers
  const handleQuizChange = (e) => {
    const { name, value } = e.target;
    setNewQuiz({
      ...newQuiz,
      [name]: value,
    });
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion({
      ...currentQuestion,
      [name]: value,
    });
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = value;
    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions,
    });
  };

  const handleCorrectAnswerChange = (index) => {
    setCurrentQuestion({
      ...currentQuestion,
      correctAnswer: index,
    });
  };

  const addQuestion = () => {
    if (!currentQuestion.question) {
      setError("Question text cannot be empty");
      return;
    }

    if (currentQuestion.type === "multiple_choice" && 
        currentQuestion.options.filter(o => o.trim()).length < 2) {
      setError("Multiple choice questions must have at least 2 options");
      return;
    }

    setNewQuiz({
      ...newQuiz,
      questions: [...newQuiz.questions, currentQuestion],
    });

    // Reset current question
    setCurrentQuestion({ 
      question: "", 
      type: "multiple_choice", 
      options: ["", "", "", ""], 
      correctAnswer: 0 
    });
    
    setError("");
  };

  // Function to delete a question from a quiz
  const deleteQuestion = (questionIndex) => {
    setNewQuiz({
      ...newQuiz,
      questions: newQuiz.questions.filter((_, index) => index !== questionIndex)
    });
  };

  // Function to edit an existing question
  const editQuestion = (questionIndex) => {
    // Set the current question to the selected question for editing
    setCurrentQuestion(newQuiz.questions[questionIndex]);
    
    // Remove the question from the list
    setNewQuiz({
      ...newQuiz,
      questions: newQuiz.questions.filter((_, index) => index !== questionIndex)
    });
  };

  // Function to delete an entire quiz
  const deleteQuiz = (quizId) => {
    setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
  };

  const saveQuiz = () => {
    if (!newQuiz.title) {
      setError("Quiz title cannot be empty");
      return;
    }

    if (newQuiz.questions.length === 0) {
      setError("Quiz must have at least one question");
      return;
    }

    setQuizzes([...quizzes, { ...newQuiz, visible: false, id: Date.now() }]);
    setNewQuiz({ title: "", questions: [] });
    setActiveQuizTab("list");
    setError("");
  };

  const startEditingQuiz = (quizId) => {
    const quizToEdit = quizzes.find(q => q.id === quizId);
    if (quizToEdit) {
      setNewQuiz({...quizToEdit});
      setActiveQuizTab("edit");
    }
  };
  
  const updateQuiz = () => {
    if (!newQuiz.title) {
      setError("Quiz title cannot be empty");
      return;
    }
  
    if (newQuiz.questions.length === 0) {
      setError("Quiz must have at least one question");
      return;
    }
  
    // Replace the old quiz with the updated one
    setQuizzes(quizzes.map(q => 
      q.id === editingQuiz ? { ...newQuiz, id: editingQuiz } : q
    ));
    
    // Reset the form
    setNewQuiz({ title: "", questions: [] });
    setEditingQuiz(null);
    setActiveQuizTab("list");
    setError("");
  };

  const toggleQuizVisibility = (quizId) => {
    setQuizzes(quizzes.map(q => 
      q.id === quizId ? { ...q, visible: !q.visible } : q
    ));
  };

  // Materials handlers
  const addMaterial = (file) => {
    setMaterials([...materials, { file, name: file.name, visible: false, id: Date.now() }]);
  };

  const toggleMaterialVisibility = (materialId) => {
    setMaterials(materials.map(m => 
      m.id === materialId ? { ...m, visible: !m.visible } : m
    ));
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      addMaterial(e.target.files[0]);
    }
  };

  // Function to remove an uploaded material/file
  const removeMaterial = (materialId) => {
    setMaterials(materials.filter(material => material.id !== materialId));
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
      // Including quizzes and materials data
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: dateTime,
        event_type: formData.event_type,
        location: formData.location,
        virtual_location: formData.virtual_location,
        organizers: formData.organizers,
        speakers: formData.speakers,
        quizzes: quizzes.filter(q => q.visible),
        materials: materials.filter(m => m.visible),
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
      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div
            className="rounded-lg shadow-lg overflow-hidden"
            style={{ backgroundColor: "white", borderTop: "4px solid #86CD82" }}
          >
            <div className="pb-5 border-b border-gray-200 p-6">
              <h1 className="text-2xl font-bold" style={{ color: "#08090A" }}>
                Create Event
              </h1>
              <p className="mt-2 text-sm" style={{ color: "#666B6A" }}>
                Fill in the details below to create a new educational event.
              </p>
            </div>

            {error && (
              <div
                className="mx-6 mt-4 p-4 rounded-md"
                style={{ backgroundColor: "#FFEEEE" }}
              >
                <div className="flex">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              </div>
            )}

            {success && (
              <div
                className="mx-6 mt-4 p-4 rounded-md"
                style={{ backgroundColor: "#EEFFEE" }}
              >
                <div className="flex">
                  <div className="text-sm" style={{ color: "#72A276" }}>
                    Event created successfully! Redirecting...
                  </div>
                </div>
              </div>
            )}

            <div className="flex">
              {/* Sidebar Tabs */}
              <div className="w-1/4 border-r border-gray-200">
                <div className="p-4">
                  <div
                    className={`mb-2 p-3 rounded-md cursor-pointer ${
                      activeTab === "basic"
                        ? "bg-green-100 text-green-800"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab("basic")}
                  >
                    Basic Information
                  </div>
                  <div
                    className={`mb-2 p-3 rounded-md cursor-pointer ${
                      activeTab === "quizzes"
                        ? "bg-green-100 text-green-800"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab("quizzes")}
                  >
                    Quizzes
                  </div>
                  <div
                    className={`mb-2 p-3 rounded-md cursor-pointer ${
                      activeTab === "materials"
                        ? "bg-green-100 text-green-800"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab("materials")}
                  >
                    Materials
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="w-3/4 p-6">
                <form onSubmit={handleSubmit}>
                  {/* Basic Information Tab */}
                  {activeTab === "basic" && (
                    <div className="space-y-6">
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
                      {/* Organizer Select Box */}
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
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={organizerSearch}
                            onChange={handleOrganizerSearch}
                            className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 mb-2 focus:outline-none"
                            style={{
                              backgroundColor: "white",
                              borderColor: "#72A276",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                            }}
                          />
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
                            {filteredOrganizers.map((user) => (
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

                      {/* Speakers Select Box */}
                      <div>
                        <label
                          htmlFor="speakers"
                          className="block text-sm font-medium"
                          style={{ color: "#666B6A" }}
                        >
                          Speakers
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={speakerSearch}
                            onChange={handleSpeakerSearch}
                            className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 mb-2 focus:outline-none"
                            style={{
                              backgroundColor: "white",
                              borderColor: "#72A276",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                            }}
                          />
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
                            {filteredSpeakers.map((user) => (
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
                      <div className="flex justify-end space-x-3 pt-5">
                        <button
                          type="button"
                          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium"
                          style={{
                            backgroundColor: "white",
                            color: "#666B6A",
                            borderColor: "#666B6A",
                          }}
                          onClick={navigateToEvents}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white"
                          style={{
                            backgroundColor: "#86CD82",
                            borderColor: "#72A276",
                            color: "white",
                          }}
                          onClick={navigateToNextTab}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quizzes Tab */}
                  {activeTab === "quizzes" && (
                    <div>
                      <div className="border-b border-gray-200 mb-4">
                        <nav className="-mb-px flex">
                          <button
                            type="button"
                            onClick={() => setActiveQuizTab("list")}
                            className={`py-2 px-4 text-sm font-medium ${
                              activeQuizTab === "list"
                                ? "border-b-2 border-green-500 text-green-600"
                                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            Quizzes List
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveQuizTab("create");
                              setNewQuiz({ title: "", questions: [] });
                              setEditingQuiz(null);
                            }}
                            className={`ml-8 py-2 px-4 text-sm font-medium ${
                              activeQuizTab === "create"
                                ? "border-b-2 border-green-500 text-green-600"
                                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            Create Quiz
                          </button>
                          {activeQuizTab === "edit" && (
                            <button
                              type="button"
                              className={`ml-8 py-2 px-4 text-sm font-medium border-b-2 border-green-500 text-green-600`}
                            >
                              Edit Quiz
                            </button>
                          )}
                        </nav>
                      </div>
                      {activeQuizTab === "list" && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Available Quizzes</h3>
                          {quizzes.length === 0 ? (
                            <p className="text-gray-500">No quizzes created yet</p>
                          ) : (
                            <ul className="space-y-3">
                              {quizzes.map((quiz) => (
                                <li
                                  key={quiz.id}
                                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                                >
                                  <div>
                                    <h4 className="font-medium">{quiz.title}</h4>
                                    <p className="text-sm text-gray-500">
                                      {quiz.questions.length} questions
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={quiz.visible}
                                        onChange={() => toggleQuizVisibility(quiz.id)}
                                        className="mr-2 h-4 w-4 text-green-600"
                                      />
                                      Visible to attendees
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingQuiz(quiz.id);
                                        startEditingQuiz(quiz.id);
                                      }}
                                      className="text-blue-500 hover:text-blue-700"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteQuiz(quiz.id)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="flex justify-end space-x-3 pt-5">
                            <button
                              type="button"
                              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium"
                              style={{
                                backgroundColor: "white",
                                color: "#666B6A",
                                borderColor: "#666B6A",
                              }}
                              onClick={() => setActiveTab("basic")}
                            >
                              Back
                            </button>
                            <button
                              type="button"
                              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white"
                              style={{
                                backgroundColor: "#86CD82",
                                borderColor: "#72A276",
                                color: "white",
                              }}
                              onClick={navigateToNextTab}
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}

                      {activeQuizTab === "create" && (
                        <div className="space-y-6">
                          <div>
                            <label
                              htmlFor="quiz-title"
                              className="block text-sm font-medium"
                              style={{ color: "#666B6A" }}
                            >
                              Quiz Title *
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="title"
                                id="quiz-title"
                                className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
                                style={{
                                  backgroundColor: "white",
                                  borderColor: "#72A276",
                                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                                }}
                                value={newQuiz.title}
                                onChange={handleQuizChange}
                              />
                            </div>
                          </div>

                          {/* List of questions already added */}
                          {newQuiz.questions.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-medium mb-2">Added Questions:</h4>
                              <ul className="space-y-2">
                                {newQuiz.questions.map((q, idx) => (
                                  <li
                                    key={idx}
                                    className="p-3 bg-gray-50 rounded-md border border-gray-200"
                                  >
                                    <div className="flex justify-between">
                                      <div>
                                        <p className="font-medium">{q.question}</p>
                                        <p className="text-sm text-gray-500">
                                          {q.type === "multiple_choice"
                                            ? "Multiple Choice"
                                            : "True/False"}
                                        </p>
                                      </div>
                                      <div className="flex space-x-2">
                                        <button
                                          type="button"
                                          onClick={() => editQuestion(idx)}
                                          className="text-blue-500 hover:text-blue-700"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => deleteQuestion(idx)}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Add new question form */}
                          <div className="border-t border-gray-200 pt-4 mt-4">
                            <h4 className="font-medium mb-4">Add a Question</h4><div>
                              <label
                                htmlFor="question-text"
                                className="block text-sm font-medium"
                                style={{ color: "#666B6A" }}
                              >
                                Question Text *
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  name="question"
                                  id="question-text"
                                  className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
                                  style={{
                                    backgroundColor: "white",
                                    borderColor: "#72A276",
                                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                                  }}
                                  value={currentQuestion.question}
                                  onChange={handleQuestionChange}
                                  placeholder="Enter your question here"
                                />
                              </div>
                            </div>

                            <div className="mt-4">
                              <label
                                htmlFor="question-type"
                                className="block text-sm font-medium"
                                style={{ color: "#666B6A" }}
                              >
                                Question Type
                              </label>
                              <div className="mt-1">
                                <select
                                  id="question-type"
                                  name="type"
                                  className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
                                  style={{
                                    backgroundColor: "white",
                                    borderColor: "#72A276",
                                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                                  }}
                                  value={currentQuestion.type}
                                  onChange={handleQuestionChange}
                                >
                                  <option value="multiple_choice">Multiple Choice</option>
                                  <option value="true_false">True/False</option>
                                </select>
                              </div>
                            </div>

                            {currentQuestion.type === "multiple_choice" && (
                              <div className="mt-4">
                                <label
                                  className="block text-sm font-medium mb-2"
                                  style={{ color: "#666B6A" }}
                                >
                                  Answer Options
                                </label>
                                {currentQuestion.options.map((option, index) => (
                                  <div key={index} className="flex items-center mt-2">
                                    <input
                                      type="radio"
                                      id={`correct-${index}`}
                                      name="correctAnswer"
                                      checked={currentQuestion.correctAnswer === index}
                                      onChange={() => handleCorrectAnswerChange(index)}
                                      className="mr-2"
                                    />
                                    <input
                                      type="text"
                                      placeholder={`Option ${index + 1}`}
                                      value={option}
                                      onChange={(e) =>
                                        handleOptionChange(index, e.target.value)
                                      }
                                      className="block w-full sm:text-sm rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
                                      style={{
                                        backgroundColor: "white",
                                        borderColor: "#72A276",
                                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                                      }}
                                    />
                                  </div>
                                ))}
                                <p className="mt-1 text-xs text-gray-500">
                                  Select the radio button next to the correct answer
                                </p>
                              </div>
                            )}

                            {currentQuestion.type === "true_false" && (
                              <div className="mt-4">
                                <label
                                  className="block text-sm font-medium mb-2"
                                  style={{ color: "#666B6A" }}
                                >
                                  Correct Answer
                                </label>
                                <div className="flex space-x-4">
                                  <label className="inline-flex items-center">
                                    <input
                                      type="radio"
                                      name="tf_correct"
                                      checked={currentQuestion.correctAnswer === 0}
                                      onChange={() => handleCorrectAnswerChange(0)}
                                      className="mr-2"
                                    />
                                    <span>True</span>
                                  </label>
                                  <label className="inline-flex items-center">
                                    <input
                                      type="radio"
                                      name="tf_correct"
                                      checked={currentQuestion.correctAnswer === 1}
                                      onChange={() => handleCorrectAnswerChange(1)}
                                      className="mr-2"
                                    />
                                    <span>False</span>
                                  </label>
                                </div>
                              </div>
                            )}

                            <div className="mt-4">
                              <button
                                type="button"
                                onClick={addQuestion}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white"
                                style={{
                                  backgroundColor: "#86CD82",
                                  borderColor: "#72A276",
                                }}
                              >
                                Add Question
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200 mt-6">
                            <button
                              type="button"
                              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium"
                              style={{
                                backgroundColor: "white",
                                color: "#666B6A",
                                borderColor: "#666B6A",
                              }}
                              onClick={() => setActiveQuizTab("list")}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white"
                              style={{
                                backgroundColor: "#86CD82",
                                borderColor: "#72A276",
                                color: "white",
                              }}
                              onClick={saveQuiz}
                            >
                              Save Quiz
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Materials Tab */}
                  {activeTab === "materials" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Event Materials</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Attach files that will be available to attendees of this event.
                          You can control which materials are visible to attendees.
                        </p>

                        <div className="mt-4">
                          <label
                            htmlFor="file-upload"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium"
                            style={{
                              backgroundColor: "white",
                              color: "#666B6A",
                              borderColor: "#72A276",
                              cursor: "pointer",
                            }}
                          >
                            <span>Upload File</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>

                        {materials.length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-medium mb-2">Uploaded Materials:</h4>
                            <ul className="space-y-3">
                            {materials.map((material) => (
                              <li
                                key={material.id}
                                className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                              >
                                <div>
                                  <h4 className="font-medium">{material.name}</h4>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={material.visible}
                                      onChange={() => toggleMaterialVisibility(material.id)}
                                      className="mr-2 h-4 w-4 text-green-600"
                                    />
                                    Visible to attendees
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => removeMaterial(material.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </li>
                            ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200">
                        <button
                          type="button"
                          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium"
                          style={{
                            backgroundColor: "white",
                            color: "#666B6A",
                            borderColor: "#666B6A",
                          }}
                          onClick={() => setActiveTab("quizzes")}
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={loading || success}
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white"
                          style={{
                            backgroundColor: loading || success ? "#72A276" : "#86CD82",
                            borderColor: "#72A276",
                            color: "white",
                          }}
                        >
                          {loading ? "Creating..." : "Create Event"}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateEvent;