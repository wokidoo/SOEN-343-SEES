"use client";

import React, { useState } from "react";
import Link from "next/link";
import { userService } from "../utils/api";
import { useRouter } from "next/navigation";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.login({ email, password });

      // ✅ Store token for authenticated requests
      localStorage.setItem("token", response.token);

      setSuccess(true);
      setUserData(response);

      // Clear form
      setEmail("");
      setPassword("");

      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Login failed. Please check your credentials."
      );
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
          Sign In
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            className="bg-[#86CD82] hover:bg-[#72A276] text-[#08090A] font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </div>

        <div className="text-center text-sm">
          <span className="text-[#666B6A]">Don't have an account? </span>
          <Link
            href="/register"
            className="text-[#86CD82] hover:text-[#72A276]"
          >
            Register
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
