"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import api from "../utils/api";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        setLoading(true);
        const response = await api.get('/api/profile/');
        
        // Extract the user data from the response
        const userData = {
          first_name: response.data.first_name || "",
          last_name: response.data.last_name || "",
          email: response.data.email || "",
          password: ""
        };
        
        setProfile(userData);
        setFormData(userData);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError("Failed to load profile data. Please try again later.");
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // When canceling edit, reset to original data
      setFormData({...profile});
    }
    setIsEditMode(!isEditMode);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData) return;

    try {
      // Set loading state
      setLoading(true);
      
      // Make the API call to update the profile
      // The endpoint is expecting a PUT request with the updated user data
      await api.put('/api/profile/', formData);
      
      // Refresh the profile data
      await fetchProfile();
      
      // Exit edit mode
      setIsEditMode(false);
      
      // Show success message
      alert("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#EAF6FF" }}>
      <Head>
        <title>My Profile | SEES</title>
        <meta name="description" content="Your SEES platform profile" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="pb-5 border-b border-gray-200">
          <h1 className="text-2xl font-bold" style={{ color: "#08090A" }}>
            My Profile
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#666B6A" }}>
            Your personal information
          </p>
        </div>

        {loading && (
          <div className="text-center py-10">
            <p style={{ color: "#666B6A" }}>Loading profile...</p>
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

        {!loading && !error && profile && (
          <div className="mt-6">
            <div
              className="rounded-lg shadow-md overflow-hidden"
              style={{
                backgroundColor: "white",
                borderTop: "4px solid #86CD82",
              }}
            >
              <div className="p-6">
                {isEditMode ? (
                  // Edit Form
                  <form onSubmit={handleSubmit}>
                    <div className="flex justify-between mb-4">
                      <h2 className="text-xl font-semibold" style={{ color: "#08090A" }}>
                        Edit Profile
                      </h2>
                      <div>
                        <button
                          type="button"
                          onClick={handleEditToggle}
                          className="px-3 py-1 text-sm rounded-md mr-2"
                          style={{ color: "#666B6A", backgroundColor: "#F0F0F0" }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 text-sm rounded-md text-white"
                          style={{ backgroundColor: "#86CD82" }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="first_name"
                          className="block text-sm font-medium mb-1"
                          style={{ color: "#666B6A" }}
                        >
                          First Name
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          id="first_name"
                          value={formData?.first_name || ""}
                          onChange={handleChange}
                          className="p-2 w-full border rounded-md"
                          style={{ borderColor: "#E2E8F0" }}
                        />
                      </div>
                      
                      <div>
                        <label
                          htmlFor="last_name"
                          className="block text-sm font-medium mb-1"
                          style={{ color: "#666B6A" }}
                        >
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          id="last_name"
                          value={formData?.last_name || ""}
                          onChange={handleChange}
                          className="p-2 w-full border rounded-md"
                          style={{ borderColor: "#E2E8F0" }}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium mb-1"
                          style={{ color: "#666B6A" }}
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData?.email || ""}
                          onChange={handleChange}
                          className="p-2 w-full border rounded-md"
                          style={{ borderColor: "#E2E8F0" }}
                        />
                      </div>
                    </div>
                  </form>
                ) : (
                  // View Mode
                  <>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <div
                          className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold"
                          style={{ color: "#666B6A" }}
                        >
                          {profile.first_name ? profile.first_name.charAt(0).toUpperCase() : ""}
                        </div>
                        <div className="ml-4">
                          <h2
                            className="text-xl font-semibold"
                            style={{ color: "#08090A" }}
                          >
                            {profile.first_name} {profile.last_name}
                          </h2>
                          <p
                            className="text-sm"
                            style={{ color: "#666B6A" }}
                          >
                            {profile.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleEditToggle}
                        className="px-3 py-1 text-sm rounded-md text-white cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: "#86CD82" }}
                      >
                        Edit
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;