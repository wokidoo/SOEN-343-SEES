"use client";
import { useState, useEffect } from "react";
import { testConnection } from "../../services/api";

// Define an interface for the response structure
interface ConnectionResponse {
  status: string;
  message: string;
}

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await testConnection();
        setConnectionStatus(result);
      } catch (err: any) {
        setError(`Failed to connect: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    checkConnection();
  }, []);

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Backend Connection Test</h1>
      {loading && <p>Testing connection to Django backend...</p>}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}
      {connectionStatus && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p>
            <strong>Status:</strong> {connectionStatus.status}
          </p>
          <p>
            <strong>Message:</strong> {connectionStatus.message}
          </p>
        </div>
      )}
    </div>
  );
}