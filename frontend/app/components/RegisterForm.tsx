"use client";

import React, { useState } from "react";
import { userService } from "../utils/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password2: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    if (formData.password !== formData.password2) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      await userService.register(formData);
      setSuccess(true);
      // Clear form
      setFormData({
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        password2: "",
      });

      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <h2 className="text-2xl mb-6 text-center font-bold text-[#08090A]">
          Register
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label
            className="block text-[#666B6A] text-sm font-bold mb-2"
            htmlFor="email"
          >
            Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-[#08090A] leading-tight focus:outline-none focus:shadow-outline focus:border-[#86CD82]"
            id="email"
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-[#666B6A] text-sm font-bold mb-2"
            htmlFor="first_name"
          >
            First Name
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-[#08090A] leading-tight focus:outline-none focus:shadow-outline focus:border-[#86CD82]"
            id="first_name"
            type="text"
            name="first_name"
            placeholder="First Name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-[#666B6A] text-sm font-bold mb-2"
            htmlFor="last_name"
          >
            Last Name
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-[#08090A] leading-tight focus:outline-none focus:shadow-outline focus:border-[#86CD82]"
            id="last_name"
            type="text"
            name="last_name"
            placeholder="Last Name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-[#666B6A] text-sm font-bold mb-2"
            htmlFor="password"
          >
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-[#08090A] leading-tight focus:outline-none focus:shadow-outline focus:border-[#86CD82]"
            id="password"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-6">
          <label
            className="block text-[#666B6A] text-sm font-bold mb-2"
            htmlFor="password2"
          >
            Confirm Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-[#08090A] leading-tight focus:outline-none focus:shadow-outline focus:border-[#86CD82]"
            id="password2"
            type="password"
            name="password2"
            placeholder="Confirm Password"
            value={formData.password2}
            onChange={handleChange}
            required
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            className="bg-[#86CD82] hover:bg-[#72A276] text-[#08090A] font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
        </div>

        <div className="text-center text-sm">
          <span className="text-[#666B6A]">Already have an account? </span>
          <Link href="/login" className="text-[#86CD82] hover:text-[#72A276]">
            Sign In
          </Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
