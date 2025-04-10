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
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
          email: response.data.email || ""
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
      // Reset password fields and state
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
      setIsChangingPassword(false);
      setPasswordError("");
      setPasswordSuccess("");
    }
    setIsEditMode(!isEditMode);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData) return;
    
    // Reset error/success messages
    setPasswordError("");
    setPasswordSuccess("");

    try {
      // Set loading state
      setLoading(true);
      
      // Create the payload for the API call
      const payload = { ...formData };
      
      // Add password data if password is being changed
      if (isChangingPassword) {
        // Validate passwords
        if (passwordData.new_password !== passwordData.confirm_password) {
          setPasswordError("New passwords do not match");
          setLoading(false);
          return;
        }

        if (passwordData.new_password && passwordData.new_password.length < 8) {
          setPasswordError("Password must be at least 8 characters");
          setLoading(false);
          return;
        }
        
        if (passwordData.new_password) {
          payload.password = passwordData.new_password;
          payload.current_password = passwordData.current_password;
        }
      }
      
      // Make the API call to update the profile
      await api.put('/api/profile/', payload);
      
      // Refresh the profile data
      await fetchProfile();
      
      // Exit edit mode
      setIsEditMode(false);
      
      // Reset password fields
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
      setIsChangingPassword(false);
      
      // Show success message
      alert("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      
      // Handle specific error messages from backend
      if (err.response && err.response.data) {
        if (err.response.data.error) {
          setPasswordError(err.response.data.error);
        } else if (err.response.data.message && err.response.data.message.includes("password")) {
          setPasswordError(err.response.data.message);
        } else {
          setError("Failed to update profile. Please try again.");
        }
      } else {
        setError("Failed to update profile. Please try again.");
      }
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                    
                    {/* Change Password Section */}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium" style={{ color: "#08090A" }}>
                          Change Password
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsChangingPassword(!isChangingPassword)}
                          className="text-sm font-medium"
                          style={{ color: "#5D9BD5" }}
                        >
                          {isChangingPassword ? "Cancel Password Change" : "Change Password"}
                        </button>
                      </div>
                      
                      {passwordError && (
                        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
                          {passwordError}
                        </div>
                      )}
                      
                      {passwordSuccess && (
                        <div className="mb-4 p-3 rounded-md bg-green-50 text-green-700 text-sm">
                          {passwordSuccess}
                        </div>
                      )}
                      
                      {isChangingPassword && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label
                              htmlFor="current_password"
                              className="block text-sm font-medium mb-1"
                              style={{ color: "#666B6A" }}
                            >
                              Current Password
                            </label>
                            <input
                              type="password"
                              name="current_password"
                              id="current_password"
                              value={passwordData.current_password}
                              onChange={handlePasswordChange}
                              className="p-2 w-full border rounded-md"
                              style={{ borderColor: "#E2E8F0" }}
                              required={isChangingPassword}
                            />
                          </div>
                          
                          <div>
                            <label
                              htmlFor="new_password"
                              className="block text-sm font-medium mb-1"
                              style={{ color: "#666B6A" }}
                            >
                              New Password
                            </label>
                            <input
                              type="password"
                              name="new_password"
                              id="new_password"
                              value={passwordData.new_password}
                              onChange={handlePasswordChange}
                              className="p-2 w-full border rounded-md"
                              style={{ borderColor: "#E2E8F0" }}
                              required={isChangingPassword}
                              minLength={8}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Password must be at least 8 characters
                            </p>
                          </div>
                          
                          <div>
                            <label
                              htmlFor="confirm_password"
                              className="block text-sm font-medium mb-1"
                              style={{ color: "#666B6A" }}
                            >
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              name="confirm_password"
                              id="confirm_password"
                              value={passwordData.confirm_password}
                              onChange={handlePasswordChange}
                              className="p-2 w-full border rounded-md"
                              style={{ borderColor: "#E2E8F0" }}
                              required={isChangingPassword}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </form>
                ) : (
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